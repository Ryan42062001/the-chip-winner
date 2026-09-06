import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProjectionCoverageMatrix,
  buildProjectionGapReport,
  buildScenarioPlan
} from "../src/domain/scenario-planner.js";
import { buildWaiverPriorityBoard } from "../src/domain/waiver-priority-engine.js";

function snapshot() {
  return {
    currentWeek: 1,
    meta: { capturedAt: "2026-09-05T12:00:00.000Z" },
    league: {
      lineupSlots: [
        { slot: "QB", count: 1 },
        { slot: "FLEX", count: 1 },
        { slot: "BE", count: 2 },
        { slot: "IR", count: 1 }
      ],
      rosterRules: { size: 4, positionLimits: [] },
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [{
      id: "mine",
      acquisition: { waiverRank: 10, seasonAcquisitions: 0, matchupAcquisitions: 0 }
    }],
    players: [
      { id: "qb", name: "Quarterback", position: "QB", projection: 20, injury: { status: "ACTIVE" } },
      { id: "rb", name: "Starter Back", position: "RB", projection: 10, injury: { status: "ACTIVE" } },
      { id: "bench-qb", name: "Bench Quarterback", position: "QB", projection: 8, injury: { status: "ACTIVE" } },
      { id: "bench-rb", name: "Bench Back", position: "RB", projection: 6, injury: { status: "ACTIVE" } },
      { id: "ir", name: "IR Running Back", position: "RB", projection: 0, injury: { status: "IR" } },
      { id: "stash-wr", name: "Future Stash Receiver", position: "WR", projection: 9, injury: { status: "ACTIVE" } }
    ],
    rosters: [{ teamId: "mine", entries: [
      { playerId: "qb", lineupSlot: "QB" },
      { playerId: "rb", lineupSlot: "FLEX" },
      { playerId: "bench-qb", lineupSlot: "BE" },
      { playerId: "bench-rb", lineupSlot: "BE" },
      { playerId: "ir", lineupSlot: "IR" }
    ] }],
    availablePlayers: ["stash-wr"]
  };
}

function futureInputs() {
  const ids = ["qb", "rb", "bench-qb", "bench-rb", "stash-wr"];
  const points = new Map([
    ["qb", 20],
    ["rb", 10],
    ["bench-qb", 8],
    ["bench-rb", 6],
    ["stash-wr", 20]
  ]);
  return {
    identityMap: new Map(ids.map((id) => [`provider-${id}`, id])),
    projectionSet: {
      provider: "fixture-provider",
      scoringFormat: "PPR",
      capturedAt: "2026-09-05T12:00:00.000Z",
      projections: ids.map((id) => ({
        providerPlayerId: `provider-${id}`,
        week: 2,
        points: points.get(id),
        capturedAt: "2026-09-05T12:00:00.000Z"
      }))
    }
  };
}

test("current ESPN IR occupants do not reduce actionable projection coverage", () => {
  const value = snapshot();
  const inputs = futureInputs();
  const plan = buildScenarioPlan(value, "mine", {
    weeks: [2],
    identityMap: inputs.identityMap,
    projectionSet: inputs.projectionSet,
    now: 0,
    includeCurrentWeekScenarios: false
  });

  assert.equal(plan.status, "ready");
  assert.equal(plan.weeklyBaseline[0].completeCoverage, true);
  assert.equal(plan.weeklyBaseline[0].mappedProjectionCount, 4);
  assert.equal(plan.weeklyBaseline[0].rosterPlayerCount, 4);
  assert.deepEqual(plan.weeklyBaseline[0].excludedIrPlayerIds, ["ir"]);
  assert.equal(plan.coverage.mappedProjectionCells, 4);
  assert.equal(plan.coverage.requiredProjectionCells, 4);
  assert.equal(plan.coverage.percentage, 100);

  const gaps = buildProjectionGapReport(value, plan, inputs.identityMap);
  assert.equal(gaps.status, "complete");
  assert.deepEqual(gaps.records, []);

  const matrix = buildProjectionCoverageMatrix(value, "mine", {
    weeks: [2],
    identityMap: inputs.identityMap,
    projectionSet: inputs.projectionSet
  });
  assert.equal(matrix.status, "complete");
  assert.equal(matrix.rows.length, 4);
  assert.equal(matrix.rows.some((row) => row.espnPlayerId === "ir"), false);
  assert.deepEqual(matrix.excludedIrPlayerIds, ["ir"]);
});

test("an IR player without a future projection does not block future-only waiver discovery", () => {
  const value = snapshot();
  const inputs = futureInputs();
  const board = buildWaiverPriorityBoard(value, "mine", {
    now: 0,
    weeks: [2],
    identityMap: inputs.identityMap,
    projectionSet: inputs.projectionSet
  });

  assert.equal(board.status, "ready");
  assert.equal(board.current.items.length, 0);
  assert.equal(board.futureDiscovery.status, "ready");
  assert.equal(board.futureDiscovery.completeAdds, 1);
  assert.equal(board.futureDiscovery.qualifiedAdds, 1);
  assert.equal(board.items.length, 1);
  assert.equal(board.items[0].add.id, "stash-wr");
  assert.equal(board.items[0].candidateType, "future-only");
  assert.equal(board.futurePlan.weeklyBaseline[0].completeCoverage, true);
  assert.deepEqual(board.futurePlan.weeklyBaseline[0].excludedIrPlayerIds, ["ir"]);
});

test("missing future coverage for a non-IR bench player still blocks future-only discovery", () => {
  const value = snapshot();
  const inputs = futureInputs();
  inputs.identityMap.delete("provider-bench-rb");
  inputs.projectionSet.projections = inputs.projectionSet.projections.filter((item) => item.providerPlayerId !== "provider-bench-rb");

  const board = buildWaiverPriorityBoard(value, "mine", {
    now: 0,
    weeks: [2],
    identityMap: inputs.identityMap,
    projectionSet: inputs.projectionSet
  });

  assert.equal(board.status, "ready");
  assert.equal(board.futureDiscovery.status, "blocked-baseline");
  assert.equal(board.futureDiscovery.qualifiedAdds, 0);
  assert.match(board.futureDiscovery.reason, /every current active roster player/i);
});
