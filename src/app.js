import { EspnSnapshotProvider } from "./providers/espn/espn-provider.js";
import { appReducer, createStore, initialAppState } from "./application/store.js";
import { EspnCompanionClient } from "./providers/espn/companion-client.js";
import { normalizeEspnLeagueResponse } from "./providers/espn/espn-normalizer.js";
import { FantasyProsRankingProvider, evaluateFantasyProsCompatibility, reconcileFantasyProsRankings } from "./providers/rankings/ranking-provider.js";
import { buildProjectionGapReport, buildScenarioPlan } from "./domain/scenario-planner.js";
import { FutureProjectionProvider } from "./providers/projections/future-projection-provider.js";
import { ProjectionIdentityMapProvider } from "./providers/projections/projection-identity-map.js";
import { buildApprovedManualImports, fantasyProsProviderId, parseManualFantasyProsExport } from "./providers/projections/fantasypros-manual-import.js";
import { importProjectionBundle } from "./application/projection-import-transaction.js";
import { buildModelContextPacket } from "./domain/model-context-packet.js";
import { AlertPreferences } from "./domain/alert-preferences.js";
import { EspnConnectionPreferences, connectionKey, validateEspnConnection } from "./providers/espn/connection-preferences.js";
import { EspnRefreshCooldown, evaluateCompanionPing, MINIMUM_COMPANION_VERSION } from "./providers/espn/connection-health.js";
import { LocalDataManager } from "./application/local-data-manager.js";
import { runCacheMigrations } from "./application/cache-migrations.js";
import { PlanningPreferences } from "./application/planning-preferences.js";
import { OnboardingPreferences } from "./application/onboarding-preferences.js";
import { HttpSyncProvider } from "./sync/sync-provider.js";
import { renderManualProjectionDialog } from "./ui/manual-projection-dialog.js";
import { createSectionRenderer } from "./ui/section-renderer.js";
import { bindShellEvents } from "./application/app-event-bindings.js";
runCacheMigrations(globalThis.localStorage);
const provider = new EspnSnapshotProvider();
const companion = new EspnCompanionClient();
const rankingProvider = new FantasyProsRankingProvider();
const futureProjectionProvider = new FutureProjectionProvider();
let futureProjectionSet = futureProjectionProvider.readCache();
const projectionIdentityMapProvider = new ProjectionIdentityMapProvider();
let projectionIdentityMap = projectionIdentityMapProvider.readCache();
const alertPreferences = new AlertPreferences();
const syncProvider = new HttpSyncProvider({ baseUrl: "https://the-chip-winner-sync.yc6syr6bkd.workers.dev" });
const SYNC_CREDENTIALS_KEY = "the-chip-winner:sync-credentials:v1";
const connectionPreferences = new EspnConnectionPreferences();
const refreshCooldown = new EspnRefreshCooldown();
const planningPreferences = new PlanningPreferences();
const onboardingPreferences = new OnboardingPreferences();
let espnConnection = connectionPreferences.read();
let savedEspnConnections = connectionPreferences.list();
let selectedFutureWeeks = planningPreferences.read();
let pendingRankingFile = null;
let manualProjectionSession = null;
let leagueScheduleWeek = null;
let projectionImportSummary = null;
let companionHealth = { status: "checking", version: null, message: "Checking for the Chrome companion…" };
const localDataManager = new LocalDataManager({ providers: [provider, rankingProvider, futureProjectionProvider, projectionIdentityMapProvider, alertPreferences, connectionPreferences, refreshCooldown, planningPreferences, onboardingPreferences], extraKeys: [SYNC_CREDENTIALS_KEY] });
const content = document.querySelector("#app-content");
const noticeRegion = document.querySelector("#notice-region");
const teamSelect = document.querySelector("#team-select");
const appSection = () => location.hash.startsWith("#mobile-sync=") ? "overview" : location.hash.slice(1) || "overview";
const store = createStore({ ...initialAppState, section: appSection() }, appReducer);
let state = store.getState();
store.subscribe((next) => { state = next; });
const sectionRenderer = createSectionRenderer({
content, store, alertPreferences, connectionPreferences, refreshCooldown, syncProvider,
syncCredentialsKey: SYNC_CREDENTIALS_KEY, showNotice, loadRankingSet,
getContext: () => ({ state, futureProjectionSet, projectionIdentityMap, selectedFutureWeeks, selectedPlayoffWeeks: state.snapshot?.league.playoffWeeks || planningPreferences.readPlayoff(state.snapshot?.league.id, state.snapshot?.league.season), savedEspnConnections, espnConnection, companionHealth, leagueScheduleWeek, projectionImportSummary }),
});
const { render, openPlayerDetail, emptyState, escapeHtml, readStoredSyncCredentials, mobileUrl, createMobileSync, publishCurrentSync, loadMobileSyncFromUrl } = sectionRenderer;
function hydrateControls() {
const { snapshot } = state;
teamSelect.innerHTML = snapshot.teams.map((team) => `<option value="${escapeHtml(team.id)}" ${team.id === state.selectedTeamId ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("");
document.querySelector("#league-label").textContent = `ESPN · ${snapshot.league.name}`;
document.querySelector("#source-label").textContent = state.source === "sync" ? "Encrypted mobile snapshot" : snapshot.meta?.kind === "live-companion" ? "Live ESPN snapshot" : state.source === "cache" ? "Imported snapshot" : "Sample snapshot";
document.querySelector("#source-time").textContent = snapshot.meta?.capturedAt ? `Captured ${new Date(snapshot.meta.capturedAt).toLocaleDateString()}` : "Capture time unavailable";
document.querySelector("#reset-button").hidden = state.source !== "cache";
const connected = snapshot.meta?.kind === "live-companion";
const connectButton = document.querySelector("#connect-button");
connectButton.textContent = state.source === "sync" ? "Mobile snapshot" : connected ? "Refresh ESPN" : "Connect ESPN";
connectButton.disabled = state.source === "sync";
}
function loadRankingSet(rankingSet) {
if (!rankingSet || !state.snapshot) return;
const compatibility = evaluateFantasyProsCompatibility(rankingSet, state.snapshot);
store.dispatch({ type: "rankings/load", rankingSet, compatibility, reconciliation: compatibility.usable ? reconcileFantasyProsRankings(state.snapshot.players, rankingSet) : null });
}
function showNotice(message, kind = "success") {
noticeRegion.innerHTML = `<div class="notice ${kind}">${escapeHtml(message)}<button aria-label="Dismiss">×</button></div>`;
noticeRegion.querySelector("button").onclick = () => { noticeRegion.innerHTML = ""; };
}
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
function downloadCsv(filename, rows) {
const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
const url = URL.createObjectURL(blob); const link = document.createElement("a");
link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
async function openManualProjectionImport(files) {
if (!files.length) return;
const records = [];
for (const file of files) { const fallbackPosition = file.name.match(/_(QB|FLX|K|DST)\.csv$/i)?.[1]?.toUpperCase() || ""; records.push(...parseManualFantasyProsExport(await file.text(), { fileName: file.name, fallbackPosition })); }
if (new Set(records.map((item) => item.sourceKey)).size !== records.length) throw new Error("Selected FantasyPros files have duplicate names and source rows.");
manualProjectionSession = { records, approvals: [], capturedAt: new Date(Math.max(...files.map((file) => file.lastModified))).toISOString() };
document.querySelector("#manual-projection-season").value = state.snapshot.league.season || ""; document.querySelector("#manual-projection-week").value = state.snapshot.currentWeek || ""; document.querySelector("#manual-projection-scoring").value = state.snapshot.league.scoringType === "Unknown" ? "" : state.snapshot.league.scoringType || "";
renderManualProjectionDialog(manualProjectionSession, state.snapshot, state.selectedTeamId); document.querySelector("#fantasypros-manual-dialog").showModal();
}
function downloadIdentityTemplate() {
downloadCsv("the-chip-winner-player-id-map.csv", [["provider_player_id", "espn_player_id", "player_name", "team", "position"], ...state.snapshot.players.map((player) => ["", player.id, player.name, player.proTeam || "", player.position])]);
}
function downloadProjectionTemplate() {
const start = Math.max(1, Number(state.snapshot.currentWeek) || 1); const weeks = Array.from({ length: Math.min(6, 19 - start) }, (_, index) => start + index);
const providerIds = projectionIdentityMap ? [...projectionIdentityMap.keys()] : [];
downloadCsv("the-chip-winner-weekly-projections.csv", [["provider", "scoring_format", "season", "captured_at", "provider_player_id", "week", "points"], ...providerIds.flatMap((id) => weeks.map((week) => ["", state.snapshot.league.scoringType || "", state.snapshot.league.season || "", "", id, week, ""]))]);
}
function downloadProjectionGaps() {
const importedWeeks = futureProjectionSet ? [...new Set(futureProjectionSet.projections.map((item) => item.week))].sort((a, b) => a - b) : [];
const weeks = selectedFutureWeeks === null ? importedWeeks : importedWeeks.filter((week) => selectedFutureWeeks.includes(week));
const plan = buildScenarioPlan(state.snapshot, state.selectedTeamId, { weeks, projectionSet: futureProjectionSet, identityMap: projectionIdentityMap });
const report = buildProjectionGapReport(state.snapshot, plan, projectionIdentityMap);
if (!report.records.length) { showNotice(report.status === "complete" ? "All selected player-week projection inputs are complete." : report.limitation, report.status === "complete" ? "success" : "error"); return; }
downloadCsv("the-chip-winner-projection-gaps.csv", [["week", "espn_player_id", "player_name", "team", "position", "gap_type", "provider_player_id"], ...report.records.map((item) => [item.week, item.espnPlayerId, item.playerName, item.proTeam, item.position, item.gapType, item.providerPlayerId])]);
showNotice(`Downloaded ${report.records.length} missing projection input${report.records.length === 1 ? "" : "s"}. Names are for review only; imports still require explicit IDs.`);
}
function downloadModelContext() {
const result = buildModelContextPacket(state.snapshot, state.selectedTeamId);
if (!result.packet) throw new Error(result.errors.join(" "));
const blob = new Blob([JSON.stringify(result.packet, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a");
link.href = url; link.download = `the-chip-winner-model-context-week-${state.snapshot.currentWeek}.json`; link.click(); URL.revokeObjectURL(url);
}
async function init() {
store.dispatch({ type: "load/start" });
try {
if (await loadMobileSyncFromUrl()) {
hydrateControls(); render(); showNotice("Encrypted ESPN snapshot loaded from your private mobile link."); return;
}
const loaded = await provider.load();
store.dispatch({ type: "load/success", ...loaded });
if (loaded.snapshot.teams.some((team) => team.id === espnConnection.teamId)) store.dispatch({ type: "team/select", teamId: espnConnection.teamId });
loadRankingSet(rankingProvider.readCache());
hydrateControls(); render();
refreshCompanionHealth();
openOnboardingIfNeeded();
} catch (error) { store.dispatch({ type: "load/error", error: error.message }); content.innerHTML = emptyState("Unable to load league data", error.message); }
}
function openOnboardingIfNeeded() {
if (savedEspnConnections.length || onboardingPreferences.read()) return;
document.querySelector("#onboarding-league-id").value = espnConnection.leagueId;
document.querySelector("#onboarding-season-id").value = espnConnection.seasonId;
document.querySelector("#onboarding-team-id").value = espnConnection.teamId;
document.querySelector("#onboarding-dialog").showModal();
}
async function refreshCompanionHealth() {
try { companionHealth = evaluateCompanionPing(await new EspnCompanionClient({ timeoutMs: 1200 }).ping()); }
catch { companionHealth = { status: "unavailable", version: null, message: "Chrome companion not detected. Install or reload the unpacked extension, then reload this page." }; }
if (state.snapshot && state.section === "league") render();
}
teamSelect.addEventListener("change", () => { store.dispatch({ type: "team/select", teamId: teamSelect.value }); render(); });
document.querySelector("#import-button").addEventListener("click", () => document.querySelector("#snapshot-input").click());
document.querySelector("#rankings-button").addEventListener("click", () => document.querySelector("#rankings-input").click());
document.querySelector("#onboarding-save-button").addEventListener("click", () => {
try {
espnConnection = connectionPreferences.save({ leagueId: document.querySelector("#onboarding-league-id").value.trim(), seasonId: document.querySelector("#onboarding-season-id").value.trim(), teamId: document.querySelector("#onboarding-team-id").value.trim() });
savedEspnConnections = connectionPreferences.list(); onboardingPreferences.complete("connection"); document.querySelector("#onboarding-dialog").close();
if (state.section === "league") render(); showNotice("ESPN connection saved locally. Install or reload the companion, then choose Connect ESPN.");
} catch (error) { showNotice(error.message, "error"); }
});
document.querySelector("#onboarding-sample-button").addEventListener("click", () => { onboardingPreferences.complete("sample"); document.querySelector("#onboarding-dialog").close(); showNotice("Sample mode selected. Open League Setup whenever you are ready to connect ESPN."); });
document.querySelector("#connect-button").addEventListener("click", async () => {
const button = document.querySelector("#connect-button");
button.disabled = true; button.textContent = "Connecting…";
try {
const connectionValidation = validateEspnConnection(espnConnection);
if (!connectionValidation.valid) throw new Error(`Save a valid ESPN connection in League Setup first. ${connectionValidation.errors.join(" ")}`);
const health = evaluateCompanionPing(await companion.ping()); companionHealth = health;
if (health.status !== "ready") throw new Error(health.message);
const cooldown = refreshCooldown.remainingMs(connectionKey(espnConnection));
if (cooldown > 0) throw new Error(`Please wait ${Math.ceil(cooldown / 1000)} seconds before refreshing this league again.`);
refreshCooldown.mark(connectionKey(espnConnection));
const response = await companion.fetchLeague(espnConnection);
const snapshot = normalizeEspnLeagueResponse(response.data.league, response.data.meta, { availablePlayers: response.data.availablePlayers, nflScoreboard: response.data.nflScoreboard });
const previousSnapshot = provider.readCache();
provider.saveSnapshot(snapshot);
store.dispatch({ type: "load/success", snapshot, previousSnapshot, source: "cache" });
loadRankingSet(state.rankingSet || rankingProvider.readCache());
if (snapshot.teams.some((team) => team.id === espnConnection.teamId)) store.dispatch({ type: "team/select", teamId: espnConnection.teamId });
hydrateControls(); render(); showNotice(`Connected ${snapshot.league.name}. ESPN data refreshed successfully.`);
} catch (error) {
showNotice(error.message.includes("not detected") ? `${error.message} See the setup guide in the repository.` : `${error.message} Make sure ESPN is signed in within this Chrome profile.`, "error");
} finally {
button.disabled = false;
if (state.snapshot) hydrateControls();
}
});
document.querySelector("#snapshot-input").addEventListener("change", async (event) => {
try {
const file = event.target.files[0]; if (!file) return;
const previousSnapshot = provider.readCache();
const snapshot = provider.importSnapshot(await file.text()); store.dispatch({ type: "load/success", snapshot, previousSnapshot, source: "cache" });
loadRankingSet(state.rankingSet || rankingProvider.readCache());
hydrateControls(); render(); showNotice(`Imported ${file.name}. Data is cached in this browser.`);
} catch (error) { showNotice(error.message, "error"); }
event.target.value = "";
});
document.querySelector("#rankings-input").addEventListener("change", async (event) => {
const file = event.target.files[0]; if (!file) return;
pendingRankingFile = file;
document.querySelector("#rankings-season").value = state.snapshot.league.season || "";
document.querySelector("#rankings-scoring").value = "";
document.querySelector("#rankings-experts").value = "";
document.querySelector("#rankings-metadata-dialog").showModal();
});
document.querySelector("#rankings-import-confirm").addEventListener("click", async () => {
try {
if (!pendingRankingFile) throw new Error("Choose a FantasyPros rankings CSV first.");
const rankingSet = rankingProvider.importCsv(await pendingRankingFile.text(), { kind: "rest-of-season", season: Number(document.querySelector("#rankings-season").value), scoringFormat: document.querySelector("#rankings-scoring").value, expertFilter: document.querySelector("#rankings-experts").value });
loadRankingSet(rankingSet); render();
const reconciliation = state.rankingReconciliation;
showNotice(`Imported ${rankingSet.rankings.length} FantasyPros ROS rankings. ${Object.keys(reconciliation.byPlayerId).length} matched ESPN players; ${reconciliation.unresolved.length} remain unresolved.`);
document.querySelector("#rankings-metadata-dialog").close(); pendingRankingFile = null; document.querySelector("#rankings-input").value = "";
} catch (error) { showNotice(error.message, "error"); }
});
document.querySelector("#rankings-import-cancel").addEventListener("click", () => { document.querySelector("#rankings-metadata-dialog").close(); pendingRankingFile = null; document.querySelector("#rankings-input").value = ""; });
document.querySelector("#fantasypros-manual-input").addEventListener("change", async (event) => {
try { await openManualProjectionImport([...event.target.files]); }
catch (error) { showNotice(error.message, "error"); }
event.target.value = "";
});
document.querySelector("#manual-approve-button").addEventListener("click", () => {
try {
const sourceKey = document.querySelector("#manual-source-row").value; const espnPlayerId = document.querySelector("#manual-espn-player").value; const profileUrl = document.querySelector("#manual-profile-url").value.trim();
if (!sourceKey || !espnPlayerId) throw new Error("Choose both a FantasyPros row and ESPN player."); fantasyProsProviderId(profileUrl);
manualProjectionSession.approvals.push({ sourceKey, espnPlayerId, profileUrl }); document.querySelector("#manual-profile-url").value = ""; renderManualProjectionDialog(manualProjectionSession, state.snapshot, state.selectedTeamId);
} catch (error) { showNotice(error.message, "error"); }
});
document.querySelector("#manual-approved-list").addEventListener("click", (event) => { const button = event.target.closest("[data-remove-manual-approval]"); if (!button) return; manualProjectionSession.approvals.splice(Number(button.dataset.removeManualApproval), 1); renderManualProjectionDialog(manualProjectionSession, state.snapshot, state.selectedTeamId); });
document.querySelector("#manual-import-confirm").addEventListener("click", () => {
try {
const result = buildApprovedManualImports({ records: manualProjectionSession.records, approvals: manualProjectionSession.approvals, season: Number(document.querySelector("#manual-projection-season").value), week: Number(document.querySelector("#manual-projection-week").value), scoringFormat: document.querySelector("#manual-projection-scoring").value, capturedAt: manualProjectionSession.capturedAt });
const imported = importProjectionBundle({ projectionProvider: futureProjectionProvider, identityProvider: projectionIdentityMapProvider, projectionsCsv: result.projectionsCsv, identityMapCsv: result.identityMapCsv });
futureProjectionSet = imported.projectionSet; projectionIdentityMap = imported.identityMap; projectionImportSummary = imported.summary; selectedFutureWeeks = planningPreferences.save([...new Set(futureProjectionSet.projections.map((item) => item.week))]);
document.querySelector("#fantasypros-manual-dialog").close(); manualProjectionSession = null; render(); showNotice(`Import complete: ${projectionImportSummary.added} added, ${projectionImportSummary.updated} updated, ${projectionImportSummary.retained} retained, ${projectionImportSummary.ignoredOlder} older ignored.`);
} catch (error) { showNotice(error.message, "error"); }
});
document.querySelector("#manual-import-cancel").addEventListener("click", () => { document.querySelector("#fantasypros-manual-dialog").close(); manualProjectionSession = null; });
document.querySelector("#reset-button").addEventListener("click", () => { provider.clearCache(); showNotice("Imported snapshot cleared. Loading sample data…"); setTimeout(() => location.reload(), 250); });
content.addEventListener("click", (event) => {
if (!event.target.closest("#save-connection-button")) return;
try {
espnConnection = connectionPreferences.save({ leagueId: document.querySelector("#connection-league-id").value.trim(), seasonId: document.querySelector("#connection-season-id").value.trim(), teamId: document.querySelector("#connection-team-id").value.trim() });
savedEspnConnections = connectionPreferences.list(); render();
showNotice("ESPN connection saved locally. Use Connect ESPN to refresh this league.");
} catch (error) { showNotice(error.message, "error"); }
});
content.addEventListener("change", (event) => {
if (event.target.id !== "saved-connection-select") return;
try { espnConnection = connectionPreferences.activate(event.target.value); render(); showNotice("Saved ESPN connection selected. Use Connect ESPN to refresh it."); }
catch (error) { showNotice(error.message, "error"); }
});
content.addEventListener("change", (event) => { if (event.target.id === "league-schedule-week") { leagueScheduleWeek = Number(event.target.value); render(); } });
content.addEventListener("click", (event) => {
if (!event.target.closest("#remove-connection-button")) return;
connectionPreferences.remove(connectionKey(espnConnection)); savedEspnConnections = connectionPreferences.list(); espnConnection = connectionPreferences.read(); render(); showNotice("Saved ESPN connection removed.");
});
content.addEventListener("click", (event) => { if (event.target.closest("#clear-rankings-button")) { rankingProvider.clearCache(); store.dispatch({ type: "rankings/clear" }); render(); showNotice("FantasyPros rankings removed from this browser."); } });
content.addEventListener("click", (event) => {
if (event.target.closest("#manual-projections-button")) document.querySelector("#fantasypros-manual-input").click();
if (event.target.closest("#clear-future-projections-button")) { futureProjectionProvider.clearCache(); projectionIdentityMapProvider.clearCache(); planningPreferences.clear(); futureProjectionSet = null; projectionIdentityMap = null; selectedFutureWeeks = null; render(); showNotice("Weekly projections and ID mappings removed from this browser."); }
if (event.target.closest("#download-projection-template")) downloadProjectionTemplate();
if (event.target.closest("#download-identity-template")) downloadIdentityTemplate();
if (event.target.closest("#download-projection-gaps")) downloadProjectionGaps();
if (event.target.closest("#download-model-context")) downloadModelContext();
});
content.addEventListener("change", (event) => {
if (!event.target.matches("[data-planning-week]")) return;
selectedFutureWeeks = planningPreferences.save([...content.querySelectorAll("[data-planning-week]:checked")].map((input) => Number(input.dataset.planningWeek)));
render(); showNotice(selectedFutureWeeks.length ? `Planning horizon updated to ${selectedFutureWeeks.length} week${selectedFutureWeeks.length === 1 ? "" : "s"}.` : "Planning horizon cleared. No future totals or deltas are shown.");
});
content.addEventListener("change", (event) => {
if (!event.target.matches("[data-playoff-week]") || state.snapshot.league.playoffWeeks) return;
const weeks = planningPreferences.savePlayoff(state.snapshot.league.id, state.snapshot.league.season, [...content.querySelectorAll("[data-playoff-week]:checked")].map((input) => Number(input.dataset.playoffWeek)));
render(); showNotice(weeks.length ? `Local playoff weeks set to ${weeks.join(", ")}.` : "Local playoff weeks cleared.");
});
content.addEventListener("click", async (event) => {
const action = event.target.closest("#create-sync-button, #refresh-sync-button, #copy-sync-button, #revoke-sync-button");
if (!action) return;
const originalLabel = action.textContent;
const busyLabels = {
"create-sync-button": "Creating…",
"refresh-sync-button": "Refreshing…",
"copy-sync-button": "Copying…",
"revoke-sync-button": "Revoking…",
};
action.disabled = true;
action.textContent = busyLabels[action.id] || originalLabel;
try {
if (action.id === "create-sync-button") await createMobileSync();
if (action.id === "refresh-sync-button") { await publishCurrentSync(readStoredSyncCredentials()); showNotice("Mobile data refreshed."); }
if (action.id === "copy-sync-button") { await navigator.clipboard.writeText(mobileUrl(readStoredSyncCredentials())); showNotice("Private mobile link copied."); }
if (action.id === "revoke-sync-button") { const credentials = readStoredSyncCredentials(); await syncProvider.remove(credentials.channelId, credentials.writeToken); localStorage.removeItem(SYNC_CREDENTIALS_KEY); render(); showNotice("Mobile link revoked."); }
} catch (error) {
showNotice(error.message, "error");
} finally {
if (action.isConnected) {
action.disabled = false;
action.textContent = originalLabel;
}
}
});
content.addEventListener("click", async (event) => {
if (!event.target.closest("#clear-local-data-button")) return;
if (!confirm("Clear all The Chip Winner data stored in this browser and disconnect the saved ESPN league?")) return;
const credentials = readStoredSyncCredentials(); let remoteRevoked = true;
if (credentials) { try { await syncProvider.remove(credentials.channelId, credentials.writeToken); } catch { remoteRevoked = false; } }
localDataManager.clearAll();
showNotice(remoteRevoked ? "Local data cleared. Loading the sample league…" : "Local data cleared, but the encrypted mobile snapshot could not be revoked. It will expire automatically.", remoteRevoked ? "success" : "error");
setTimeout(() => location.reload(), 600);
});
bindShellEvents({ content, store, appSection, render, openPlayerDetail, alertPreferences, showNotice });
init();
