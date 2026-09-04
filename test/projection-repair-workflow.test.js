import test from "node:test";
import assert from "node:assert/strict";
import { fantasyProsProfileUrlForEspnPlayer } from "../src/providers/projections/fantasypros-manual-import.js";
import { buildProjectionGapReport, buildScenarioPlan } from "../src/domain/scenario-planner.js";

function candidateSnapshot() {
  return {
    currentWeek: 1,
    league: { waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: null } },
    teams: [{ id: "mine", acquisition: { waiverRank: null, seasonAcquisitions: null, matchupAcquisitions: null, budgetSpent: null } }],
    players: [
      { id: "qb", name: "Quarterback", position: "QB", projection: 20 },
      { id: "rb", name: "Starter Back", position: "RB", projection: 10 },
      { id: "bench-qb", name: "Bench Quarterback", position: "QB", projection: 8 },
      { id: "bench-rb", name: "Bench Back", position: "RB", projection: 6 },
      { id: "add-wr", name: "Available Receiver", position: "WR", projection: 16 },
      { id: "add-rb", name: "Available Back", position: "RB", projection: 14 }
    ],
    rosters: [{ teamId: "mine", entries: [
      { playerId: "qb", lineupSlot: "QB" },
      { playerId: "rb", lineupSlot: "FLEX" },
      { playerId: "bench-qb", lineupSlot: "BE" },
      { playerId: "bench-rb", lineupSlot: "BE" }
    ] }],
    availablePlayers: ["add-wr", "add-rb"]
  };
}

test("previously approved FantasyPros mappings can prefill a canonical profile URL without name matching", () => {
  const identityMap = new Map([
    ["fantasypros:jalen-hurts", "espn-1"],
    ["other-provider:player-2", "espn-2"]
  ]);

  assert.equal(
    fantasyProsProfileUrlForEspnPlayer(identityMap, "espn-1"),
    "https://www.fantasypros.com/nfl/players/jalen-hurts.php"
  );
  assert.equal(fantasyProsProfileUrlForEspnPlayer(identityMap, "espn-2"), null);
  assert.equal(fantasyProsProfileUrlForEspnPlayer(identityMap, "Jalen Hurts"), null);
});

test("projection gap report lists roster blockers before top ESPN candidate blockers", () => {
  const snapshot = candidateSnapshot();
  const teamId = "mine";
  const roster = snapshot.rosters[0];
  const rosterIds = roster.entries.map((entry) => entry.playerId);
  const unmappedRosterId = "bench-rb";
  const mappedRosterIds = rosterIds.filter((playerId) => playerId !== unmappedRosterId);
  const currentPlan = buildScenarioPlan(snapshot, teamId);
  const availableCandidateId = currentPlan.currentWeekScenarios[0].payload.add.id;
  assert.equal(availableCandidateId, "add-wr");

  const identityMap = new Map([
    ...mappedRosterIds.map((playerId) => [`provider-${playerId}`, playerId]),
    [`provider-${availableCandidateId}`, availableCandidateId]
  ]);
  const projectionSet = {
    projections: [
      ...mappedRosterIds.flatMap((playerId) => [
        { providerPlayerId: `provider-${playerId}`, week: 15, points: 10, capturedAt: "2026-09-04T00:00:00Z" },
        { providerPlayerId: `provider-${playerId}`, week: 16, points: 11, capturedAt: "2026-09-04T00:00:00Z" }
      ]),
      { providerPlayerId: `provider-${availableCandidateId}`, week: 15, points: 12, capturedAt: "2026-09-04T00:00:00Z" }
    ]
  };

  const plan = buildScenarioPlan(snapshot, teamId, { weeks: [15, 16], projectionSet, identityMap });
  const report = buildProjectionGapReport(snapshot, plan, identityMap);

  assert.equal(report.status, "gaps");
  assert.equal(report.records[0].espnPlayerId, unmappedRosterId);
  assert.equal(report.records[0].scope, "roster");
  assert.equal(report.records[0].gapType, "missing-identity-map");
  const candidateGap = report.records.find((item) => item.scope === "candidate" && item.espnPlayerId === availableCandidateId);
  assert.equal(candidateGap.week, 16);
  assert.equal(candidateGap.gapType, "candidate-missing-week-projection");
  assert.match(report.limitation, /Roster gaps are listed before top ESPN-available candidate gaps/);
});
