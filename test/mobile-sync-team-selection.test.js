import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createMobileSyncFragment, createSyncCredentials } from "../src/sync/crypto.js";
import { createSectionRenderer } from "../src/ui/section-renderer.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("mobile sync reopens the exact desktop-selected team instead of the first league team", async () => {
  const credentials = await createSyncCredentials();
  let storedEnvelope = null;
  const syncProvider = {
    publish: async (envelope) => { storedEnvelope = envelope; },
    read: async () => storedEnvelope,
  };
  const dispatched = [];
  const state = { snapshot: sample, selectedTeamId: "t2", rankingSet: null };
  const deps = {
    syncProvider,
    syncCredentialsKey: "test:sync",
    store: { dispatch: (action) => dispatched.push(action) },
    getContext: () => ({ state }),
    loadRankingSet: () => { throw new Error("No ranking set should be loaded in this fixture."); },
    showNotice: () => {},
  };

  const priorLocation = globalThis.location;
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    writable: true,
    value: { origin: "https://example.test", pathname: "/the-chip-winner/", hash: "" },
  });

  try {
    const renderer = createSectionRenderer(deps);
    const publishedUrl = await renderer.publishCurrentSync(credentials);
    assert.match(publishedUrl, /#mobile-sync=/);
    globalThis.location.hash = createMobileSyncFragment(credentials);

    assert.equal(await renderer.loadMobileSyncFromUrl(), true);
    assert.equal(dispatched[0].type, "load/success");
    assert.equal(dispatched[0].source, "sync");
    assert.equal(dispatched[0].snapshot.league.id, sample.league.id);
    assert.deepEqual(dispatched[1], { type: "team/select", teamId: "t2" });
  } finally {
    if (priorLocation === undefined) delete globalThis.location;
    else globalThis.location = priorLocation;
  }
});
