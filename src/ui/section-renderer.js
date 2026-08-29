import { isStarter } from "../domain/model.js";
import { buildLineupSuggestions, buildLineupVacancies, buildPrioritizedWarnings, buildWarnings, compareRosterPlayers } from "../domain/recommendations.js";
import { selectDataCoverage, selectLeagueMatchups, selectLeagueStandings, selectPlayerDetail, selectProjectedTotal, selectSnapshotFreshness, selectTeamContext, selectTeamSchedule } from "../domain/selectors.js";
import { buildRosWaiverIdeas, selectRosterRosCoverage } from "../domain/ros-analysis.js";
import { optimizeLineup } from "../domain/lineup-optimizer.js";
import { changesForTeam, diffSnapshots } from "../domain/snapshot-diff.js";
import { buildRosterAwareWaiverIdeas } from "../domain/waiver-engine.js";
import { buildRosterPlan } from "../domain/roster-planning.js";
import { buildProjectionCoverageMatrix, buildScenarioPlan } from "../domain/scenario-planner.js";
import { evaluateFutureProjectionCompatibility } from "../providers/projections/future-projection-provider.js";
import { alertId } from "../domain/alert-preferences.js";
import { diffLineupRecommendations } from "../domain/recommendation-change.js";
import { connectionKey } from "../providers/espn/connection-preferences.js";
import { MINIMUM_COMPANION_VERSION } from "../providers/espn/connection-health.js";
import { renderTeamScheduleCard } from "./season-schedule.js";
import { renderAcquisitionSettingsCard } from "./acquisition-settings.js";
import { createMobileSyncFragment, createSyncCredentials, parseMobileSyncFragment } from "../sync/crypto.js";
import { publishSyncState, readSyncState } from "../sync/sync-session.js";
import { buildWeeklyChecklist } from "../domain/weekly-checklist.js";
import { renderExternalProjectionDetail } from "./external-projection-detail.js";
import { renderStartSitComparison } from "./start-sit-comparison.js";
export function createSectionRenderer(deps) {
let state, futureProjectionSet, projectionIdentityMap, selectedFutureWeeks, savedEspnConnections, espnConnection, companionHealth, leagueScheduleWeek, projectionImportSummary;
const { content, store, alertPreferences, connectionPreferences, refreshCooldown, syncProvider, syncCredentialsKey, showNotice, loadRankingSet } = deps;
const SYNC_CREDENTIALS_KEY = syncCredentialsKey;
const syncContext = () => ({ state, futureProjectionSet, projectionIdentityMap, selectedFutureWeeks, savedEspnConnections, espnConnection, companionHealth, leagueScheduleWeek, projectionImportSummary } = deps.getContext());
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const projection = (value) => value == null ? '<span class="missing">Not available</span>' : `${value.toFixed(1)} pts`;
const initials = (name) => name.split(" ").map((part) => part[0]).slice(0, 2).join("");
const formatRecord = (record) => Number.isInteger(record?.wins) && Number.isInteger(record?.losses) ? `${record.wins}-${record.losses}${record.ties ? `-${record.ties}` : ""}` : "Record unavailable";
const gameTime = (value) => {
if (!value) return "Time unavailable";
const parsed = Date.parse(value);
return Number.isFinite(parsed) ? new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(parsed) : value;
};
function playerRow(entry, player) {
const status = player.injury?.status && player.injury.status !== "ACTIVE" ? player.injury.status : null;
const ros = state.rankingReconciliation?.byPlayerId?.[player.id];
return `<div class="player-row interactive-row" data-player-id="${escapeHtml(player.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(player.name)} details">
<span class="slot">${escapeHtml(entry.lineupSlot)}</span>
<span class="avatar pos-${escapeHtml(player.position).replace("/", "")}">${initials(player.name)}</span>
<span class="player-main"><strong>${escapeHtml(player.name)}${ros ? ` <span class="ros-rank">ROS #${ros.rank}</span>` : ""}</strong><small>${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "Team unavailable")} vs ${escapeHtml(player.opponent || "Opponent unavailable")}</small></span>
${status ? `<span class="tag danger">${escapeHtml(status)}</span>` : `<span class="game-time">${escapeHtml(gameTime(player.gameTime))}</span>`}
<span class="player-proj"><strong>${player.projection == null ? "—" : player.projection.toFixed(1)}</strong><small>projected</small></span>
</div>`;
}
function getViewModel() {
return selectTeamContext(state.snapshot, state.selectedTeamId);
}
function renderOverview() {
const { snapshot, selectedTeamId } = state;
const { index, team, starters, bench, opponent } = getViewModel();
if (!team) return emptyState("Team unavailable", "This snapshot does not contain the selected team.");
const starterProjection = selectProjectedTotal(starters, index.players);
const starterTotal = starterProjection.total;
const opponentRoster = opponent ? index.rosters.get(opponent.id)?.entries || [] : [];
const opponentProjection = selectProjectedTotal(opponentRoster.filter((e) => isStarter(e.lineupSlot)), index.players);
const opponentTotal = opponentProjection.total;
const matchupProjectionComplete = starterProjection.complete && opponentProjection.complete && starterProjection.totalCount === opponentProjection.totalCount;
const suggestions = buildLineupSuggestions(snapshot, selectedTeamId);
const warnings = buildWarnings(snapshot, selectedTeamId);
const vacancies = buildLineupVacancies(snapshot, selectedTeamId);
const checklist = buildWeeklyChecklist(snapshot, selectedTeamId);
const coverage = selectDataCoverage(snapshot, selectedTeamId);
const freshness = selectSnapshotFreshness(snapshot);
const rankingMatches = state.rankingReconciliation ? Object.keys(state.rankingReconciliation.byPlayerId).length : 0;
const rosterRosCoverage = selectRosterRosCoverage(snapshot, selectedTeamId, state.rankingReconciliation);
const knownAttentionCount = warnings.length + (vacancies.totalMissing || 0);
const vacancySignals = vacancies.items.map((item) => `<div class="signal warning"><span class="signal-icon">E</span><div><strong>${item.missingCount} empty ${escapeHtml(item.slot)} slot${item.missingCount === 1 ? "" : "s"}</strong><small>ESPN requires ${item.requiredCount}; ${item.filledCount} currently filled.</small></div></div>`);
const suggestionSignals = suggestions.map((item) => `<div class="signal"><span class="signal-icon">↗</span><div><strong>Start ${escapeHtml(item.start.name)}</strong><small>Over ${escapeHtml(item.sit.name)} · +${item.gain} projected</small></div></div>`);
const warningSignals = warnings.map((item) => `<div class="signal warning"><span class="signal-icon">!</span><div><strong>${escapeHtml(item.player.name)} · ${escapeHtml(item.kind)}</strong><small>${escapeHtml(item.detail || `Week ${snapshot.currentWeek} attention needed`)}</small></div></div>`);
const quickSignals = [...vacancySignals, ...warningSignals, ...suggestionSignals].slice(0, 2);
content.innerHTML = `<div class="page-head"><div><p class="eyebrow">WEEK ${snapshot.currentWeek}</p><h2>Good week to make a move.</h2><p>Your roster, matchup, and highest-confidence flags in one place.</p></div><span class="week-pill">Regular season · Week ${snapshot.currentWeek}</span></div>
<div class="stat-grid">
<article class="stat-card"><span>Projected points</span><strong>${starterProjection.knownCount ? starterTotal.toFixed(1) : "—"}</strong><small>${starterProjection.complete ? "Current starting lineup" : `${starterProjection.knownCount}/${starterProjection.totalCount} projections available`}</small></article>
<article class="stat-card"><span>Matchup</span><strong>${opponent ? `vs ${escapeHtml(opponent.abbreviation)}` : "Unavailable"}</strong><small>${opponent ? `${escapeHtml(opponent.name)} · ${formatRecord(opponent.record)}` : "No current-week matchup found"}</small></article>
<article class="stat-card"><span>Lineup edge</span><strong class="${starterTotal >= opponentTotal ? "positive" : "negative"}">${matchupProjectionComplete ? `${starterTotal >= opponentTotal ? "+" : ""}${(starterTotal - opponentTotal).toFixed(1)}` : "—"}</strong><small>${matchupProjectionComplete ? "Complete starting projections" : "Incomplete matchup data"}</small></article>
<article class="stat-card"><span>Needs attention</span><strong>${knownAttentionCount}</strong><small>${warnings.filter((w) => w.kind === "injury").length} injury · ${warnings.filter((w) => w.kind === "bye").length} bye · ${vacancies.totalMissing == null ? "lineup check unavailable" : `${vacancies.totalMissing} empty`}</small></article>
</div>
<div class="dashboard-grid">
<article class="panel roster-panel"><div class="panel-head"><div><p class="eyebrow">MY TEAM</p><h3>${escapeHtml(team.name)}</h3></div><span class="record">${formatRecord(team.record)}</span></div>
<div class="list-heading"><span>STARTERS</span><span>WEEK ${snapshot.currentWeek}</span></div>${starters.length ? starters.map((e) => playerRow(e, index.players.get(e.playerId))).join("") : emptyInline("No starters in snapshot")}
<div class="list-heading bench-heading"><span>BENCH</span><span>${bench.length} PLAYERS</span></div>${bench.length ? bench.map((e) => playerRow(e, index.players.get(e.playerId))).join("") : emptyInline("No bench players in snapshot")}
</article>
<div class="side-stack">
<article class="panel matchup-card"><div class="panel-head"><div><p class="eyebrow">MATCHUP</p><h3>Week ${snapshot.currentWeek}</h3></div><span class="live-dot">UPCOMING</span></div>
${opponent ? `<div class="matchup-team"><span class="team-badge">${escapeHtml(team.abbreviation)}</span><div><strong>${escapeHtml(team.name)}</strong><small>${formatRecord(team.record)}</small></div><b>${starterTotal ? starterTotal.toFixed(1) : "—"}</b></div><div class="versus"><span></span>VS<span></span></div><div class="matchup-team"><span class="team-badge opponent">${escapeHtml(opponent.abbreviation)}</span><div><strong>${escapeHtml(opponent.name)}</strong><small>${formatRecord(opponent.record)}</small></div><b>${opponentTotal ? opponentTotal.toFixed(1) : "—"}</b></div>` : emptyInline("Current-week opponent unavailable")}
</article>
<article class="panel checklist-card"><div class="panel-head"><div><p class="eyebrow">BEFORE KICKOFF</p><h3>Weekly checklist</h3></div><span class="quality ${checklist.needsActionCount ? "aging" : checklist.status === "ready" ? "fresh" : "unknown"}">${checklist.needsActionCount ?? "—"} to review</span></div>
<div class="checklist-list">${checklist.items.length ? checklist.items.slice(0, 4).map((item) => item.playerId ? `<div class="checklist-item ${escapeHtml(item.status)} interactive-row" data-player-id="${escapeHtml(item.playerId)}" role="button" tabindex="0" aria-label="Review ${escapeHtml(item.title)}"><span>${item.status === "needs-action" ? "!" : item.status === "locked" ? "✓" : "?"}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></div></div>` : `<a class="checklist-item ${escapeHtml(item.status)}" href="${escapeHtml(item.destination)}"><span>!</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></div></a>`).join("") : emptyInline("No reported weekly issues found")}</div>
${checklist.items.length > 4 ? `<a class="text-link" href="#alerts">Review ${checklist.items.length - 4} more checklist item${checklist.items.length - 4 === 1 ? "" : "s"} →</a>` : ""}${checklist.limitations.length ? `<p class="data-note">${escapeHtml(checklist.limitations[0])}</p>` : ""}
</article>
<article class="panel"><div class="panel-head"><div><p class="eyebrow">QUICK READ</p><h3>Lineup signals</h3></div><a href="#lineup">Open lab →</a></div>
${quickSignals.length ? quickSignals.join("") : emptyInline(vacancies.status === "missing-settings" ? "Lineup rules unavailable; no other signals found" : "No lineup signals found")}
</article>
<article class="panel"><div class="panel-head"><div><p class="eyebrow">DATA QUALITY</p><h3>Snapshot coverage</h3></div><span class="quality ${freshness.status}">${freshness.status}</span></div>
${qualityBar("Roster projections", coverage.projections)}${qualityBar("Injury statuses", coverage.injuries)}${qualityBar("NFL opponents", coverage.opponents)}
${state.rankingSet ? `<div class="ranking-health"><strong>FantasyPros ROS · ${escapeHtml(state.rankingCompatibility?.status || "unavailable")}</strong><span>${state.rankingCompatibility?.usable ? `${rosterRosCoverage.matched}/${rosterRosCoverage.total} roster players matched · ${rankingMatches} league-pool matches · ${state.rankingReconciliation?.conflicts.length || 0} conflicts` : escapeHtml(state.rankingCompatibility?.errors.join(" ") || "Compatibility unavailable.")}</span></div>` : ""}
<p class="data-note">Waiver availability: <strong>${coverage.availability ? "included" : "not provided"}</strong>. Recommendations only use reported fields.</p>
</article>
</div>
</div>`;
}
function renderLineup() {
const suggestions = buildLineupSuggestions(state.snapshot, state.selectedTeamId);
const optimized = optimizeLineup(state.snapshot, state.selectedTeamId);
const { index, roster } = getViewModel();
const rosterPlayers = roster.map((entry) => index.players.get(entry.playerId)).filter(Boolean);
content.innerHTML = sectionHeader("Lineup Lab", "Projection-based comparisons from the data in your snapshot. No confidence is implied when inputs are missing.") +
`<article class="panel optimizer-summary"><div><p class="eyebrow">COMPLETE LINEUP SEARCH</p><h3>${optimized.status === "optimal" ? "Optimal known lineup" : optimized.status === "best-known" ? "Best known lineup" : "Optimization unavailable"}</h3><p>${escapeHtml(optimized.reason)}</p>${optimized.locks?.length ? `<p class="optimizer-locks">${optimized.locks.length} roster lock${optimized.locks.length === 1 ? "" : "s"} respected because ESPN reported a lock or kickoff passed.</p>` : ""}</div>${optimized.projectedTotal == null ? "" : `<div class="optimizer-score"><strong>${optimized.projectedTotal.toFixed(1)}</strong><span>${optimized.gain > 0 ? `+${optimized.gain.toFixed(1)} vs current` : "No projected gain"}</span></div>`}</article>
${optimized.recommendedChanges?.length ? `<div class="optimizer-grid">${optimized.recommendedChanges.map(item => `<article class="panel optimizer-change"><span>${escapeHtml(item.slot)}</span><strong>${escapeHtml(item.player.name)}</strong><small>Replaces ${escapeHtml(index.players.get(item.previousPlayerId)?.name || "current player")} · ${item.player.projection.toFixed(1)} projected</small></article>`).join("")}</div>` : ""}
<article class="panel comparison-tool"><div class="panel-head"><div><p class="eyebrow">START / SIT</p><h3>Compare roster players</h3></div><span class="source-chip">${escapeHtml(state.snapshot.meta?.projectionsSource || "Source unavailable")}</span></div><div class="comparison-controls"><label>Player one<select id="compare-first">${comparisonOptions(rosterPlayers, rosterPlayers[0]?.id)}</select></label><span>VS</span><label>Player two<select id="compare-second">${comparisonOptions(rosterPlayers, rosterPlayers[1]?.id)}</select></label></div><div id="comparison-result"></div></article>
<div class="section-divider"><span>OPTIMIZATION SIGNALS</span></div><div class="recommendation-grid">${suggestions.length ? suggestions.map(s => `<article class="panel recommendation"><span class="recommendation-kicker">${escapeHtml(s.slot)} SWAP</span><div class="compare"><div><small>START</small><strong>${escapeHtml(s.start.name)}</strong><span>${projection(s.start.projection)}</span></div><span class="swap-arrow">→</span><div><small>SIT</small><strong>${escapeHtml(s.sit.name)}</strong><span>${projection(s.sit.projection)}</span></div></div><div class="gain">+${s.gain} projected points</div><p>${escapeHtml(s.reason)}. Verify late news before making a move.</p></article>`).join("") : emptyState("No lineup changes identified", "Available projections do not show a higher-scoring eligible bench option. This is not a guarantee that your lineup is optimal.")}</div>`;
const updateComparison = () => {
const result = compareRosterPlayers(state.snapshot, state.selectedTeamId, document.querySelector("#compare-first").value, document.querySelector("#compare-second").value);
document.querySelector("#comparison-result").innerHTML = renderStartSitComparison(result, futureProjectionSet, projectionIdentityMap, state.snapshot);
};
document.querySelector("#compare-first").addEventListener("change", updateComparison);
document.querySelector("#compare-second").addEventListener("change", updateComparison);
updateComparison();
}
function renderWaivers() {
const result = buildRosterAwareWaiverIdeas(state.snapshot, state.selectedTeamId);
const body = result.status === "missing-availability" ? emptyState("Availability data missing", "This ESPN snapshot does not include free-agent availability. Refresh ESPN before evaluating waiver moves.") : result.status === "acquisition-limit-reached" ? emptyState("Acquisition limit reached", result.limitations[0]) : result.status === "incomplete-lineup" ? emptyState("Lineup impact unavailable", result.limitations[0]) : result.items.length ? result.items.map(item => `<article class="panel waiver-row interactive-row" data-player-id="${escapeHtml(item.add.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.add.name)} details"><span class="avatar pos-${item.add.position.replace("/", "")}">${initials(item.add.name)}</span><div><small>CURRENT-WEEK ADD · ${escapeHtml(formatAvailability(item.add.availabilityStatus))}</small><strong>${escapeHtml(item.add.name)}</strong><span>${escapeHtml(item.add.position)} · ${projection(item.add.projection)}</span></div><span class="swap-arrow">for</span><div><small>UNLOCKED BENCH DROP</small><strong>${escapeHtml(item.drop.name)}</strong><span>${escapeHtml(item.drop.position)} · ${escapeHtml(item.reason)}</span></div><b class="positive">+${item.lineupGain}</b></article>`).join("") : emptyState("No clear lineup upgrades", "No ESPN-available player improves the strongest known legal lineup by at least 0.5 points after an unlocked bench drop.");
const ros = buildRosWaiverIdeas(state.snapshot, state.selectedTeamId, state.rankingReconciliation);
const rosBody = result.status === "acquisition-limit-reached" ? emptyState("Acquisition limit reached", result.limitations[0]) : state.rankingSet && !state.rankingCompatibility?.usable ? emptyState("Rankings blocked", state.rankingCompatibility?.errors.join(" ") || "The imported rankings do not match this ESPN league.") : ros.status === "missing-rankings" ? emptyState("Import ROS rankings", "Add a compatible FantasyPros ROS CSV to compare season-long ranks without replacing ESPN weekly projections.") : ros.status === "missing-availability" ? emptyState("Availability data missing", "ESPN availability is required before an ROS add/drop comparison can be made.") : ros.items.length ? ros.items.map(item => `<article class="panel waiver-row interactive-row" data-player-id="${escapeHtml(item.add.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.add.name)} details"><span class="avatar pos-${item.add.position.replace("/", "")}">${initials(item.add.name)}</span><div><small>ROS ADD · ${escapeHtml(formatAvailability(item.add.availabilityStatus))}</small><strong>${escapeHtml(item.add.name)}</strong><span>${escapeHtml(item.add.position)} · FantasyPros #${item.addRanking.rank}</span></div><span class="swap-arrow">for</span><div><small>ROS DROP COMPARISON</small><strong>${escapeHtml(item.drop.name)}</strong><span>${escapeHtml(item.drop.position)} · FantasyPros #${item.dropRanking.rank}</span></div><b class="positive">↑${item.rankImprovement}</b></article>`).join("") : emptyState("No ROS rank upgrades found", "No available same-position player ranks ahead of a reconciled roster player in the imported FantasyPros file.");
const limitations = result.limitations?.length ? `<article class="panel waiver-limitations"><strong>Before acting</strong>${result.limitations.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</article>` : "";
content.innerHTML = sectionHeader("Waiver Wire", "Weekly lineup impact and rest-of-season rankings stay separate so each comparison says exactly what it measures.") + `<div class="section-divider"><span>THIS WEEK · FULL-LINEUP IMPACT</span></div><div class="waiver-list">${body}</div>${limitations}<div class="section-divider ros-divider"><span>REST OF SEASON · FANTASYPROS PPR</span></div><div class="waiver-list">${rosBody}</div>`;
}
function renderAlerts() {
const warnings = buildPrioritizedWarnings(state.snapshot, state.selectedTeamId);
const vacancies = buildLineupVacancies(state.snapshot, state.selectedTeamId);
const dismissed = alertPreferences.read(); const visible = warnings.filter((warning) => !dismissed.has(alertId(warning, state.snapshot.currentWeek))); const dismissedCount = warnings.length - visible.length;
const vacancyBody = vacancies.items.map((item) => `<article class="panel alert-row vacancy-row"><span class="alert-symbol vacancy">E</span><div><small>LINEUP VACANCY · ${escapeHtml(item.slot)}</small><strong>${item.missingCount} empty ${escapeHtml(item.slot)} slot${item.missingCount === 1 ? "" : "s"}</strong><p>ESPN reports ${item.requiredCount} required and ${item.filledCount} currently filled. No replacement player is assumed.</p></div></article>`).join("");
const vacancyLimitation = vacancies.limitation ? `<article class="panel alert-data-note"><strong>Lineup vacancy check ${vacancies.status === "partial" ? "is partial" : "unavailable"}</strong><p>${escapeHtml(vacancies.limitation)}</p></article>` : "";
content.innerHTML = sectionHeader("Player Alerts", "Empty lineup slots, injuries, and bye-week flags reported by the current source data. No replacement player is assumed.") + `${vacancyBody}${vacancyLimitation}${dismissedCount ? `<div class="alert-toolbar"><span>${dismissedCount} alert${dismissedCount === 1 ? "" : "s"} dismissed for Week ${state.snapshot.currentWeek}</span><button class="button ghost" id="restore-alerts-button">Restore</button></div>` : ""}<div class="alert-list">${visible.length ? visible.map(w => `<article class="panel alert-row"><span class="alert-symbol ${w.kind}">${w.kind === "injury" ? "!" : "B"}</span><div class="alert-open interactive-row" data-player-id="${escapeHtml(w.player.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(w.player.name)} details"><small>${escapeHtml(w.urgency.toUpperCase())} · ${escapeHtml(w.kind.toUpperCase())} · ${escapeHtml(w.lineupSlot)}</small><strong>${escapeHtml(w.player.name)}</strong><p>${escapeHtml(w.detail || (w.kind === "bye" ? `Bye in Week ${state.snapshot.currentWeek}` : `Status: ${w.player.injury.status}`))}${w.hoursToKickoff != null ? ` · ${w.hoursToKickoff}h to kickoff` : " · kickoff unavailable"}</p></div><button class="alert-dismiss" data-dismiss-alert="${escapeHtml(alertId(w, state.snapshot.currentWeek))}" aria-label="Dismiss ${escapeHtml(w.player.name)} alert">×</button></article>`).join("") : emptyState(dismissedCount ? "All player alerts dismissed" : "No player alerts in this snapshot", dismissedCount ? "Restore dismissed alerts whenever you want to review them again." : "No injuries or current-week byes were reported for this roster.")}</div>`;
}
function renderChanges() {
if (!state.previousSnapshot) {
content.innerHTML = sectionHeader("What Changed", "A timeline appears after two valid ESPN captures from the same league.") + emptyState("One more refresh needed", "Refresh ESPN again after league data changes. The previous valid snapshot is kept separately and compared locally.");
return;
}
const allChanges = diffSnapshots(state.previousSnapshot, state.snapshot);
const changes = [...changesForTeam(allChanges, state.snapshot, state.selectedTeamId), ...diffLineupRecommendations(state.previousSnapshot, state.snapshot, state.selectedTeamId)];
const captured = state.snapshot.meta?.capturedAt ? new Date(state.snapshot.meta.capturedAt).toLocaleString() : "Capture time unavailable";
content.innerHTML = sectionHeader("What Changed", "Derived locally by comparing the two most recent valid ESPN snapshots.") + `<article class="panel timeline-summary"><div><p class="eyebrow">LATEST REFRESH</p><h3>${changes.length} relevant change${changes.length === 1 ? "" : "s"}</h3><p>Observed ${escapeHtml(captured)} · ${allChanges.length} across the league</p></div><span class="quality ${changes.length ? "aging" : "fresh"}">${changes.length ? "Review" : "No changes"}</span></article><div class="timeline">${changes.length ? changes.map((change) => `<article class="panel timeline-item ${escapeHtml(change.kind)}" ${change.playerId ? `data-player-id="${escapeHtml(change.playerId)}" role="button" tabindex="0"` : ""}><span class="timeline-icon">${change.kind === "injury" ? "!" : change.kind === "lineup" ? "↕" : change.kind === "projection" ? "±" : change.kind === "matchup" ? "#" : change.kind === "acquisition" || change.kind === "waiver-settings" ? "$" : "+"}</span><div><small>${escapeHtml(change.kind.replaceAll("-", " ").toUpperCase())}</small><strong>${escapeHtml(change.title)}</strong><p>${escapeHtml(change.detail)}</p></div></article>`).join("") : emptyState("Nothing meaningful changed", "The latest snapshot matches the previous one for this team. Identical refreshes do not create duplicate events.")}</div>`;
}
function renderSeasonPlan() {
const plan = buildRosterPlan(state.snapshot, state.selectedTeamId, state.rankingReconciliation);
if (plan.status === "missing-roster") {
content.innerHTML = sectionHeader("Season Plan", "Roster depth, bye-week conflicts, and explicit playoff context from your current data.") + emptyState("Roster unavailable", "Refresh ESPN to build a season plan for this team.");
return;
}
const depth = plan.positions.length ? plan.positions.map(group => `<article class="panel plan-group"><div class="panel-head"><div><p class="eyebrow">${escapeHtml(group.position)}</p><h3>${group.starterCount} starter${group.starterCount === 1 ? "" : "s"} · ${group.benchCount} bench</h3></div><span class="record">${group.knownProjectionCount}/${group.totalCount} projected</span></div><div class="plan-players">${group.players.map(item => `<div class="plan-player"><span class="avatar pos-${escapeHtml(item.player.position).replace("/", "")}">${initials(item.player.name)}</span><div><strong>${escapeHtml(item.player.name)}</strong><small>${item.starter ? "Starter" : "Bench"} · ${escapeHtml(item.player.proTeam || "Team unavailable")}</small></div><b>${item.player.projection == null ? "—" : item.player.projection.toFixed(1)}</b></div>`).join("")}</div></article>`).join("") : emptyState("No positional depth available", "The ESPN snapshot does not contain roster players with positions.");
const bye = plan.byeConflicts.length ? plan.byeConflicts.map(item => `<div class="plan-alert"><strong>Week ${item.week}</strong><span>${escapeHtml(item.players.map((player) => player.name).join(", "))}</span></div>`).join("") : `<p class="plan-note">No starter bye conflicts were found in the current snapshot.</p>`;
const playoff = plan.playoff.length ? plan.playoff.map(item => `<div class="plan-row"><strong>${escapeHtml(item.player.name)}</strong><span>${escapeHtml(item.player.position)} · schedule strength ${item.strength}</span></div>`).join("") : `<p class="plan-note">No explicit playoff schedule-strength fields are available in the imported rankings.</p>`;
const importedFutureWeeks = futureProjectionSet ? [...new Set(futureProjectionSet.projections.map((item) => item.week))].sort((a, b) => a - b) : [];
const projectionCompatibility = futureProjectionSet ? evaluateFutureProjectionCompatibility(futureProjectionSet, state.snapshot) : null;
const usableFutureProjectionSet = projectionCompatibility?.usable ? futureProjectionSet : null;
const futureWeeks = selectedFutureWeeks === null ? importedFutureWeeks : importedFutureWeeks.filter((week) => selectedFutureWeeks.includes(week));
const teamSchedule = selectTeamSchedule(state.snapshot, state.selectedTeamId, importedFutureWeeks.length ? futureWeeks : null);
const scheduleCard = renderTeamScheduleCard(teamSchedule, { hasImportedWeeks: importedFutureWeeks.length > 0, hasSelectedWeeks: futureWeeks.length > 0 });
const currentMoves = buildRosterAwareWaiverIdeas(state.snapshot, state.selectedTeamId);
const futureMoveInputs = (currentMoves.items || []).slice(0, 3).map((item, index) => ({ id: `candidate-${index + 1}`, addPlayerId: item.add.id, dropPlayerId: item.drop.id }));
const scenarios = buildScenarioPlan(state.snapshot, state.selectedTeamId, { weeks: futureWeeks, projectionSet: usableFutureProjectionSet, identityMap: projectionIdentityMap, scenarios: futureMoveInputs });
const coverageMatrix = buildProjectionCoverageMatrix(state.snapshot, state.selectedTeamId, { weeks: futureWeeks, projectionSet: usableFutureProjectionSet, identityMap: projectionIdentityMap, candidatePlayerIds: futureMoveInputs.map((item) => item.addPlayerId) });
const horizon = scenarios.status === "ready" ? `${scenarios.weeklyBaseline.length} future week${scenarios.weeklyBaseline.length === 1 ? "" : "s"} calculated` : "Future-week projections unavailable";
const horizonPicker = importedFutureWeeks.length ? `<fieldset class="horizon-picker"><legend>Planning horizon</legend><div class="horizon-options">${importedFutureWeeks.map((week) => `<label><input type="checkbox" data-planning-week="${week}" ${futureWeeks.includes(week) ? "checked" : ""}>Week ${week}</label>`).join("")}</div></fieldset>` : "";
const readinessLabel = { complete: "All selected weeks usable", mixed: "Some selected weeks blocked", blocked: "All selected weeks blocked", unavailable: "Unavailable" }[scenarios.coverage.readiness] || "Unavailable";
const compatibilityNotice = projectionCompatibility?.warnings.length ? `<p class="plan-note">${escapeHtml(projectionCompatibility.warnings.join(" "))} Refresh the export before relying on it.</p>` : "";
const scenarioSource = scenarios.source ? `<dl class="settings-list"><div><dt>Provider</dt><dd>${escapeHtml(scenarios.source.provider || "Unavailable")}</dd></div><div><dt>Compatibility</dt><dd>${escapeHtml(projectionCompatibility?.status || "Unavailable")}</dd></div><div><dt>Scoring</dt><dd>${escapeHtml(scenarios.source.scoringFormat || "Unavailable")}</dd></div><div><dt>Captured</dt><dd>${scenarios.source.capturedAt ? escapeHtml(new Date(scenarios.source.capturedAt).toLocaleString()) : "Unavailable"}</dd></div><div><dt>Readiness</dt><dd>${readinessLabel}</dd></div><div><dt>Coverage</dt><dd>${scenarios.coverage.mappedProjectionCells}/${scenarios.coverage.requiredProjectionCells} (${scenarios.coverage.percentage}%)</dd></div><div><dt>Usable weeks</dt><dd>${scenarios.coverage.readyWeeks.join(", ") || "None"}</dd></div><div><dt>Blocked weeks</dt><dd>${scenarios.coverage.blockedWeeks.join(", ") || "None"}</dd></div><div><dt>Missing mappings / weeks</dt><dd>${scenarios.coverage.unmappedPlayerCells} / ${scenarios.coverage.missingProjectionCells}</dd></div></dl>${compatibilityNotice}${coverageMatrix.status === "gaps" ? `<button class="button secondary" id="download-projection-gaps">Download missing-input report</button>` : ""}${horizonPicker}` : futureProjectionSet ? `<p class="plan-note"><strong>Imported source blocked.</strong> ${escapeHtml(projectionCompatibility?.errors.join(" ") || "Compatibility unavailable.")}</p>${horizonPicker}` : `<p class="plan-note">No future projection source is imported.</p>`;
const moveBody = scenarios.currentWeekScenarios?.length ? scenarios.currentWeekScenarios.slice(0, 3).map(({ payload: item }) => `<div class="plan-row"><strong>${escapeHtml(item.add.name)} for ${escapeHtml(item.drop.name)}</strong><span>+${item.lineupGain} current-week lineup points · validated legal simulation</span></div>`).join("") : `<p class="plan-note">No validated current-week add/drop scenario clears the action threshold, or ESPN availability is missing.</p>`;
const playerIndex = new Map(state.snapshot.players.map((player) => [player.id, player]));
const weeklyBody = scenarios.weeklyBaseline?.length ? scenarios.weeklyBaseline.map(item => `<div class="plan-week"><div class="plan-row"><strong>Week ${item.week} · ${item.completeCoverage ? "usable" : "blocked"}</strong><span>${item.projectedTotal == null ? "No complete lineup" : `${item.projectedTotal.toFixed(1)} optimized known points`} · ${item.mappedProjectionCount}/${item.rosterPlayerCount}${item.completeCoverage ? " complete" : " · comparisons withheld"}</span></div></div>`).join("") : `<p class="plan-note">Future comparisons need projections and explicit ID mappings.</p>`;
const futureMoves = scenarios.scenarios?.length ? scenarios.scenarios.map(item => `<div class="plan-scenario"><strong>Add ${escapeHtml(playerIndex.get(item.addPlayerId)?.name || item.addPlayerId)} · drop ${escapeHtml(playerIndex.get(item.dropPlayerId)?.name || item.dropPlayerId)}</strong>${item.weekly.map(week => `<span>Week ${week.week}: ${week.delta == null ? escapeHtml(week.deltaUnavailableReason) : `${week.delta >= 0 ? "+" : ""}${week.delta} points`}</span>`).join("")}</div>`).join("") : `<p class="plan-note">Complete mapped projections will evaluate legal waiver candidates.</p>`;
const matrixBody = coverageMatrix.rows.length ? `<details class="coverage-details"><summary>${coverageMatrix.rows.filter((row) => row.complete).length}/${coverageMatrix.rows.length} roster and candidate players complete</summary>${coverageMatrix.rows.map((row) => `<span><strong>${escapeHtml(row.playerName || `ESPN player ${row.espnPlayerId}`)}</strong> · ${escapeHtml(row.scope)} · ${row.providerPlayerId ? escapeHtml(row.providerPlayerId) : "mapping missing"} · ${row.cells.map((cell) => `W${cell.week} ${cell.status === "ready" ? `${cell.points} pts · ${new Date(cell.capturedAt).toLocaleDateString()}` : cell.status.replace("missing-", "missing ")}`).join(" | ")}</span>`).join("")}</details>` : `<p class="plan-note">Select imported weeks to inspect roster and candidate coverage.</p>`;
content.innerHTML = sectionHeader("Season Plan", "A transparent planning layer built from ESPN roster state and only explicitly reported FantasyPros context.") + `<div class="plan-grid"><div><div class="section-divider"><span>ROSTER DEPTH</span></div><div class="plan-groups">${depth}</div></div><div class="side-stack"><article class="panel"><div class="panel-head"><div><p class="eyebrow">BYE WEEKS</p><h3>Starter conflicts</h3></div></div>${bye}</article>${scheduleCard}<article class="panel"><div class="panel-head"><div><p class="eyebrow">PLAYOFF CONTEXT</p><h3>Explicit schedule strength</h3></div></div>${playoff}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">CURRENT-WEEK SCENARIOS</p><h3>Top legal moves</h3></div></div>${moveBody}<a class="text-link" href="#waivers">Review all waiver scenarios →</a></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">PROJECTION SOURCE</p><h3>Coverage and provenance</h3></div></div>${scenarioSource}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">COVERAGE MATRIX</p><h3>Roster and candidates</h3></div></div>${matrixBody}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">MULTIWEEK BASELINE</p><h3>${escapeHtml(horizon)}</h3></div></div>${weeklyBody}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">MULTIWEEK MOVES</p><h3>Add/drop impact</h3></div></div>${futureMoves}</article></div></div><article class="panel plan-limitations"><strong>Data boundaries</strong>${plan.limitations.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</article>`;
}
function renderLeague() {
const league = state.snapshot.league;
const slots = league.lineupSlots || [];
const waiver = league.waiver || {};
const acquisition = state.snapshot.teams.find((team) => team.id === state.selectedTeamId)?.acquisition || {};
const acquisitionCard = renderAcquisitionSettingsCard(waiver, acquisition, state.snapshot.currentWeek);
const standings = selectLeagueStandings(state.snapshot);
const scheduleWeeks = [...new Set(state.snapshot.matchups.map((matchup) => matchup.week))].sort((a, b) => a - b);
const selectedScheduleWeek = scheduleWeeks.includes(leagueScheduleWeek) ? leagueScheduleWeek : scheduleWeeks.includes(state.snapshot.currentWeek) ? state.snapshot.currentWeek : scheduleWeeks[0] ?? null;
leagueScheduleWeek = selectedScheduleWeek;
const scheduledMatchups = selectLeagueMatchups(state.snapshot, selectedScheduleWeek);
const teamIndex = new Map(state.snapshot.teams.map((team) => [team.id, team]));
const score = (value) => Number.isFinite(value) ? Number(value).toFixed(1) : "—";
const importSummary = projectionImportSummary ? `<details class="coverage-details"><summary>Last import: ${projectionImportSummary.added} added · ${projectionImportSummary.updated} updated · ${projectionImportSummary.retained} retained · ${projectionImportSummary.ignoredOlder} older ignored · ${projectionImportSummary.conflicting} conflicts</summary><span>Capture range: ${escapeHtml(new Date(projectionImportSummary.captureStart).toLocaleString())} – ${escapeHtml(new Date(projectionImportSummary.captureEnd).toLocaleString())}</span>${projectionImportSummary.weeks.map((week) => `<span>Week ${week.week}: ${week.added} added, ${week.updated} updated, ${week.retained} retained, ${week.ignoredOlder} older ignored · ${escapeHtml(new Date(week.captureStart).toLocaleString())}${week.captureStart === week.captureEnd ? "" : ` – ${escapeHtml(new Date(week.captureEnd).toLocaleString())}`}</span>`).join("")}</details>` : "";
const standingsBody = standings.teams.map((team) => `<tr><th scope="row">${escapeHtml(team.name)}</th><td>${formatRecord(team.record)}</td><td>${team.pointsFor == null ? "—" : Number(team.pointsFor).toFixed(1)}</td></tr>`).join("");
const scheduleBody = scheduledMatchups.length ? scheduledMatchups.map((matchup) => { const home = teamIndex.get(matchup.homeTeamId); const away = teamIndex.get(matchup.awayTeamId); return `<div class="league-matchup"><span><strong>${escapeHtml(away?.name || `Team ${matchup.awayTeamId}`)}</strong><b>${score(matchup.awayScore)}</b></span><span><strong>${escapeHtml(home?.name || `Team ${matchup.homeTeamId}`)}</strong><b>${score(matchup.homeScore)}</b></span><small>${escapeHtml(matchup.status || "Status unavailable")}</small></div>`; }).join("") : emptyInline("No matchups were reported for this week.");
content.innerHTML = sectionHeader("League Setup", "Settings reported by ESPN for the connected league. Unavailable fields remain unlabeled rather than inferred.") + `<div class="league-grid">
<article class="panel"><div class="panel-head"><div><p class="eyebrow">ESPN CONNECTION</p><h3>Local league settings</h3></div><span class="quality ${companionHealth.status === "ready" ? "fresh" : companionHealth.status === "checking" ? "aging" : "stale"}">${escapeHtml(companionHealth.status)}</span></div><div class="connection-health"><strong>${escapeHtml(companionHealth.message)}</strong><span>Minimum supported companion: ${MINIMUM_COMPANION_VERSION}. ESPN access remains read-only.</span></div>${savedEspnConnections.length ? `<label class="saved-connection">Saved connection<select id="saved-connection-select">${savedEspnConnections.map((item) => `<option value="${escapeHtml(connectionKey(item))}" ${connectionKey(item) === connectionKey(espnConnection) ? "selected" : ""}>League ${escapeHtml(item.leagueId)} · ${escapeHtml(item.seasonId)} · Team ${escapeHtml(item.teamId)}</option>`).join("")}</select></label>` : ""}<div class="connection-form"><label>League ID or team URL<input id="connection-league-id" value="${escapeHtml(espnConnection.leagueId)}" placeholder="Paste the full ESPN team URL"></label><label>Season<input id="connection-season-id" inputmode="numeric" value="${escapeHtml(espnConnection.seasonId)}"></label><label>Team ID<input id="connection-team-id" inputmode="numeric" value="${escapeHtml(espnConnection.teamId)}"></label></div><button class="button primary" id="save-connection-button">Save connection</button>${savedEspnConnections.length ? ` <button class="button ghost" id="remove-connection-button">Remove selected</button>` : ""}<p class="data-note">Paste a full ESPN team URL in the first field to fill all three IDs automatically. Only the numeric IDs are stored in this browser. Then use Connect ESPN to load that league.</p></article>
<article class="panel"><div class="panel-head"><div><p class="eyebrow">LEAGUE</p><h3>${escapeHtml(league.name)}</h3></div><span class="record">${escapeHtml(league.season || "Season unavailable")}</span></div><dl class="settings-list"><div><dt>Platform</dt><dd>ESPN</dd></div><div><dt>Teams</dt><dd>${escapeHtml(league.teamCount ?? "Unavailable")}</dd></div><div><dt>Scoring</dt><dd>${escapeHtml(league.scoringType || "Unavailable")}</dd></div><div><dt>Current week</dt><dd>${escapeHtml(state.snapshot.currentWeek)}</dd></div></dl></article>
<article class="panel standings-card"><div class="panel-head"><div><p class="eyebrow">LEAGUE RECORDS</p><h3>Standings overview</h3></div></div><table aria-label="League records sorted by reported results"><thead><tr><th>Team</th><th>Record</th><th>Points for</th></tr></thead><tbody>${standingsBody}</tbody></table><p class="data-note">${escapeHtml(standings.methodology)}</p></article>
<article class="panel schedule-card"><div class="panel-head"><div><p class="eyebrow">ALL MATCHUPS</p><h3>Reported schedule</h3></div>${scheduleWeeks.length ? `<label class="schedule-week">Week<select id="league-schedule-week">${scheduleWeeks.map((week) => `<option value="${week}" ${week === selectedScheduleWeek ? "selected" : ""}>${week}</option>`).join("")}</select></label>` : ""}</div><div class="league-matchups">${scheduleBody}</div><p class="data-note">Scores and status come from ESPN. Non-current weeks never reuse current-week player projections.</p></article>
<article class="panel"><div class="panel-head"><div><p class="eyebrow">ROSTER RULES</p><h3>Lineup slots</h3></div></div>${slots.length ? `<div class="slot-grid">${slots.map(item => `<div><strong>${escapeHtml(item.slot)}</strong><span>× ${item.count}</span></div>`).join("")}</div>` : emptyInline("Lineup-slot settings were not included in this snapshot.")}</article>
${acquisitionCard}
<article class="panel"><div class="panel-head"><div><p class="eyebrow">EXTERNAL RANKINGS</p><h3>FantasyPros ROS</h3></div>${state.rankingSet ? `<span class="record">${escapeHtml(state.rankingSet.scoringFormat)}</span>` : ""}</div>${state.rankingSet ? `<dl class="settings-list"><div><dt>Compatibility</dt><dd>${escapeHtml(state.rankingCompatibility?.status || "Unavailable")}</dd></div><div><dt>Season</dt><dd>${escapeHtml(state.rankingSet.season)}</dd></div><div><dt>Expert filter</dt><dd>${escapeHtml(state.rankingSet.expertFilter)}</dd></div><div><dt>Records</dt><dd>${state.rankingSet.rankings.length}</dd></div><div><dt>Matched to ESPN</dt><dd>${Object.keys(state.rankingReconciliation?.byPlayerId || {}).length}</dd></div><div><dt>Unresolved</dt><dd>${state.rankingReconciliation?.unresolved.length || 0}</dd></div><div><dt>Conflicts</dt><dd>${state.rankingReconciliation?.conflicts.length || 0}</dd></div></dl><button class="button ghost" id="clear-rankings-button">Remove rankings</button><p class="data-note">${escapeHtml(state.rankingCompatibility?.errors.join(" ") || state.rankingCompatibility?.warnings.join(" ") || "Rankings match the known ESPN season and scoring family.")}</p>` : `<p class="data-note">Import the FantasyPros ROS PPR CSV to add season-long context without replacing ESPN league data.</p>`}</article>
<article class="panel"><div class="panel-head"><div><p class="eyebrow">WEEKLY PROJECTIONS</p><h3>Future scenario input</h3></div>${futureProjectionSet ? `<span class="record">${escapeHtml(futureProjectionSet.scoringFormat)}</span>` : ""}</div>${futureProjectionSet ? `<dl class="settings-list"><div><dt>Provider</dt><dd>${escapeHtml(futureProjectionSet.provider)}</dd></div><div><dt>Season</dt><dd>${futureProjectionSet.season}</dd></div><div><dt>Records</dt><dd>${futureProjectionSet.projections.length}</dd></div><div><dt>Weeks</dt><dd>${[...new Set(futureProjectionSet.projections.map(item => item.week))].sort((a,b) => a-b).join(", ")}</dd></div><div><dt>Explicit ID mappings</dt><dd>${projectionIdentityMap?.size || 0}</dd></div></dl><button class="button ghost" id="manual-projections-button">Import FantasyPros exports</button> <button class="button ghost" id="clear-future-projections-button">Remove all</button>` : `<p class="data-note">Use free FantasyPros exports with explicit profile-URL and ESPN-player approval. Projection records and their ID mappings are validated and saved together.</p><button class="button primary" id="manual-projections-button">Import FantasyPros exports</button>`}${importSummary}<div class="sync-actions"><button class="button secondary" id="download-projection-template">Download projection template</button><button class="button secondary" id="download-identity-template">Download ESPN ID template</button></div></article>
${mobileSyncCard()}
<article class="panel privacy-card"><div class="panel-head"><div><p class="eyebrow">PRIVACY</p><h3>Your league stays local</h3></div></div><p>The Chrome companion reads ESPN through your existing session. Cookies never enter this website, and the latest normalized snapshot is cached only in this browser.</p><a href="https://github.com/Ryan42062001/the-chip-winner/blob/master/docs/privacy.md" target="_blank" rel="noreferrer">Read the data policy →</a><div class="sync-actions"><button class="button secondary" id="clear-local-data-button">Disconnect and clear local data</button></div></article>
<article class="panel"><div class="panel-head"><div><p class="eyebrow">ADVANCED MODELS</p><h3>Privacy-safe context packet</h3></div></div><p class="data-note">Export the selected team’s normalized context without browser credentials or unrelated league data. Invalid recommendations are excluded by the offline evaluator.</p><button class="button ghost" id="download-model-context">Download model context</button></article>
</div>`;
}
function readStoredSyncCredentials() {
try { return JSON.parse(localStorage.getItem(SYNC_CREDENTIALS_KEY)); } catch { return null; }
}
function mobileSyncCard() {
const credentials = readStoredSyncCredentials();
return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">MOBILE ACCESS</p><h3>Encrypted device sync</h3></div><span class="quality fresh">Live</span></div><dl class="settings-list"><div><dt>Client-side encryption</dt><dd>AES-256-GCM</dd></div><div><dt>ESPN cookies uploaded</dt><dd>Never</dd></div><div><dt>Hosted sync service</dt><dd>Cloudflare · connected</dd></div></dl>${credentials ? `<p class="data-note">Your private mobile link is active. Refresh it after ESPN or rankings change.</p><div class="sync-actions"><button class="button primary" id="refresh-sync-button">Refresh mobile data</button><button class="button ghost" id="copy-sync-button">Copy mobile link</button><button class="button ghost" id="revoke-sync-button">Revoke</button></div>` : `<p class="data-note">Create a private link containing the decryption key. Anyone with that exact link can view the synced snapshot, so keep it private.</p><button class="button primary" id="create-sync-button">Create mobile link</button>`}<p class="data-note">Encrypted snapshots expire from Cloudflare after 30 days.</p></article>`;
}
function mobileUrl(credentials) {
return `${location.origin}${location.pathname}${createMobileSyncFragment(credentials)}`;
}
async function publishCurrentSync(credentials) {
await publishSyncState(syncProvider, credentials, state.snapshot, state.rankingSet);
return mobileUrl(credentials);
}
async function createMobileSync() {
const credentials = await createSyncCredentials();
await publishCurrentSync(credentials);
localStorage.setItem(SYNC_CREDENTIALS_KEY, JSON.stringify(credentials));
render(); showNotice("Private mobile link created. Choose Copy mobile link, then open it on your phone.");
}
async function loadMobileSyncFromUrl() {
const credentials = parseMobileSyncFragment(location.hash);
if (!credentials) return false;
const synced = await readSyncState(syncProvider, credentials);
if (!synced) throw new Error("This mobile sync link has expired or was revoked.");
store.dispatch({ type: "load/success", snapshot: synced.payload.snapshot, source: "sync" });
if (synced.payload.rankingSet) loadRankingSet(synced.payload.rankingSet);
return true;
}
function sectionHeader(title, subtitle) { return `<div class="page-head"><div><p class="eyebrow">WEEK ${state.snapshot.currentWeek}</p><h2>${title}</h2><p>${subtitle}</p></div><span class="week-pill">Source: ${escapeHtml(state.snapshot.meta?.projectionsSource || "not provided")}</span></div>`; }
function emptyState(title, text) { return `<div class="empty-state"><span>◇</span><h3>${title}</h3><p>${text}</p></div>`; }
function emptyInline(text) { return `<p class="empty-inline">${text}</p>`; }
function formatAvailability(status) { return status === "FREEAGENT" ? "FREE AGENT" : status === "WAIVERS" ? "WAIVERS" : "AVAILABLE"; }
function comparisonOptions(players, selectedId) { return players.map((player) => `<option value="${escapeHtml(player.id)}" ${player.id === selectedId ? "selected" : ""}>${escapeHtml(player.name)} · ${escapeHtml(player.position)}</option>`).join(""); }
function qualityBar(label, value) { const percent = Math.round(value * 100); return `<div class="quality-row"><span>${label}</span><strong>${percent}%</strong><i><b style="width:${percent}%"></b></i></div>`; }
function detailValue(value, formatter = String) { return value == null || value === "" ? '<span class="missing">Unavailable</span>' : escapeHtml(formatter(value)); }
function openPlayerDetail(playerId) {
const detail = selectPlayerDetail(state.snapshot, state.selectedTeamId, playerId);
if (!detail) return;
const { player, rosterEntry, source } = detail;
const ros = state.rankingReconciliation?.byPlayerId?.[player.id];
const external = renderExternalProjectionDetail(futureProjectionSet, projectionIdentityMap, state.snapshot, player.id);
const dialog = document.querySelector("#player-dialog");
document.querySelector("#player-dialog-content").innerHTML = `<div class="detail-head"><div><p class="eyebrow">${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "NFL team unavailable")}</p><h2 id="player-dialog-title">${escapeHtml(player.name)}</h2><p>${rosterEntry ? `Rostered · ${escapeHtml(rosterEntry.lineupSlot)}` : detail.isAvailable === true ? `${escapeHtml(formatAvailability(player.availabilityStatus))} in ECOG` : "Roster status unavailable"}</p></div><form method="dialog"><button class="dialog-close" aria-label="Close player details">×</button></form></div>
<div class="detail-projection"><span>Week ${state.snapshot.currentWeek} projection</span><strong>${player.projection == null ? "—" : player.projection.toFixed(1)}</strong><small>Source: ${escapeHtml(source.projections || "Unavailable")}</small></div>
<dl class="detail-grid"><div><dt>Opponent</dt><dd>${detailValue(player.opponent)}</dd></div><div><dt>Kickoff</dt><dd>${detailValue(player.gameTime, gameTime)}</dd></div><div><dt>Injury</dt><dd>${detailValue(player.injury?.status)}</dd></div><div><dt>Bye week</dt><dd>${detailValue(player.byeWeek)}</dd></div><div><dt>Season average</dt><dd>${detailValue(player.seasonAverage, value => `${Number(value).toFixed(1)} pts`)}</dd></div><div><dt>Availability</dt><dd>${detail.isRostered ? "On roster" : detail.isAvailable === true ? escapeHtml(formatAvailability(player.availabilityStatus)) : detail.isAvailable === false ? "Not available" : "Unavailable"}</dd></div>${external.grid}${ros ? `<div><dt>FantasyPros ROS</dt><dd>#${ros.rank} overall · ${escapeHtml(ros.position)}${ros.positionRank}</dd></div><div><dt>Playoff SOS</dt><dd>${ros.playoffScheduleStrength == null ? '<span class="missing">Unavailable</span>' : `${ros.playoffScheduleStrength}/5`}</dd></div>` : ""}</dl>
<div class="detail-source"><strong>Data provenance</strong><span>League: ${escapeHtml(String(source.leagueProvider || "Unavailable").toUpperCase())}</span><span>Snapshot: ${source.capturedAt ? escapeHtml(new Date(source.capturedAt).toLocaleString()) : "Unavailable"}</span>${external.source}${ros ? `<span>ROS rank: FantasyPros · PPR · top-10 expert filter</span>` : ""}<p>Missing fields are not inferred. Verify late injury news before making a move.</p></div>`;
dialog.showModal();
}
function render() {
if (!state.snapshot) return;
document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.section === state.section));
const titles = { overview: "Weekly command center", lineup: "Lineup Lab", waivers: "Waiver Wire", alerts: "Player Alerts", changes: "What Changed", season: "Season Plan", league: "League Setup" };
document.querySelector("#page-title").textContent = titles[state.section] || titles.overview;
({ overview: renderOverview, lineup: renderLineup, waivers: renderWaivers, alerts: renderAlerts, changes: renderChanges, season: renderSeasonPlan, league: renderLeague }[state.section] || renderOverview)();
}
const withContext = (fn) => (...args) => { syncContext(); return fn(...args); };
return Object.freeze({
render: withContext(render), openPlayerDetail: withContext(openPlayerDetail),
emptyState: withContext(emptyState), escapeHtml,
readStoredSyncCredentials: withContext(readStoredSyncCredentials),
mobileUrl: withContext(mobileUrl), createMobileSync: withContext(createMobileSync),
publishCurrentSync: withContext(publishCurrentSync), loadMobileSyncFromUrl: withContext(loadMobileSyncFromUrl),
});
}
