import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTrade } from "../src/domain/trade-analyzer.js";
import { createSyntheticApprovedTradeValueSource, inspectTradeValueSource } from "../src/domain/trade-value-source.js";

const NOW = Date.parse("2026-09-10T12:00:00Z");
const player = (id, position, projection, extra = {}) => ({ id, name: id, position, projection, gameTime: "2026-09-10T18:00:00Z", byeWeek: 14, injury: { status: "ACTIVE" }, ...extra });
const entry = (playerId, lineupSlot = "BE", extra = {}) => ({ playerId, lineupSlot, ...extra });
const proposal = (outgoing = ["a"], incoming = ["x"], drops = []) => ({ partnerTeamId: "other", outgoingPlayerIds: outgoing, incomingPlayerIds: incoming, plannedFollowUpDropIds: drops, teamObjective: "BALANCED" });
const fullRules = () => ({ size: 2, positionLimits: [{ position: "RB", limit: 2 }, { position: "WR", limit: 2 }] });
function snapshot() {
  return {
    provider: "espn", currentWeek: 5, meta: { capturedAt: "2026-09-10T11:55:00Z", projectionsSource: "ESPN" },
    league: { season: 2026, scoringType: "PPR", rosterRules: fullRules(), lineupSlots: [{ slot: "RB", count: 1 }, { slot: "BE", count: 1 }], playoffWeeks: [] },
    teams: [{ id: "mine", name: "Mine" }, { id: "other", name: "Other" }],
    players: [player("a", "RB", 10), player("b", "WR", 5), player("x", "RB", 14), player("y", "WR", 6)],
    rosters: [{ teamId: "mine", entries: [entry("a", "RB"), entry("b")] }, { teamId: "other", entries: [entry("x", "RB"), entry("y")] }],
    availablePlayers: [], matchups: []
  };
}
const analyze = (snap, trade = proposal()) => analyzeTrade(snap, "mine", trade, { now: NOW });

test("missing and malformed participant kickoff evidence cannot create current-week upgrade or CONSIDER", () => {
  const invalid = [undefined, null, "", "bad", "2026-09-10T18:00:00", "2026-02-30T18:00:00Z", "2026-09-10T18:00:00+14:30"];
  for (const kickoff of invalid) {
    for (const id of ["a", "x"]) {
      const snap = snapshot();
      if (kickoff === undefined) delete snap.players.find((item) => item.id === id).gameTime;
      else snap.players.find((item) => item.id === id).gameTime = kickoff;
      const result = analyze(snap);
      assert.equal(result.currentWeek.direction, "UNKNOWN", `${id}: ${kickoff}`);
      assert.equal(result.currentWeek.actionability, "INFORMATIONAL_ONLY", `${id}: ${kickoff}`);
      assert.notEqual(result.analysisState, "READY", `${id}: ${kickoff}`);
      assert.ok(result.currentWeek.locks.some((item) => item.playerId === id && ["MISSING", "MALFORMED"].includes(item.status)));
      assert.ok(!result.doNothing.materialBenefits.includes("CURRENT_WEEK_UPGRADE"));
      assert.notEqual(result.doNothing.recommendation, "CONSIDER");
    }
  }
});

test("explicit follow-up drops require valid kickoff; exact, past, and explicit locks stay informational", () => {
  const expansion = snapshot();
  expansion.league.rosterRules.size = 3;
  expansion.players.push(player("z", "RB", 7));
  expansion.rosters[1].entries.push(entry("z"));
  const trade = proposal(["a"], ["x", "z"], ["b"]);
  // A follow-up drop is invalid when no known rule demands it; size two creates a known direct violation.
  expansion.league.rosterRules.size = 2;
  expansion.players.find((item) => item.id === "b").gameTime = null;
  const drop = analyze(expansion, trade);
  assert.equal(drop.currentWeek.actionability, "INFORMATIONAL_ONLY");
  assert.equal(drop.currentWeek.direction, "UNKNOWN");
  assert.ok(drop.currentWeek.locks.some((item) => item.playerId === "b" && item.status === "MISSING"));
  for (const [kickoff, expected] of [["2026-09-10T12:00:00Z", "ALREADY_STARTED"], ["2026-09-10T11:59:59Z", "ALREADY_STARTED"]]) {
    const snap = snapshot(); snap.players[0].gameTime = kickoff;
    const result = analyze(snap);
    assert.equal(result.currentWeek.actionability, "INFORMATIONAL_ONLY");
    assert.ok(result.currentWeek.locks.some((item) => item.playerId === "a" && item.status === expected));
    assert.notEqual(result.doNothing.recommendation, "CONSIDER");
  }
  const locked = snapshot(); locked.rosters[0].entries[0].locked = true;
  const result = analyze(locked);
  assert.ok(result.currentWeek.locks.some((item) => item.status === "EXPLICIT_ESPN_LOCK"));
  assert.notEqual(result.doNothing.recommendation, "CONSIDER");
});

test("incomplete roster size, position limits and player identities never verify legality", () => {
  const cases = [
    (s) => delete s.league.rosterRules,
    (s) => delete s.league.rosterRules.size,
    (s) => { s.league.rosterRules.size = null; },
    (s) => { s.league.rosterRules.size = Infinity; },
    (s) => delete s.league.rosterRules.positionLimits,
    (s) => { s.league.rosterRules.positionLimits = []; },
    (s) => { s.league.rosterRules.positionLimits = [{ position: "RB", limit: 2 }]; },
    (s) => { s.league.rosterRules.positionLimits = [{ position: "RB", limit: NaN }]; },
    (s) => { s.players.find((item) => item.id === "x").position = null; }
  ];
  for (const alter of cases) {
    const snap = snapshot(); alter(snap);
    const result = analyze(snap);
    assert.notEqual(result.validation.userRosterLegality, "VERIFIED");
    assert.equal(result.doNothing.recommendation, "NOT_ENOUGH_EVIDENCE");
    assert.notEqual(result.analysisState, "READY");
    const uneven = analyze(snap, proposal(["a", "b"], ["x"]));
    assert.equal(uneven.resolvedPostTradeEntries, null);
    assert.notEqual(uneven.doNothing.recommendation, "CONSIDER");
  }
});

test("reciprocal opponent size and position violations require explicit action, while complete legal trades verify", () => {
  const complete = analyze(snapshot());
  assert.equal(complete.validation.opponentRosterLegality, "VERIFIED");
  assert.equal(complete.rosterSpace.opponent.status, "VERIFIED");

  const size = analyze(snapshot(), proposal(["a", "b"], ["x"]));
  assert.equal(size.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(size.validation.opponentRosterLegality, "ACTION_REQUIRED");
  assert.equal(size.rosterSpace.opponent.status, "ACTION_REQUIRED");
  assert.ok(size.rosterSpace.opponent.violations.some((item) => item.kind === "ROSTER_SIZE"));
  assert.equal(size.doNothing.recommendation, "NOT_ENOUGH_EVIDENCE");
  assert.equal(size.resolvedPostTradeEntries, null);

  const reciprocal = analyze(snapshot(), proposal(["a"], ["x", "y"]));
  assert.equal(reciprocal.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(reciprocal.validation.opponentRosterLegality, "VERIFIED");
  assert.equal(reciprocal.roster.requiredFollowUpRemovals, 1);

  const position = snapshot();
  position.league.rosterRules.size = 4;
  position.league.rosterRules.positionLimits[0].limit = 1;
  position.players.push(player("z", "RB", 8));
  position.rosters[1].entries.push(entry("z"));
  position.players.find((item) => item.id === "x").position = "WR";
  const overflow = analyze(position, proposal(["a"], ["x"]));
  assert.equal(overflow.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.ok(overflow.rosterSpace.opponent.violations.some((item) => item.kind === "POSITION_LIMIT"));
});

test("package value rejects invalid or materially future timestamps with explicit one-minute skew", () => {
  const snap = snapshot();
  for (const [asOf, status] of [
    ["2026-09-10T12:00:00Z", "READY"],
    ["2026-09-10T12:01:00Z", "READY"],
    ["2026-09-10T12:01:01Z", "WITHHELD"],
    ["bad", "WITHHELD"],
    ["2026-09-10T12:00:00", "WITHHELD"],
    ["2026-02-30T12:00:00Z", "WITHHELD"],
    ["2026-09-10T12:00:00+14:30", "WITHHELD"]
  ]) {
    const source = createSyntheticApprovedTradeValueSource({ asOf, values: { a: 10, x: 20 } });
    const result = inspectTradeValueSource(source, snap, ["a", "x"], { now: NOW });
    assert.equal(result.status, status, asOf);
    if (asOf === "2026-09-10T12:01:01Z") {
      assert.equal(result.freshness.status, "INVALID");
      assert.equal(result.freshness.ageMs, null);
      assert.ok(result.reasons.includes("SOURCE_FUTURE_DATED"));
    }
  }
});
