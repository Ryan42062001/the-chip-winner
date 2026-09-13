import test from "node:test";
import assert from "node:assert/strict";
import { appReducer, initialAppState } from "../src/application/store.js";
import { describeEspnRefreshFailure, snapshotSourceLabel } from "../src/application/recovery-state.js";

const liveSnapshot = Object.freeze({
  teams: [{ id: "team-a" }],
  meta: { kind: "live-companion", capturedAt: "2026-09-12T20:00:00.000Z" },
});

test("failed ESPN refresh retains the last valid snapshot and durable stale qualification across navigation", () => {
  const ready = appReducer(initialAppState, { type: "load/success", snapshot: liveSnapshot, source: "cache" });
  const failed = appReducer(ready, { type: "refresh/failure" });

  assert.equal(failed.snapshot, liveSnapshot);
  assert.equal(failed.previousSnapshot, null);
  assert.equal(failed.source, "cache");
  assert.deepEqual(failed.refreshRecovery, { status: "failed" });
  assert.equal(snapshotSourceLabel(failed), "Last valid ESPN snapshot · refresh failed");
  assert.equal(failed.snapshot.meta.capturedAt, "2026-09-12T20:00:00.000Z");

  const navigated = appReducer(failed, { type: "section/select", section: "waivers" });
  assert.deepEqual(navigated.refreshRecovery, { status: "failed" });
  assert.equal(navigated.snapshot, liveSnapshot);
  assert.equal(snapshotSourceLabel(navigated), "Last valid ESPN snapshot · refresh failed");
  assert.notEqual(snapshotSourceLabel(navigated), "Sample snapshot");
});

test("successful reconnect clears recovery state and restores live presentation", () => {
  let state = appReducer(initialAppState, { type: "load/success", snapshot: liveSnapshot, source: "cache" });
  state = appReducer(state, { type: "refresh/failure" });

  const refreshedSnapshot = {
    teams: [{ id: "team-a" }],
    meta: { kind: "live-companion", capturedAt: "2026-09-12T20:10:00.000Z" },
  };
  state = appReducer(state, { type: "load/success", snapshot: refreshedSnapshot, previousSnapshot: liveSnapshot, source: "cache" });

  assert.equal(state.refreshRecovery, null);
  assert.equal(state.snapshot, refreshedSnapshot);
  assert.equal(state.previousSnapshot, liveSnapshot);
  assert.equal(snapshotSourceLabel(state), "Live ESPN snapshot");
});

test("refresh failure guidance is network-honest while precise companion messages remain intact", () => {
  const fetchFailure = describeEspnRefreshFailure("Failed to fetch");
  assert.match(fetchFailure, /network connectivity/i);
  assert.match(fetchFailure, /companion availability/i);
  assert.match(fetchFailure, /ESPN sign-in/i);

  const missingCompanion = describeEspnRefreshFailure("Chrome companion not detected. Install or reload the unpacked extension, then reload this page.");
  assert.match(missingCompanion, /not detected/i);
  assert.match(missingCompanion, /setup guide/i);

  const outdated = "Companion 0.2.3 is outdated. Reload version 0.2.4 or newer from the repository.";
  assert.equal(describeEspnRefreshFailure(outdated), outdated);
});
