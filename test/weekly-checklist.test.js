import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildWeeklyChecklist } from "../src/domain/weekly-checklist.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));
const NOW = Date.parse("2026-09-10T12:00:00Z");

function configuredSnapshot() {
  const snapshot = structuredClone(sample);
  snapshot.league.lineupSlots = [{ slot: "QB", count: 1 }, { slot: "RB", count: 3 }, { slot: "WR", count: 2 }, { slot: "TE", count: 1 }, { slot: "FLEX", count: 1 }, { slot: "K", count: 1 }, { slot: "D/ST", count: 1 }, { slot: "BE", count: 6 }];
  for (const player of snapshot.players) player.gameTime = "2026-09-13T17:00:00Z";
  return snapshot;
}

test("weekly checklist prioritizes exact vacancies and near-kickoff starter injuries", () => {
  const snapshot = configuredSnapshot();
  snapshot.players.find((player) => player.id === "p3").gameTime = "2026-09-11T00:00:00Z";
  const result = buildWeeklyChecklist(snapshot, "t1", NOW);
  assert.equal(result.status, "ready");
  assert.equal(result.needsActionCount, 2);
  assert.deepEqual(result.items.slice(0, 2).map((item) => [item.kind, item.urgency]), [["vacancy", "critical"], ["injury", "critical"]]);
});

test("weekly checklist never makes time-sensitive claims without parseable kickoff data", () => {
  const snapshot = configuredSnapshot();
  snapshot.players.find((player) => player.id === "p3").gameTime = "Sunday afternoon";
  const result = buildWeeklyChecklist(snapshot, "t1", NOW);
  const injury = result.items.find((item) => item.id === "injury:p3");
  assert.equal(result.status, "partial");
  assert.equal(injury.urgency, "unknown");
  assert.match(injury.detail, /unavailable/);
  assert.match(result.limitations.join(" "), /time-sensitive urgency is disabled/);
});

test("weekly checklist labels started and ESPN-locked starters as locked information", () => {
  const snapshot = configuredSnapshot();
  snapshot.players.find((player) => player.id === "p1").gameTime = "2026-09-10T11:00:00Z";
  snapshot.rosters[0].entries.find((entry) => entry.playerId === "p3").locked = true;
  const result = buildWeeklyChecklist(snapshot, "t1", NOW);
  assert.equal(result.items.find((item) => item.id === "locked:p1").status, "locked");
  assert.equal(result.items.find((item) => item.id === "injury:p3").status, "locked");
  assert.equal(result.needsActionCount, 1);
});

test("weekly checklist reports missing roster and projection gaps without inventing values", () => {
  assert.equal(buildWeeklyChecklist(sample, "missing", NOW).status, "unavailable");
  const snapshot = configuredSnapshot();
  snapshot.players.find((player) => player.id === "p1").projection = null;
  const gap = buildWeeklyChecklist(snapshot, "t1", NOW).items.find((item) => item.id === "projection:p1");
  assert.equal(gap.status, "data-gap");
  assert.match(gap.detail, /No projection-based lineup claim/);
});
