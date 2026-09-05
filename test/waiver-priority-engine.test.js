import test from "node:test";
import assert from "node:assert/strict";
import { assignWaiverPriorityBands, buildWaiverPriorityBoard } from "../src/domain/waiver-priority-engine.js";

function rankedItem(id, factors) {
  return {
    id,
    future: { status: factors.futureHorizonGain == null ? "missing-inputs" : "ready" },
    factors: {
      currentWeekGain: factors.currentWeekGain ?? null,
      futureHorizonGain: factors.futureHorizonGain ?? null,
      futurePositiveWeekRate: factors.futurePositiveWeekRate ?? null,
      replacementPointsAbove: factors.replacementPointsAbove ?? null,
      preservesRosteredPlayer: factors.preservesRosteredPlayer ?? 0
    }
  };
}

function snapshot() {
  return {
    currentWeek: 1,
    meta: { capturedAt: "2026-09-05T12:00:00.000Z" },
    league: { waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 } },
    teams: [{ id: "mine", acquisition: { waiverRank: 3, seasonAcquisitions: 0, matchupAcquisitions: 0 } }],
    players: [
      { id: "qb", name: "Quarterback", position: "QB", projection: 20, injury: { status: "ACTIVE" } },
      { id: "rb", name: "Starter Back", position: "RB", projection: 10, injury: { status: "ACTIVE" } },
      { id: "bench-qb", name: "Bench Quarterback", position: "QB", projection: 8, injury: { status: "ACTIVE" } },
      { id: "bench-rb", name: "Bench Back", position: "RB", projection: 6, injury: { status: "ACTIVE" } },
      { id: "add-wr", name: "Available Receiver", position: "WR", projection: 16, injury: { status: "ACTIVE" } },
      { id: "add-rb", name: "Available Back", position: "RB", projection: 14, injury: { status: "ACTIVE" } }
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

function futureInputs(value) {
  const weekTwoPoints = new Map([
    ["qb", 20],
    ["rb", 10],
    ["bench-qb", 8],
    ["bench-rb", 6],
    ["add-wr", 12],
    ["add-rb", 18]
  ]);
  return {
    identityMap: new Map(value.players.map((player) => [`provider-${player.id}`, player.id])),
    projectionSet: {
      provider: "fixture-provider",
      scoringFormat: "PPR",
      capturedAt: "2026-09-05T12:00:00.000Z",
      projections: value.players.map((player) => ({
        providerPlayerId: `provider-${player.id}`,
        week: 2,
        points: weekTwoPoints.get(player.id)
      }))
    }
  };
}

test("priority bands prefer a no-drop path only when the other known factors are equal", () => {
  const items = assignWaiverPriorityBands([
    rankedItem("drop", { currentWeekGain: 3, futureHorizonGain: 5, futurePositiveWeekRate: 1, replacementPointsAbove: 2, preservesRosteredPlayer: 0 }),
    rankedItem("ir", { currentWeekGain: 3, futureHorizonGain: 5, futurePositiveWeekRate: 1, replacementPointsAbove: 2, preservesRosteredPlayer: 1 })
  ]);
  assert.equal(items.find((item) => item.id === "ir").priorityBand, 1);
  assert.equal(items.find((item) => item.id === "drop").priorityBand, 2);
});

test("priority bands keep genuine current-versus-future tradeoffs together instead of hiding weights", () => {
  const items = assignWaiverPriorityBands([
    rankedItem("now", { currentWeekGain: 6, futureHorizonGain: 2, futurePositiveWeekRate: 0.5, replacementPointsAbove: 1, preservesRosteredPlayer: 0 }),
    rankedItem("later", { currentWeekGain: 3, futureHorizonGain: 9, futurePositiveWeekRate: 1, replacementPointsAbove: 1, preservesRosteredPlayer: 0 })
  ]);
  assert.deepEqual(items.map((item) => item.priorityBand), [1, 1]);
});

test("missing future evidence is never treated as zero for dominance", () => {
  const items = assignWaiverPriorityBands([
    rankedItem("known", { currentWeekGain: 4, futureHorizonGain: 1, futurePositiveWeekRate: 1, replacementPointsAbove: null, preservesRosteredPlayer: 0 }),
    rankedItem("unknown", { currentWeekGain: 2, futureHorizonGain: null, futurePositiveWeekRate: null, replacementPointsAbove: null, preservesRosteredPlayer: 0 })
  ]);
  assert.deepEqual(items.map((item) => item.priorityBand), [1, 1]);
});

test("priority board exposes current, future, roster-fit, replacement, and preservation factors without a composite score", () => {
  const value = snapshot();
  const { identityMap, projectionSet } = futureInputs(value);
  const board = buildWaiverPriorityBoard(value, "mine", {
    now: 0,
    weeks: [2],
    identityMap,
    projectionSet
  });

  assert.equal(board.status, "ready");
  assert.equal(board.items.length, 2);
  assert.equal(board.futurePlan.status, "ready");
  assert.equal(Object.hasOwn(board.items[0], "score"), false);
  assert.equal(Object.hasOwn(board.items[0], "weightedScore"), false);

  const receiver = board.items.find((item) => item.add.id === "add-wr");
  const back = board.items.find((item) => item.add.id === "add-rb");
  assert.equal(receiver.currentWeek.lineupGain, 6);
  assert.equal(receiver.future.status, "ready");
  assert.equal(receiver.future.horizonGain, 2);
  assert.equal(receiver.future.positiveWeeks, 1);
  assert.equal(receiver.rosterFit.positionDepthBefore, 0);
  assert.equal(receiver.replacement.status, "unavailable");
  assert.equal(receiver.preservation.status, "drop-required");

  assert.equal(back.currentWeek.lineupGain, 4);
  assert.equal(back.future.horizonGain, 8);
  assert.equal(back.rosterFit.positionDepthBefore, 2);
  assert.equal(receiver.priorityBand, 1);
  assert.equal(back.priorityBand, 1);
  assert.match(board.limitations.join(" "), /Pareto dominance/);
  assert.match(board.limitations.join(" "), /no universal positional-need threshold/i);
});

test("priority board preserves blocked future evidence as blocked instead of falling back to zero", () => {
  const value = snapshot();
  const { identityMap, projectionSet } = futureInputs(value);
  projectionSet.projections = projectionSet.projections.filter((item) => item.providerPlayerId !== "provider-add-wr");
  const board = buildWaiverPriorityBoard(value, "mine", { now: 0, weeks: [2], identityMap, projectionSet });
  const receiver = board.items.find((item) => item.add.id === "add-wr");
  assert.equal(receiver.future.status, "blocked");
  assert.equal(receiver.factors.futureHorizonGain, null);
  assert.equal(receiver.factors.futurePositiveWeekRate, null);
});
