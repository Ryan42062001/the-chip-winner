import test from "node:test";
import assert from "node:assert/strict";
import { changesForTeam, diffSnapshots } from "../src/domain/snapshot-diff.js";

const base = {
  league: { id: "league" }, meta: { capturedAt: "2026-09-01T12:00:00Z" },
  players: [
    { id: "a", name: "Alpha Runner", projection: 10, injury: { status: "ACTIVE" } },
    { id: "b", name: "Beta Receiver", projection: 8, injury: { status: "ACTIVE" } },
    { id: "c", name: "Gamma Back", projection: null, injury: null }
  ],
  rosters: [{ teamId: "one", entries: [{ playerId: "a", lineupSlot: "RB" }, { playerId: "b", lineupSlot: "BE" }] }],
  matchups: [{ week: 1, homeTeamId: "one", awayTeamId: "two", homeScore: 0, awayScore: 0 }],
  availablePlayers: ["c"]
};

test("snapshot diff reports explicit source changes without mutating snapshots", () => {
  const current = structuredClone(base);
  current.meta.capturedAt = "2026-09-01T13:00:00Z";
  current.players[0].projection = 11.5;
  current.players[0].injury.status = "QUESTIONABLE";
  current.rosters[0].entries[1].lineupSlot = "WR";
  current.availablePlayers = [];
  current.matchups[0].homeScore = 12.4;
  const before = structuredClone(base);
  const changes = diffSnapshots(base, current);
  assert.deepEqual(changes.map((change) => change.kind), ["injury", "lineup", "availability", "projection", "matchup"]);
  assert.equal(changes.every((change) => change.observedAt === current.meta.capturedAt), true);
  assert.deepEqual(base, before);
});

test("snapshot diff reports roster adds and drops and filters team relevance", () => {
  const current = structuredClone(base);
  current.rosters[0].entries = [{ playerId: "a", lineupSlot: "RB" }, { playerId: "c", lineupSlot: "BE" }];
  const changes = diffSnapshots(base, current);
  assert.deepEqual(changes.map((change) => change.kind).sort(), ["roster-add", "roster-drop"]);
  assert.equal(changesForTeam(changes, current, "one").length, 2);
  assert.equal(changesForTeam(changes, current, "two").length, 0);
});

test("snapshot diff returns no history across different leagues or identical inputs", () => {
  assert.deepEqual(diffSnapshots(base, structuredClone(base)), []);
  assert.deepEqual(diffSnapshots({ ...base, league: { id: "other" } }, base), []);
  assert.deepEqual(diffSnapshots(null, base), []);
});
