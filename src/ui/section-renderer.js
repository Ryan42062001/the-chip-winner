import { createMobileSyncFragment, createSyncCredentials, parseMobileSyncFragment } from "../sync/crypto.js";
import { publishSyncState, readSyncState } from "../sync/sync-session.js";
import { createSectionRenderer as createPrioritySectionRenderer } from "./section-renderer-priority.js";

export function createSectionRenderer(deps) {
const base = createPrioritySectionRenderer(deps);

function mobileUrl(credentials) {
return `${globalThis.location.origin}${globalThis.location.pathname}${createMobileSyncFragment(credentials)}`;
}

async function publishCurrentSync(credentials) {
const { state } = deps.getContext();
await publishSyncState(deps.syncProvider, credentials, state.snapshot, state.rankingSet, state.selectedTeamId);
return mobileUrl(credentials);
}

async function createMobileSync() {
const credentials = await createSyncCredentials();
await publishCurrentSync(credentials);
globalThis.localStorage.setItem(deps.syncCredentialsKey, JSON.stringify(credentials));
base.render();
deps.showNotice("Private mobile link created. Choose Copy mobile link, then open it on your phone.");
}

async function loadMobileSyncFromUrl() {
const credentials = parseMobileSyncFragment(globalThis.location.hash);
if (!credentials) return false;
const synced = await readSyncState(deps.syncProvider, credentials);
if (!synced) throw new Error("This mobile sync link has expired or was revoked.");
deps.store.dispatch({ type: "load/success", snapshot: synced.payload.snapshot, source: "sync" });
if (synced.payload.selectedTeamId != null) deps.store.dispatch({ type: "team/select", teamId: synced.payload.selectedTeamId });
if (synced.payload.rankingSet) deps.loadRankingSet(synced.payload.rankingSet);
return true;
}

return Object.freeze({
...base,
mobileUrl,
createMobileSync,
publishCurrentSync,
loadMobileSyncFromUrl,
});
}
