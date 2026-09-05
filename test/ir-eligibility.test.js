import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePlayerIrEligibility, evaluateTeamIrState } from "../src/domain/ir-eligibility.js";
import { buildRosterAwareWaiverIdeas, revalidateWaiverRecommendation } from "../src/domain/waiver-engine.js";
import { buildWeeklyChecklist } from "../src/domain/weekly-checklist.js";

function player(id, name, position, projection, status = null) {
  return { id, name, position, projection, injury: status ? { status } : null, gameTime: null };
}

function snapshot() {
  return {
    currentWeek: 1,
    league: {
      lineupSlots: [
        { slot: "QB", count: 1 }, { slot: "RB", count: 1 }, { slot: "FLEX", count: 1 },
        { slot: "BE", count: 3 }, { slot: "IR", count: 1 }
      ],
      rosterRules: { size: 7, positionLimits: [] },
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [{ id: "mine", acquisition: { waiverRank: 4, seasonAcquisitions: 0, matchupAcquisitions: 0, budgetSpent: 0 } }],
    players: [
      player("qb", "Quarterback", "QB", 20, "ACTIVE"),
      player("rb", "Starter Back", "RB", 12, "ACTIVE"),
      player("flex", "Flex Receiver", "WR", 10, "ACTIVE"),
      player("out", "Injured Bench Back", "RB", 4, "OUT"),
      player("bench", "Healthy Bench Receiver", "WR", 6, "ACTIVE"),
      player("add", "Available Receiver", "WR", 15, "ACTIVE")
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

test("ESPN IR policy proves OUT and IR for new placement while raw PUP remains unverified", () => {
  assert.equal(evaluatePlayerIrEligibility(player("1", "Out", "RB", 1, "OUT"), "BE").canMoveToIr, true);
  assert.equal(evaluatePlayerIrEligibility(player("2", "IR", "RB", 1, "INJURED_RESERVE"), "BE").canMoveToIr, true);
  assert.equal(evaluatePlayerIrEligibility(player("3", "Questionable", "RB", 1, "QUESTIONABLE"), "BE").canMoveToIr, false);
  assert.equal(evaluatePlayerIrEligibility(player("4", "Suspended", "RB", 1, "SUSPENSION"), "BE").canMoveToIr, false);
  const pup = evaluatePlayerIrEligibility(player("5", "PUP", "RB", 1, "PHYSICALLY_UNABLE_TO_PERFORM"), "BE");
  assert.equal(pup.status, "unverified");
  assert.equal(pup.canMoveToIr, null);
  assert.match(pup.reason, /If ESPN surfaces the player as OUT or IR/);
});

test("Q and D players already in IR are grandfathered but cannot be newly moved there", () => {
  const questionable = player("q", "Questionable", "WR", 1, "QUESTIONABLE");
  const doubtful = player("d", "Doubtful", "WR", 1, "DOUBTFUL");
  assert.deepEqual(evaluatePlayerIrEligibility(questionable, "IR"), {
    status: "grandfathered", injuryStatus: "QUESTIONABLE", canMoveToIr: false, canRemainInIr: true,
    reason: "ESPN reports questionable while the player is already in IR; ESPN policy allows this player to remain there but not to be newly moved into IR at this designation."
  });
  assert.equal(evaluatePlayerIrEligibility(doubtful, "IR").canRemainInIr, true);
  assert.equal(evaluatePlayerIrEligibility(questionable, "BE").canRemainInIr, false);
});

test("team IR state reports configured capacity and eligible bench transitions", () => {
  const state = evaluateTeamIrState(snapshot(), "mine");
  assert.equal(state.status, "ready");
  assert.equal(state.configuredSlots, 1);
  assert.equal(state.occupiedSlots, 0);
  assert.equal(state.openSlots, 1);
  assert.deepEqual(state.benchPlaceableEntries.map((item) => item.player.id), ["out"]);
  assert.equal(state.blocksAcquisitions, false);
});

test("healthy or otherwise ineligible IR occupants invalidate acquisition legality", () => {
  const value = snapshot();
  value.rosters[0].entries.find((entry) => entry.playerId === "bench").lineupSlot = "IR";
  const state = evaluateTeamIrState(value, "mine");
  assert.equal(state.status, "invalid");
  assert.equal(state.blocksAcquisitions, true);
  assert.equal(state.invalidEntries[0].player.id, "bench");
  assert.match(state.reason, /waiver and free-agent moves may be blocked/);
});

test("unsupported ESPN injury designations fail closed instead of guessing IR legality", () => {
  const value = snapshot();
  value.players.find((item) => item.id === "out").injury = { status: "UNKNOWN", sourceStatus: "NEW_ESPN_CODE" };
  value.rosters[0].entries.find((entry) => entry.playerId === "out").lineupSlot = "IR";
  const state = evaluateTeamIrState(value, "mine");
  assert.equal(state.status, "unverified");
  assert.equal(state.blocksAcquisitions, null);
  assert.match(state.reason, /cannot be verified/);
});

test("waiver ideas and prior recommendations respect current ESPN IR validity", () => {
  const before = snapshot();
  const recommendation = buildRosterAwareWaiverIdeas(before, "mine", 0).items[0];
  assert.ok(recommendation);
  assert.match(buildRosterAwareWaiverIdeas(before, "mine", 0).limitations.join(" "), /IR slot is open/);

  const invalid = structuredClone(before);
  invalid.rosters[0].entries.find((entry) => entry.playerId === "bench").lineupSlot = "IR";
  const blocked = buildRosterAwareWaiverIdeas(invalid, "mine", 0);
  assert.equal(blocked.status, "incomplete-lineup");
  assert.equal(blocked.items.length, 0);
  assert.match(blocked.limitations[0], /in IR without a currently valid ESPN IR designation/);

  const review = revalidateWaiverRecommendation(invalid, "mine", recommendation, 0);
  assert.equal(review.status, "obsolete");
  assert.match(review.reason, /waiver and free-agent moves may be blocked/);
});

test("weekly checklist surfaces both usable IR space and invalid IR occupants", () => {
  const value = snapshot();
  const opportunity = buildWeeklyChecklist(value, "mine", 0).items.find((item) => item.id === "ir-opportunity:out");
  assert.equal(opportunity.status, "needs-action");
  assert.match(opportunity.detail, /can free active-roster space/);

  value.rosters[0].entries.find((entry) => entry.playerId === "bench").lineupSlot = "IR";
  const invalid = buildWeeklyChecklist(value, "mine", 0).items.find((item) => item.id === "ir-invalid:bench");
  assert.equal(invalid.urgency, "critical");
  assert.match(invalid.title, /no longer IR-eligible/);
  assert.match(invalid.detail, /block waiver and free-agent moves/);
});
