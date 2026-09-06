import { createMobileSyncFragment, createSyncCredentials, parseMobileSyncFragment } from "../sync/crypto.js";
import { publishSyncState, readSyncState } from "../sync/sync-session.js";
import { createDesktopAutoPublisher, createMobileSyncUpdater } from "../sync/auto-sync.js";
import { selectTeamContext } from "../domain/selectors.js";
import { createSectionRenderer as createPrioritySectionRenderer } from "./section-renderer-priority.js";
import { decorateOverviewReserve } from "./overview-reserve.js";

const SYNC_SECTIONS = new Set(["overview", "lineup", "waivers", "alerts", "changes", "season", "league"]);

export function createSectionRenderer(deps) {
const base = createPrioritySectionRenderer(deps);
let activeMobileFragment = null;
let mobileListenersInstalled = false;

function mobileUrl(credentials) {
return `${globalThis.location.origin}${globalThis.location.pathname}${createMobileSyncFragment(credentials)}`;
}

function readStoredSyncCredentials() {
try {
  const raw = globalThis.localStorage?.getItem(deps.syncCredentialsKey);
  return raw ? JSON.parse(raw) : null;
} catch {
  return null;
}
}

async function publishCurrentSync(credentials) {
const { state } = deps.getContext();
await publishSyncState(deps.syncProvider, credentials, state.snapshot, state.rankingSet, state.selectedTeamId, state.previousSnapshot);
return mobileUrl(credentials);
}

const mobileUpdater = createMobileSyncUpdater({
  read: (credentials) => readSyncState(deps.syncProvider, credentials),
  reload: () => globalThis.location?.reload?.(),
  onStatus: (message, kind) => deps.showNotice(message, kind),
});

const desktopAutoPublisher = createDesktopAutoPublisher({
  store: deps.store,
  readCredentials: readStoredSyncCredentials,
  publish: publishCurrentSync,
  onError: (error) => deps.showNotice(`ESPN data refreshed, but the private mobile snapshot could not update automatically. ${error.message}`, "error"),
});

async function createMobileSync() {
const credentials = await createSyncCredentials();
await publishCurrentSync(credentials);
globalThis.localStorage.setItem(deps.syncCredentialsKey, JSON.stringify(credentials));
render();
deps.showNotice("Private mobile link created. Future ESPN refreshes will publish to it automatically.");
}

function installMobileUpdateListeners() {
if (mobileListenersInstalled) return;
const doc = globalThis.document;
const win = globalThis.window;
if (!doc || !win) return;
mobileListenersInstalled = true;
const check = () => { void mobileUpdater.check(); };
win.addEventListener("focus", check);
doc.addEventListener("visibilitychange", () => {
  if (doc.visibilityState === "visible") check();
});
}

async function loadMobileSyncFromUrl() {
const fragment = String(globalThis.location?.hash || "");
if (!fragment.startsWith("#mobile-sync=")) return false;
const credentials = parseMobileSyncFragment(fragment);
if (!credentials) throw new Error("This private mobile sync link is malformed. Copy a fresh link from League Setup on the desktop.");
activeMobileFragment = createMobileSyncFragment(credentials);
const synced = await readSyncState(deps.syncProvider, credentials);
if (!synced) throw new Error("This mobile sync link has expired or was revoked.");
deps.store.dispatch({
  type: "load/success",
  snapshot: synced.payload.snapshot,
  previousSnapshot: synced.payload.previousSnapshot ?? null,
  source: "sync"
});
if (synced.payload.selectedTeamId != null) deps.store.dispatch({ type: "team/select", teamId: synced.payload.selectedTeamId });
if (synced.payload.rankingSet) deps.loadRankingSet(synced.payload.rankingSet);
mobileUpdater.activate(credentials, synced.createdAt);
installMobileUpdateListeners();
return true;
}

function routeForLink(link) {
const saved = link.dataset.syncSection;
if (saved && SYNC_SECTIONS.has(saved)) return saved;
if (link.dataset.section && SYNC_SECTIONS.has(link.dataset.section)) return link.dataset.section;
if (link.classList.contains("brand")) return "overview";
const href = link.getAttribute("href") || "";
const match = href.match(/^#([a-z-]+)$/);
return match && SYNC_SECTIONS.has(match[1]) ? match[1] : null;
}

function restoreNormalNavigation() {
for (const link of document.querySelectorAll("a[data-sync-section]")) {
  const section = link.dataset.syncSection;
  if (SYNC_SECTIONS.has(section)) link.setAttribute("href", `#${section}`);
  delete link.dataset.syncSection;
}
}

function decorateSyncNavigation() {
if (!activeMobileFragment) return;
for (const link of document.querySelectorAll('.nav-link, .brand, #app-content a[href^="#"]')) {
  const section = routeForLink(link);
  if (!section) continue;
  link.dataset.syncSection = section;
  // Keep the AES key in the URL fragment even when a synced phone changes app sections.
  // The click handler routes in memory; the safe href also protects open-in-new-tab/fallback behavior.
  link.setAttribute("href", activeMobileFragment);
}
}

function findPanelByHeading(headingText) {
return [...deps.content.querySelectorAll(".league-grid > .panel")]
  .find((item) => item.querySelector("h3")?.textContent?.trim() === headingText);
}

function replacePanelByHeading(headingText, html) {
const panel = findPanelByHeading(headingText);
if (panel) panel.innerHTML = html;
return panel;
}

function decorateDesktopSyncCard() {
if (!readStoredSyncCredentials()) return;
const panel = findPanelByHeading("Encrypted device sync");
if (!panel) return;
const firstNote = panel.querySelector(".data-note");
if (firstNote) firstNote.textContent = "Your private mobile link is active. ESPN refreshes, ROS ranking changes, and selected-team changes are published automatically.";
const publishButton = panel.querySelector("#refresh-sync-button");
if (publishButton) publishButton.textContent = "Publish mobile data now";
}

function bindMobileCheckButton(panel) {
const button = panel?.querySelector("#check-mobile-sync-button");
const status = panel?.querySelector("#mobile-sync-check-status");
if (!button || !status) return;
button.addEventListener("click", async () => {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Checking…";
  status.textContent = "Checking encrypted mobile data…";
  try {
    const result = await mobileUpdater.check({ force: true });
    if (result.status === "current") status.textContent = "Mobile data is already current.";
    else if (result.status === "error") status.textContent = "Could not check for newer mobile data. Your last valid snapshot is still available.";
    else if (result.status === "revoked") status.textContent = "This mobile sync link has expired or was revoked.";
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
});
}

function decorateSyncedLeagueSetup(state) {
replacePanelByHeading("Local league settings", `<div class="panel-head"><div><p class="eyebrow">ESPN CONNECTION</p><h3>Synced mobile viewer</h3></div><span class="quality fresh">Read-only</span></div><div class="connection-health"><strong>ESPN refresh is managed from your desktop browser.</strong><span>This phone reads the encrypted snapshot published by The Chip Winner. It does not use your ESPN session or Chrome companion.</span></div><p class="data-note">When the desktop refreshes ESPN, an active private mobile link is updated automatically.</p>`);
const captured = state.snapshot?.meta?.capturedAt ? new Date(state.snapshot.meta.capturedAt).toLocaleString() : "Capture time unavailable";
const syncPanel = replacePanelByHeading("Encrypted device sync", `<div class="panel-head"><div><p class="eyebrow">MOBILE ACCESS</p><h3>Private synced viewer</h3></div><span class="quality fresh">Read-only</span></div><dl class="settings-list"><div><dt>Client-side encryption</dt><dd>AES-256-GCM</dd></div><div><dt>ESPN cookies uploaded</dt><dd>Never</dd></div><div><dt>Latest ESPN capture</dt><dd>${base.escapeHtml(captured)}</dd></div></dl><p class="data-note">This phone checks the encrypted channel when you reopen or return to the app. Use the button below any time you want to check immediately.</p><div class="sync-actions"><button class="button secondary" id="check-mobile-sync-button" type="button">Check for updates</button></div><p class="data-note" id="mobile-sync-check-status" aria-live="polite"></p><p class="data-note">The mobile sync carries current ESPN state, the matching prior ESPN capture when available, ROS rankings, and the desktop-selected team. Desktop-only projection catalogs and import tools are not silently copied.</p>`);
for (const button of deps.content.querySelectorAll(".league-grid button")) {
  if (button.id !== "check-mobile-sync-button") button.hidden = true;
}
bindMobileCheckButton(syncPanel);
}

function decorateRenderedSource() {
const { state } = deps.getContext();
if (!globalThis.document?.body) return;
decorateOverviewReserve({ content: deps.content, state, selectTeamContext, escapeHtml: base.escapeHtml });
if (state?.source !== "sync") {
  delete document.body.dataset.appSource;
  restoreNormalNavigation();
  if (state?.section === "league") decorateDesktopSyncCard();
  return;
}
document.body.dataset.appSource = "sync";
decorateSyncNavigation();
if (state.section === "league") decorateSyncedLeagueSetup(state);
}

function render(...args) {
const result = base.render(...args);
decorateRenderedSource();
return result;
}

return Object.freeze({
...base,
render,
readStoredSyncCredentials,
mobileUrl,
createMobileSync,
publishCurrentSync,
loadMobileSyncFromUrl,
checkMobileSyncForUpdates: mobileUpdater.check,
desktopAutoPublisher,
});
}
