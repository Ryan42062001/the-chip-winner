import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createMobileSyncFragment, createSyncCredentials } from "../src/sync/crypto.js";
import { createSectionRenderer } from "../src/ui/section-renderer.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

function installLocation(value) {
  const priorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", { configurable: true, writable: true, value });
  return () => {
    if (priorDescriptor) Object.defineProperty(globalThis, "location", priorDescriptor);
    else delete globalThis.location;
  };
}

test("mobile sync reopens the exact desktop-selected team and prior ESPN capture", async () => {
  const credentials = await createSyncCredentials();
  let storedEnvelope = null;
  const syncProvider = {
    publish: async (envelope) => { storedEnvelope = envelope; },
    read: async () => storedEnvelope,
  };
  const dispatched = [];
  const previousSnapshot = structuredClone(sample);
  previousSnapshot.meta.capturedAt = "2026-10-08T14:30:00Z";
  previousSnapshot.players[0].projection = 18.4;
  const state = { snapshot: sample, previousSnapshot, selectedTeamId: "t2", rankingSet: null };
  const deps = {
    syncProvider,
    syncCredentialsKey: "test:sync",
    store: { dispatch: (action) => dispatched.push(action) },
    getContext: () => ({ state }),
    loadRankingSet: () => { throw new Error("No ranking set should be loaded in this fixture."); },
    showNotice: () => {},
  };

  const restoreLocation = installLocation({ origin: "https://example.test", pathname: "/the-chip-winner/", hash: "" });
  try {
    const renderer = createSectionRenderer(deps);
    const publishedUrl = await renderer.publishCurrentSync(credentials);
    assert.match(publishedUrl, /#mobile-sync=/);
    globalThis.location.hash = createMobileSyncFragment(credentials);

    assert.equal(await renderer.loadMobileSyncFromUrl(), true);
    assert.equal(dispatched[0].type, "load/success");
    assert.equal(dispatched[0].source, "sync");
    assert.equal(dispatched[0].snapshot.league.id, sample.league.id);
    assert.equal(dispatched[0].previousSnapshot.players[0].projection, 18.4);
    assert.deepEqual(dispatched[1], { type: "team/select", teamId: "t2" });
  } finally {
    restoreLocation();
  }
});

test("mobile sync prefix fails closed when credentials are malformed", async () => {
  const restoreLocation = installLocation({ origin: "https://example.test", pathname: "/the-chip-winner/", hash: "#mobile-sync=bad.bad" });
  try {
    const renderer = createSectionRenderer({
      syncProvider: { read: async () => { throw new Error("Malformed credentials should fail before transport."); } },
      syncCredentialsKey: "test:sync",
      store: { dispatch: () => {} },
      getContext: () => ({ state: { snapshot: sample, selectedTeamId: "t1", rankingSet: null } }),
      loadRankingSet: () => {},
      showNotice: () => {},
    });
    await assert.rejects(() => renderer.loadMobileSyncFromUrl(), /private mobile sync link is malformed/i);
  } finally {
    restoreLocation();
  }
});
