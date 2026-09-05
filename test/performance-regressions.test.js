import test from "node:test";
import assert from "node:assert/strict";

import { createLineupOptimizer } from "../src/domain/lineup-optimizer.js";
import { buildRosterAwareWaiverIdeas } from "../src/domain/waiver-engine.js";
import { normalizeFutureProjectionSet, indexFutureProjections } from "../src/providers/projections/future-projection-provider.js";

function waiverSnapshot() {
  return {
    currentWeek: 1,
    league: {
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: null },
      rosterRules: { size: 4, positionLimits: [] }
    },
    teams: [{ id: "mine", acquisition: { waiverRank: null, seasonAcquisitions: null, matchupAcquisitions: null, budgetSpent: null } }],
    players: [
      { id: "qb", name: "Quarterback", position: "QB", projection: 20 },
      { id: "rb", name: "Starter Back", position: "RB", projection: 10 },
      { id: "bench-qb", name: "Bench Quarterback", position: "QB", projection: 8 },
      { id: "bench-rb", name: "Bench Back", position: "RB", projection: 6 },
      { id: "add-wr", name: "Available Receiver", position: "WR", projection: 16 },
      { id: "add-rb", name: "Available Back", position: "RB", projection: 14 }
    ],
    rosters: [{
      teamId: "mine",
      entries: [
        { playerId: "qb", lineupSlot: "QB" },
        { playerId: "rb", lineupSlot: "FLEX" },
        { playerId: "bench-qb", lineupSlot: "BE" },
        { playerId: "bench-rb", lineupSlot: "BE" }
      ]
    }],
    availablePlayers: ["add-wr", "add-rb"]
  };
}

test("waiver memoization keeps the exhaustive analysis behind view limits and invalidates on same-object input changes", () => {
  const snapshot = waiverSnapshot();

  const limited = buildRosterAwareWaiverIdeas(snapshot, "mine", 0, 1);
  assert.equal(limited.status, "ready");
  assert.equal(limited.items.length, 1);
  assert.equal(limited.items[0].add.id, "add-wr");

  const full = buildRosterAwareWaiverIdeas(snapshot, "mine", 0, 8);
  assert.equal(full.items.length, 2);
  assert.strictEqual(limited.items[0], full.items[0]);
  assert.deepEqual(full.items.map((item) => item.add.id), ["add-wr", "add-rb"]);

  snapshot.players.find((player) => player.id === "add-wr").projection = 5;
  const afterProjectionChange = buildRosterAwareWaiverIdeas(snapshot, "mine", 0, 8);
  assert.equal(afterProjectionChange.items.some((item) => item.add.id === "add-wr"), false);
  assert.equal(afterProjectionChange.items[0].add.id, "add-rb");

  snapshot.availablePlayers = snapshot.availablePlayers.filter((id) => id !== "add-rb");
  const afterAvailabilityChange = buildRosterAwareWaiverIdeas(snapshot, "mine", 0, 8);
  assert.equal(afterAvailabilityChange.items.length, 0);
});

test("one lineup optimizer context can evaluate repeated roster simulations without mutating the source entries", () => {
  const players = new Map([
    ["qb", { id: "qb", name: "Quarterback", position: "QB", projection: 20 }],
    ["rb", { id: "rb", name: "Running Back", position: "RB", projection: 10 }],
    ["bench", { id: "bench", name: "Bench Receiver", position: "WR", projection: 6 }],
    ["add", { id: "add", name: "Added Receiver", position: "WR", projection: 16 }]
  ]);
  const entries = [
    { playerId: "qb", lineupSlot: "QB" },
    { playerId: "rb", lineupSlot: "FLEX" },
    { playerId: "bench", lineupSlot: "BE" }
  ];
  const before = structuredClone(entries);
  const optimizer = createLineupOptimizer(players, 0);

  const baseline = optimizer.optimize(entries);
  const simulatedEntries = entries.map((entry) => entry.playerId === "bench" ? { ...entry, playerId: "add" } : entry);
  const simulated = optimizer.optimize(simulatedEntries);

  assert.equal(baseline.projectedTotal, 30);
  assert.equal(simulated.projectedTotal, 36);
  assert.equal(simulated.gain, 6);
  assert.deepEqual(entries, before);
});

test("frozen future projection sets reuse their normalized result and projection index", () => {
  const normalized = normalizeFutureProjectionSet({
    provider: "fixture-provider",
    scoringFormat: "PPR",
    season: 2026,
    capturedAt: "2026-09-05T12:00:00Z",
    projections: [
      { providerPlayerId: "provider-1", week: 1, points: 12.5, capturedAt: "2026-09-05T12:00:00Z" },
      { providerPlayerId: "provider-1", week: 2, points: 13.5, capturedAt: "2026-09-05T12:00:00Z" }
    ]
  });

  assert.equal(normalized.valid, true);
  assert.equal(Object.isFrozen(normalized.value), true);
  assert.strictEqual(normalizeFutureProjectionSet(normalized.value), normalized);

  const firstIndex = indexFutureProjections(normalized.value);
  const secondIndex = indexFutureProjections(normalized.value);
  assert.strictEqual(firstIndex, secondIndex);
  assert.equal(firstIndex.get("provider-1:1"), 12.5);
  assert.equal(firstIndex.get("provider-1:2"), 13.5);
});
