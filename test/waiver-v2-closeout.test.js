import test from "node:test";
import assert from "node:assert/strict";
import { buildRosterAwareWaiverIdeas } from "../src/domain/waiver-engine.js";
import { buildWaiverPriorityBoard } from "../src/domain/waiver-priority-engine.js";

function player(id, name, position, projection, { locked = false, gameTime = null, injury = "ACTIVE" } = {}) {
  return { id, name, position, projection, locked, gameTime, injury: injury ? { status: injury } : null };
}

function baseSnapshot({ addCount = 1, benchCount = 2, addProjection = 9 } = {}) {
  const benchPlayers = Array.from({ length: benchCount }, (_, index) =>
    player(`bench-${index + 1}`, `Bench ${index + 1}`, index % 2 ? "RB" : "WR", 5 + index)
  );
  const adds = Array.from({ length: addCount }, (_, index) =>
    player(`stash-${index + 1}`, `Future Stash ${index + 1}`, "WR", addProjection)
  );
  return {
    currentWeek: 1,
    meta: { capturedAt: "2026-09-05T12:00:00.000Z" },
    league: {
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 },
      lineupSlots: [
        { slot: "QB", count: 1 },
        { slot: "FLEX", count: 1 },
        { slot: "BE", count: benchCount },
        { slot: "IR", count: 1 }
      ]
    },
    teams: [{ id: "mine", acquisition: { waiverRank: 3, seasonAcquisitions: 0, matchupAcquisitions: 0 } }],
    players: [
      player("qb", "Quarterback", "QB", 20),
      player("flex", "Flex Starter", "RB", 10),
      ...benchPlayers,
      ...adds
    ],
    rosters: [{
      teamId: "mine",
      entries: [
        { playerId: "qb", lineupSlot: "QB" },
        { playerId: "flex", lineupSlot: "FLEX" },
        ...benchPlayers.map((item) => ({ playerId: item.id, lineupSlot: "BE" }))
      ]
    }],
    availablePlayers: adds.map((item) => item.id)
  };
}

function futureInputs(value, { week = 2 } = {}) {
  const identityMap = new Map(value.players.map((item) => [`provider-${item.id}`, item.id]));
  const projections = value.players.map((item, index) => ({
    providerPlayerId: `provider-${item.id}`,
    week,
    points: item.id.startsWith("stash-") ? 20 + index / 100 : item.projection
  }));
  return {
    identityMap,
    projectionSet: {
      provider: "fixture-provider",
      scoringFormat: "PPR",
      capturedAt: "2026-09-05T12:00:00.000Z",
      projections
    }
  };
}

function buildBoard(value, inputs = futureInputs(value), options = {}) {
  return buildWaiverPriorityBoard(value, "mine", {
    now: options.now ?? 0,
    weeks: [2],
    identityMap: inputs.identityMap,
    projectionSet: inputs.projectionSet,
    limit: options.limit ?? 8
  });
}

function signature(board) {
  return board.items.map((item) => ({
    add: item.add.id,
    drop: item.drop?.id || null,
    type: item.candidateType,
    band: item.priorityBand,
    current: item.currentWeek.lineupGain,
    future: item.future.horizonGain
  }));
}

test("future-only candidate disappears immediately when ESPN no longer reports the add available", () => {
  const before = baseSnapshot();
  assert.equal(buildBoard(before).futureDiscovery.qualifiedAdds, 1);

  const after = structuredClone(before);
  after.availablePlayers = [];
  const board = buildBoard(after, futureInputs(after));
  assert.equal(board.status, "ready");
  assert.equal(board.futureDiscovery.consideredAdds, 0);
  assert.equal(board.futureDiscovery.qualifiedAdds, 0);
  assert.equal(board.items.length, 0);
});

test("future-only candidate obeys kickoff lock transitions at the shared evaluation time", () => {
  const value = baseSnapshot();
  value.players.find((item) => item.id === "stash-1").gameTime = "2026-09-05T13:00:00.000Z";
  const inputs = futureInputs(value);

  const beforeKickoff = buildBoard(value, inputs, { now: Date.parse("2026-09-05T12:59:59.000Z") });
  const afterKickoff = buildBoard(value, inputs, { now: Date.parse("2026-09-05T13:00:00.000Z") });
  assert.equal(beforeKickoff.futureDiscovery.qualifiedAdds, 1);
  assert.equal(afterKickoff.futureDiscovery.consideredAdds, 0);
  assert.equal(afterKickoff.items.length, 0);
});

test("future-only discovery fails closed when every bench drop is locked", () => {
  const value = baseSnapshot();
  for (const entry of value.rosters[0].entries.filter((item) => item.lineupSlot === "BE")) entry.locked = true;
  const board = buildBoard(value);
  assert.equal(board.futureDiscovery.status, "no-legal-drops");
  assert.equal(board.futureDiscovery.scenarioCount, 0);
  assert.equal(board.items.length, 0);
});

test("known-ineligible ESPN IR occupant blocks the entire waiver board", () => {
  const value = baseSnapshot();
  value.players.push(player("bad-ir", "Healthy IR Occupant", "TE", 3, { injury: "ACTIVE" }));
  value.rosters[0].entries.push({ playerId: "bad-ir", lineupSlot: "IR" });
  const board = buildBoard(value, futureInputs(value));
  assert.equal(board.status, "incomplete-lineup");
  assert.equal(board.items.length, 0);
  assert.equal(board.futureDiscovery, null);
  assert.match(board.limitations.join(" "), /IR/i);
});

test("unverified raw PUP ESPN IR occupant withholds waiver legality instead of guessing", () => {
  const value = baseSnapshot();
  value.players.push(player("pup-ir", "PUP IR Occupant", "TE", 3, { injury: "PHYSICALLY_UNABLE_TO_PERFORM" }));
  value.rosters[0].entries.push({ playerId: "pup-ir", lineupSlot: "IR" });
  const board = buildBoard(value, futureInputs(value));
  assert.equal(board.status, "incomplete-lineup");
  assert.equal(board.items.length, 0);
  assert.equal(board.futureDiscovery, null);
  assert.match(board.limitations.join(" "), /unverified|PUP/i);
});

test("future-only discovery is invariant to ESPN available-player ordering", () => {
  const value = baseSnapshot({ addCount: 5, benchCount: 3 });
  const inputs = futureInputs(value);
  const forward = buildBoard(value, inputs, { limit: 20 });
  const reversedValue = structuredClone(value);
  reversedValue.availablePlayers.reverse();
  const reversed = buildBoard(reversedValue, inputs, { limit: 20 });

  assert.equal(forward.futureDiscovery.scenarioCount, 15);
  assert.equal(reversed.futureDiscovery.scenarioCount, 15);
  assert.deepEqual(signature(reversed), signature(forward));
});

test("large candidate pools are exhaustively legality-checked and report enumeration volume without silent truncation", () => {
  const value = baseSnapshot({ addCount: 24, benchCount: 4 });
  const board = buildBoard(value, futureInputs(value));

  assert.equal(board.futureDiscovery.status, "ready");
  assert.equal(board.futureDiscovery.consideredAdds, 24);
  assert.equal(board.futureDiscovery.completeAdds, 24);
  assert.equal(board.futureDiscovery.scenarioCount, 96);
  assert.equal(board.futureDiscovery.qualifiedAdds, 24);
  assert.equal(board.items.length, 8);
  assert.match(board.limitations.join(" "), /96 unlocked-bench add\/drop scenarios/i);
  assert.match(board.limitations.join(" "), /24 positive future-only stash candidates/i);
});

test("waiver priority evaluation never mutates the ESPN source snapshot", () => {
  const value = baseSnapshot({ addCount: 4, benchCount: 3 });
  const before = structuredClone(value);
  buildBoard(value, futureInputs(value), { limit: 20 });
  assert.deepEqual(value, before);
});

test("current-week waiver recommendations are unchanged when future inputs are unavailable", () => {
  const value = baseSnapshot({ addProjection: 12 });
  const current = buildRosterAwareWaiverIdeas(value, "mine", 0, 8);
  const board = buildWaiverPriorityBoard(value, "mine", { now: 0, limit: 8 });

  assert.equal(current.status, "ready");
  assert.equal(board.status, "ready");
  assert.equal(board.futureDiscovery.status, "missing-inputs");
  assert.deepEqual(
    board.items.map((item) => [item.add.id, item.drop?.id || null, item.kind, item.currentWeek.lineupGain]),
    current.items.map((item) => [item.add.id, item.drop?.id || null, item.kind, item.lineupGain])
  );
});
