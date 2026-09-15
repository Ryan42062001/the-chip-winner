import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTrade } from "../src/domain/trade-analyzer.js";

const NOW = Date.parse("2026-09-10T12:00:00Z");
const capturedAt = "2026-09-10T11:55:00Z";

function player(id, position, projection) {
  return { id, name: id.toUpperCase(), position, proTeam: "NFL", opponent: "OPP", projection, gameTime: "2026-12-01T18:00:00Z", byeWeek: 14, injury: { status: "ACTIVE" } };
}

function entry(playerId, lineupSlot) { return { playerId, lineupSlot }; }

function baseSnapshot() {
  return {
    schemaVersion: 1,
    provider: "espn",
    currentWeek: 5,
    meta: { kind: "live-companion", capturedAt, projectionsSource: "ESPN" },
    league: {
      id: "league",
      name: "Contract Edge League",
      season: 2026,
      scoringType: "PPR",
      receptionScoring: { family: "ppr", pointsPerReception: 1 },
      lineupSlots: [{ slot: "QB", count: 1 }, { slot: "RB", count: 1 }, { slot: "BE", count: 4 }],
      rosterRules: { size: 6, positionLimits: [{ position: "QB", limit: 1 }, { position: "RB", limit: 1 }] },
      playoffWeeks: [],
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [
      { id: "mine", name: "Mine", abbreviation: "ME", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } },
      { id: "other", name: "Other", abbreviation: "OTH", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } }
    ],
    players: [
      player("q1", "QB", 20), player("r1", "RB", 15), player("w1", "WR", 8),
      player("q2", "QB", 18), player("r2", "RB", 14)
    ],
    rosters: [
      { teamId: "mine", entries: [entry("q1", "QB"), entry("r1", "RB"), entry("w1", "BE")] },
      { teamId: "other", entries: [entry("q2", "QB"), entry("r2", "RB")] }
    ],
    matchups: [],
    availablePlayers: []
  };
}

test("combined finite position violations expose the determinable minimum explicit removal count", () => {
  const snapshot = baseSnapshot();
  const result = analyzeTrade(snapshot, "mine", {
    outgoingPlayerIds: ["w1"],
    incomingPlayerIds: ["q2", "r2"],
    plannedFollowUpDropIds: [],
    teamObjective: "BALANCED"
  }, { now: NOW });

  assert.equal(result.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(result.roster.requiredFollowUpRemovals, 2);
  assert.deepEqual(result.roster.direct.violations.map((item) => [item.kind, item.position, item.excess]), [
    ["POSITION_LIMIT", "QB", 1],
    ["POSITION_LIMIT", "RB", 1]
  ]);
  assert.match(result.reasons[0], /At least 2 explicit follow-up removals/);
});

test("snapshot, current source, and replacement context preserve capture and freshness metadata", () => {
  const snapshot = baseSnapshot();
  snapshot.league.rosterRules.positionLimits = [];
  const result = analyzeTrade(snapshot, "mine", {
    outgoingPlayerIds: ["w1"],
    incomingPlayerIds: ["q2"],
    plannedFollowUpDropIds: [],
    teamObjective: "BALANCED"
  }, { now: NOW });

  assert.equal(result.snapshot.capturedAt, capturedAt);
  assert.equal(result.snapshot.freshness.status, "fresh");
  assert.equal(result.currentWeek.sources[0].source, "ESPN");
  assert.equal(result.currentWeek.sources[0].capturedAt, capturedAt);
  assert.equal(result.currentWeek.sources[0].freshness.status, "fresh");
  assert.equal(result.replacement.source, "ESPN availability");
  assert.equal(result.replacement.capturedAt, capturedAt);
  assert.equal(result.replacement.freshness.status, "fresh");
});

test("complete future rows retain pre and post optimized starter assignments", () => {
  const snapshot = baseSnapshot();
  snapshot.league.rosterRules.positionLimits = [];
  const externalCapturedAt = new Date().toISOString();
  const ids = ["q1", "r1", "w1", "r2"];
  const identityMap = new Map(ids.map((id) => [`ext-${id}`, id]));
  const futureProjectionSet = {
    provider: "External fixture",
    scoringFormat: "PPR",
    season: 2026,
    capturedAt: externalCapturedAt,
    projections: ids.map((id) => ({ providerPlayerId: `ext-${id}`, week: 6, points: id === "r2" ? 18 : id === "r1" ? 14 : id === "q1" ? 20 : 8, capturedAt: externalCapturedAt }))
  };
  const result = analyzeTrade(snapshot, "mine", {
    outgoingPlayerIds: ["r1"],
    incomingPlayerIds: ["r2"],
    plannedFollowUpDropIds: [],
    teamObjective: "BALANCED"
  }, { now: NOW, futureProjectionSet, identityMap, futureWeeks: [6], playoffWeeks: [] });

  assert.equal(result.future.status, "READY");
  assert.equal(result.future.rows[0].preAssignments.length, 2);
  assert.equal(result.future.rows[0].postAssignments.length, 2);
  assert.equal(result.future.rows[0].preAssignments.find((item) => item.slot === "RB").player.id, "r1");
  assert.equal(result.future.rows[0].postAssignments.find((item) => item.slot === "RB").player.id, "r2");
  assert.equal(result.future.rows[0].assignments.changes.length, 1);
});
