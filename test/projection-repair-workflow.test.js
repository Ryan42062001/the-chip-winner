import test from "node:test";
import assert from "node:assert/strict";
import { fantasyProsProfileUrlForEspnPlayer } from "../src/providers/projections/fantasypros-manual-import.js";
import { buildProjectionGapReport, buildScenarioPlan } from "../src/domain/scenario-planner.js";
import sampleSnapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };

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
  const teamId = sampleSnapshot.teams[0].id;
  const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const rosterIds = roster.entries.map((entry) => entry.playerId);
  const unmappedRosterId = rosterIds.at(-1);
  const mappedRosterIds = rosterIds.filter((playerId) => playerId !== unmappedRosterId);
  const currentPlan = buildScenarioPlan(sampleSnapshot, teamId);
  const availableCandidateId = currentPlan.currentWeekScenarios[0].payload.add.id;
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

  const plan = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15, 16], projectionSet, identityMap });
  const report = buildProjectionGapReport(sampleSnapshot, plan, identityMap);

  assert.equal(report.status, "gaps");
  assert.equal(report.records[0].espnPlayerId, unmappedRosterId);
  assert.equal(report.records[0].scope, "roster");
  assert.equal(report.records[0].gapType, "missing-identity-map");
  const candidateGap = report.records.find((item) => item.scope === "candidate");
  assert.equal(candidateGap.espnPlayerId, availableCandidateId);
  assert.equal(candidateGap.week, 16);
  assert.equal(candidateGap.gapType, "candidate-missing-week-projection");
  assert.match(report.limitation, /Roster gaps are listed before top ESPN-available candidate gaps/);
});
