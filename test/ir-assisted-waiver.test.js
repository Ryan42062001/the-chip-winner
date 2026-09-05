import test from "node:test";
import assert from "node:assert/strict";
import { buildRosterAwareWaiverIdeas, revalidateWaiverRecommendation } from "../src/domain/waiver-engine.js";
import { diffWaiverRecommendations } from "../src/domain/recommendation-change.js";

function player(id, name, position, projection, status = "ACTIVE") {
  return { id, name, position, projection, injury: status ? { status } : null, gameTime: null };
}

function snapshot() {
  return {
    currentWeek: 1,
    meta: { capturedAt: "2026-09-05T11:00:00.000Z" },
    league: {
      id: "league",
      lineupSlots: [
        { slot: "QB", count: 1 }, { slot: "RB", count: 1 }, { slot: "FLEX", count: 1 },
        { slot: "BE", count: 2 }, { slot: "IR", count: 1 }
      ],
      rosterRules: { size: 5, positionLimits: [] },
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [{ id: "mine", acquisition: { waiverRank: 3, seasonAcquisitions: 0, matchupAcquisitions: 0 } }],
    players: [
      player("qb", "Quarterback", "QB", 20),
      player("rb", "Starter Back", "RB", 12),
      player("flex", "Flex Receiver", "WR", 10),
      player("out", "Injured Bench Back", "RB", 4, "OUT"),
      player("bench", "Healthy Bench Receiver", "WR", 6),
      player("add", "Available Receiver", "WR", 15)
    ],
    rosters: [{ teamId: "mine", entries: [
      { playerId: "qb", lineupSlot: "QB" },
      { playerId: "rb", lineupSlot: "RB" },
      { playerId: "flex", lineupSlot: "FLEX" },
      { playerId: "out", lineupSlot: "BE" },
      { playerId: "bench", lineupSlot: "BE" }
    ] }],
    availablePlayers: ["add"]
  };
}

test("waiver engine prefers an ESPN-proven IR-assisted add over dropping a rostered player", () => {
  const result = buildRosterAwareWaiverIdeas(snapshot(), "mine", 0);
  assert.equal(result.status, "ready");
  assert.equal(result.items.length, 1);
  const idea = result.items[0];
  assert.equal(idea.kind, "ir-assisted-add");
  assert.equal(idea.add.id, "add");
  assert.equal(idea.drop, null);
  assert.equal(idea.irMove.player.id, "out");
  assert.deepEqual({ from: idea.irMove.from, to: idea.irMove.to }, { from: "BE", to: "IR" });
  assert.equal(idea.lineupGain, 5);
  assert.match(idea.reason, /without dropping a rostered player/);
});

test("IR-assisted add is withheld when the required injured player is locked", () => {
  const value = snapshot();
  value.rosters[0].entries.find((entry) => entry.playerId === "out").locked = true;
  const result = buildRosterAwareWaiverIdeas(value, "mine", 0);
  assert.equal(result.items[0].kind, "add-drop");
  assert.equal(result.items[0].irMove, null);
});

test("waiver engine fails closed when the reported active roster already exceeds ESPN's roster size", () => {
  const value = snapshot();
  value.league.rosterRules.size = 4;
  const result = buildRosterAwareWaiverIdeas(value, "mine", 0);
  assert.equal(result.items.length, 0);
  assert.match(result.limitations.join(" "), /simulated active roster would contain 5 players outside IR/);
});

test("IR-assisted recommendation revalidation tracks designation and IR-capacity changes", () => {
  const before = snapshot();
  const recommendation = buildRosterAwareWaiverIdeas(before, "mine", 0).items[0];
  assert.equal(revalidateWaiverRecommendation(structuredClone(before), "mine", recommendation, 0).status, "current");

  const questionable = structuredClone(before);
  questionable.players.find((item) => item.id === "out").injury = { status: "QUESTIONABLE" };
  const ineligible = revalidateWaiverRecommendation(questionable, "mine", recommendation, 0);
  assert.equal(ineligible.status, "obsolete");
  assert.match(ineligible.reason, /not eligible for a new IR placement/);

  const pup = structuredClone(before);
  pup.players.find((item) => item.id === "out").injury = { status: "PHYSICALLY_UNABLE_TO_PERFORM" };
  const unverified = revalidateWaiverRecommendation(pup, "mine", recommendation, 0);
  assert.equal(unverified.status, "unverified");
  assert.match(unverified.reason, /raw PUP status is not inferred eligible or ineligible/);

  const full = structuredClone(before);
  full.players.push(player("ir2", "Other Injured Player", "TE", 2, "INJURED_RESERVE"));
  full.rosters[0].entries.push({ playerId: "ir2", lineupSlot: "IR" });
  const noCapacity = revalidateWaiverRecommendation(full, "mine", recommendation, 0);
  assert.equal(noCapacity.status, "obsolete");
  assert.match(noCapacity.reason, /no longer reports an open IR slot/);
});

test("What Changed describes a prior IR-assisted waiver plan without inventing a drop", () => {
  const before = snapshot();
  const current = structuredClone(before);
  current.meta.capturedAt = "2026-09-05T11:05:00.000Z";
  current.availablePlayers = [];
  const changes = diffWaiverRecommendations(before, current, "mine", 0);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].drop, null);
  assert.equal(changes[0].irMove.player.id, "out");
  assert.match(changes[0].detail, /Move Injured Bench Back from the bench to IR, then add Available Receiver with no drop/);
});
