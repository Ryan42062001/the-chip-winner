import test from "node:test";
import assert from "node:assert/strict";
import { buildWaiverPriorityBoard } from "../src/domain/waiver-priority-engine.js";

function snapshot({ stashProjection = 9, locked = false, exhausted = false, rosterRules = null } = {}) {
  return {
    currentWeek: 1,
    meta: { capturedAt: "2026-09-05T12:00:00.000Z" },
    league: {
      waiver: { acquisitionLimit: exhausted ? 1 : -1, matchupAcquisitionLimit: -1 },
      ...(rosterRules ? { rosterRules } : {})
    },
    teams: [{
      id: "mine",
      acquisition: { waiverRank: 3, seasonAcquisitions: exhausted ? 1 : 0, matchupAcquisitions: 0 }
    }],
    players: [
      { id: "qb", name: "Quarterback", position: "QB", projection: 20, injury: { status: "ACTIVE" } },
      { id: "rb", name: "Starter Back", position: "RB", projection: 10, injury: { status: "ACTIVE" } },
      { id: "bench-qb", name: "Bench Quarterback", position: "QB", projection: 8, injury: { status: "ACTIVE" } },
      { id: "bench-rb", name: "Bench Back", position: "RB", projection: 6, injury: { status: "ACTIVE" } },
      { id: "stash-wr", name: "Future Stash Receiver", position: "WR", projection: stashProjection, locked, injury: { status: "ACTIVE" } }
    ],
    rosters: [{ teamId: "mine", entries: [
      { playerId: "qb", lineupSlot: "QB" },
      { playerId: "rb", lineupSlot: "FLEX" },
      { playerId: "bench-qb", lineupSlot: "BE" },
      { playerId: "bench-rb", lineupSlot: "BE" }
    ] }],
    availablePlayers: ["stash-wr"]
  };
}

function futureInputs(value, { omit = null } = {}) {
  const points = new Map([
    ["qb", 20],
    ["rb", 10],
    ["bench-qb", 8],
    ["bench-rb", 6],
    ["stash-wr", 20]
  ]);
  return {
    identityMap: new Map(value.players.map((player) => [`provider-${player.id}`, player.id])),
    projectionSet: {
      provider: "fixture-provider",
      scoringFormat: "PPR",
      capturedAt: "2026-09-05T12:00:00.000Z",
      projections: value.players
        .filter((player) => player.id !== omit)
        .map((player) => ({ providerPlayerId: `provider-${player.id}`, week: 2, points: points.get(player.id) }))
    }
  };
}

function boardFor(value, inputs) {
  return buildWaiverPriorityBoard(value, "mine", {
    now: 0,
    weeks: [2],
    identityMap: inputs.identityMap,
    projectionSet: inputs.projectionSet
  });
}

test("discovers a legal future-only stash that does not clear the current-week action threshold", () => {
  const value = snapshot();
  const board = boardFor(value, futureInputs(value));

  assert.equal(board.status, "ready");
  assert.equal(board.current.items.length, 0);
  assert.equal(board.futureDiscovery.status, "ready");
  assert.equal(board.futureDiscovery.qualifiedAdds, 1);
  assert.equal(board.items.length, 1);

  const stash = board.items[0];
  assert.equal(stash.add.id, "stash-wr");
  assert.equal(stash.candidateType, "future-only");
  assert.equal(stash.kind, "add-drop");
  assert.equal(stash.currentWeek.lineupGain, 0);
  assert.equal(stash.future.status, "ready");
  assert.equal(stash.future.horizonGain, 10);
  assert.equal(stash.future.positiveWeeks, 1);
  assert.match(stash.priorityReason, /Future-only stash/i);
});

test("does not relabel a player as future-only when the move already clears the current-week threshold", () => {
  const value = snapshot({ stashProjection: 11 });
  const board = boardFor(value, futureInputs(value));

  assert.equal(board.current.items.length, 1);
  assert.equal(board.items.length, 1);
  assert.equal(board.items[0].add.id, "stash-wr");
  assert.equal(board.items[0].candidateType, "current-week");
  assert.equal(board.futureDiscovery.qualifiedAdds, 0);
});

test("withholds future-only discovery when the add lacks a selected-week projection", () => {
  const value = snapshot();
  const board = boardFor(value, futureInputs(value, { omit: "stash-wr" }));

  assert.equal(board.status, "ready");
  assert.equal(board.futureDiscovery.status, "ready");
  assert.equal(board.futureDiscovery.completeAdds, 0);
  assert.equal(board.futureDiscovery.qualifiedAdds, 0);
  assert.equal(board.items.length, 0);
});

test("blocks future-only discovery when active baseline roster projection coverage is incomplete", () => {
  const value = snapshot();
  const board = boardFor(value, futureInputs(value, { omit: "bench-rb" }));

  assert.equal(board.status, "ready");
  assert.equal(board.futureDiscovery.status, "blocked-baseline");
  assert.equal(board.futureDiscovery.qualifiedAdds, 0);
  assert.equal(board.items.length, 0);
  assert.match(board.futureDiscovery.reason, /every current active roster player/i);
});

test("excludes a locked future-only add before scenario generation", () => {
  const value = snapshot({ locked: true });
  const board = boardFor(value, futureInputs(value));

  assert.equal(board.status, "ready");
  assert.equal(board.futureDiscovery.status, "ready");
  assert.equal(board.futureDiscovery.consideredAdds, 0);
  assert.equal(board.futureDiscovery.scenarioCount, 0);
  assert.equal(board.items.length, 0);
});

test("current ESPN acquisition exhaustion blocks both current and future-only waiver candidates", () => {
  const value = snapshot({ exhausted: true });
  const board = boardFor(value, futureInputs(value));

  assert.equal(board.status, "acquisition-limit-reached");
  assert.equal(board.items.length, 0);
  assert.equal(board.futureDiscovery, null);
});

test("scenario planner roster-position legality can reject an otherwise projected future stash", () => {
  const value = snapshot({ rosterRules: { size: 4, positionLimits: [{ position: "WR", limit: 0 }] } });
  const board = boardFor(value, futureInputs(value));

  assert.equal(board.status, "ready");
  assert.equal(board.futureDiscovery.status, "ready");
  assert.equal(board.futureDiscovery.scenarioCount, 2);
  assert.equal(board.futureDiscovery.qualifiedAdds, 0);
  assert.equal(board.items.length, 0);
  assert.ok(board.futurePlan.rejectedScenarios.some((item) => /WR roster limit/i.test(item.reason)));
});
