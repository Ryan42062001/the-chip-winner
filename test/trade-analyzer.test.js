import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTrade } from "../src/domain/trade-analyzer.js";

const NOW = Date.parse("2026-09-10T12:00:00Z");

function player(id, position, projection, extra = {}) {
  return {
    id,
    name: extra.name || id.toUpperCase(),
    position,
    proTeam: extra.proTeam || "NFL",
    opponent: extra.opponent || "OPP",
    projection,
    gameTime: extra.gameTime ?? "2026-12-01T18:00:00Z",
    byeWeek: extra.byeWeek ?? 14,
    injury: extra.injury || { status: "ACTIVE" },
    ...extra
  };
}

function entry(playerId, lineupSlot, extra = {}) { return { playerId, lineupSlot, ...extra }; }

function snapshot({ players, mine, other = [], size = mine.filter((item) => item.lineupSlot !== "IR").length, positionLimits = [], lineupSlots = null, availablePlayers = [], includeAvailability = true, playoffWeeks = [], currentWeek = 5 } = {}) {
  const configured = lineupSlots || [
    { slot: "RB", count: 1 },
    { slot: "BE", count: Math.max(0, mine.filter((item) => item.lineupSlot === "BE").length) }
  ];
  return {
    schemaVersion: 1,
    provider: "espn",
    currentWeek,
    meta: { kind: "live-companion", capturedAt: "2026-09-10T11:55:00Z", projectionsSource: "ESPN" },
    league: {
      id: "league",
      name: "Trade Test League",
      season: 2026,
      scoringType: "PPR",
      receptionScoring: { family: "ppr", pointsPerReception: 1 },
      lineupSlots: configured,
      rosterRules: { size, positionLimits },
      playoffWeeks,
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [
      { id: "mine", name: "Mine", abbreviation: "ME", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } },
      { id: "other", name: "Other", abbreviation: "OTH", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } }
    ],
    players,
    rosters: [{ teamId: "mine", entries: mine }, { teamId: "other", entries: other }],
    matchups: [],
    ...(includeAvailability ? { availablePlayers } : {})
  };
}

function proposal(outgoingPlayerIds, incomingPlayerIds, extra = {}) {
  return { partnerTeamId: "other", outgoingPlayerIds, incomingPlayerIds, plannedFollowUpDropIds: [], teamObjective: "BALANCED", ...extra };
}

function analyze(snap, trade, options = {}) {
  return analyzeTrade(snap, "mine", trade, { now: NOW, ...options });
}

function externalInputs(snap, weeks, pointsFor, { omit = null } = {}) {
  const capturedAt = new Date().toISOString();
  const projections = [];
  const map = new Map();
  for (const p of snap.players) {
    const providerPlayerId = `ext-${p.id}`;
    map.set(providerPlayerId, p.id);
    for (const week of weeks) {
      if (omit && omit.playerId === p.id && omit.week === week) continue;
      projections.push({ providerPlayerId, week, points: pointsFor(p, week), capturedAt });
    }
  }
  return {
    futureProjectionSet: { provider: "External fixture", scoringFormat: "PPR", season: 2026, capturedAt, projections },
    identityMap: map
  };
}

test("1-for-1 starter upgrade uses optimized team consequence", () => {
  const snap = snapshot({
    players: [player("a", "RB", 10), player("x", "RB", 14)],
    mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1
  });
  const result = analyze(snap, proposal(["a"], ["x"]));
  assert.equal(result.analysisState, "READY");
  assert.equal(result.currentWeek.sources[0].delta, 4);
  assert.equal(result.currentWeek.direction, "UPGRADE");
  assert.deepEqual(result.currentWeek.sources[0].assignments.incomingStarters, ["x"]);
  assert.equal(result.conclusion, "CLEAR_TEAM_UPGRADE");
});

test("higher projected incoming player can remain bench depth with zero immediate starter benefit", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20), player("c", "RB", 5), player("x", "RB", 10)],
    mine: [entry("a", "RB"), entry("c", "BE")], other: [entry("x", "RB")], size: 2
  });
  const result = analyze(snap, proposal(["c"], ["x"]));
  assert.equal(result.currentWeek.sources[0].delta, 0);
  assert.equal(result.currentWeek.direction, "TOSSUP");
  assert.deepEqual(result.currentWeek.sources[0].assignments.incomingStarters, []);
  assert.deepEqual(result.currentWeek.sources[0].assignments.incomingBenchDepth, ["x"]);
});

test("2-for-1 consolidation exposes starter gain, open roster space, and depth cost without auto-add", () => {
  const snap = snapshot({
    players: [player("a", "RB", 10), player("c", "RB", 9), player("w", "WR", 10), player("x", "RB", 15), player("fa", "RB", 8)],
    mine: [entry("a", "RB"), entry("w", "WR"), entry("c", "BE")],
    other: [entry("x", "RB")],
    size: 3,
    lineupSlots: [{ slot: "RB", count: 1 }, { slot: "WR", count: 1 }, { slot: "BE", count: 1 }],
    availablePlayers: ["fa"]
  });
  const result = analyze(snap, proposal(["a", "c"], ["x"]));
  assert.equal(result.currentWeek.sources[0].delta, 5);
  assert.equal(result.roster.openRosterSpots, 1);
  assert.equal(result.depth.depthCost, true);
  assert.equal(result.resolvedPostTradeEntries.length, 2);
  assert.equal(result.replacement.candidates[0].playerId, "fa");
  assert.equal(result.transactionActions.length, 0);
});

test("1-for-2 on a full roster requires explicit removal and explicit drop resolves it", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20), player("c", "RB", 5), player("x", "RB", 10), player("y", "WR", 8)],
    mine: [entry("a", "RB"), entry("c", "BE")],
    other: [entry("x", "RB"), entry("y", "WR")], size: 2
  });
  const blocked = analyze(snap, proposal(["c"], ["x", "y"]));
  assert.equal(blocked.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(blocked.roster.requiredFollowUpRemovals, 1);
  assert.equal(blocked.resolvedPostTradeEntries, null);

  const resolved = analyze(snap, proposal(["c"], ["x", "y"], { plannedFollowUpDropIds: ["y"] }));
  assert.notEqual(resolved.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(resolved.resolvedPostTradeEntries.some((item) => item.playerId === "y"), false);
  assert.equal(resolved.roster.resolved.violations.length, 0);
});

test("1-for-2 proceeds when verified existing roster space exists", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20), player("c", "RB", 5), player("x", "RB", 10), player("y", "WR", 8)],
    mine: [entry("a", "RB"), entry("c", "BE")],
    other: [entry("x", "RB"), entry("y", "WR")], size: 3
  });
  const result = analyze(snap, proposal(["c"], ["x", "y"]));
  assert.notEqual(result.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(result.roster.resolved.activeCount, 3);
  assert.equal(result.roster.openRosterSpots, 0);
});

test("finite position limit violations fail before final lineup analysis", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20), player("c", "WR", 5), player("x", "RB", 10), player("y", "RB", 8)],
    mine: [entry("a", "RB"), entry("c", "BE")], other: [entry("x", "RB"), entry("y", "RB")],
    size: 4, positionLimits: [{ position: "RB", limit: 2 }]
  });
  const result = analyze(snap, proposal(["c"], ["x", "y"]));
  assert.equal(result.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(result.roster.direct.violations[0].kind, "POSITION_LIMIT");
  assert.equal(result.roster.direct.violations[0].position, "RB");
});

test("incoming players are active bench candidates and never automatically placed on IR", () => {
  const snap = snapshot({
    players: [player("a", "RB", 10), player("x", "RB", 12, { injury: { status: "OUT" } })],
    mine: [entry("a", "RB")], other: [entry("x", "IR")], size: 1,
    lineupSlots: [{ slot: "RB", count: 1 }, { slot: "IR", count: 1 }]
  });
  const result = analyze(snap, proposal(["a"], ["x"]));
  assert.equal(result.resolvedPostTradeEntries[0].lineupSlot, "BE");
  assert.equal(result.roster.incomingPlacedOnIr, false);
});

test("configured FLEX and OP eligibility is reused while unsupported slots fail closed", () => {
  const flex = snapshot({
    players: [player("w", "WR", 10), player("r", "RB", 15)],
    mine: [entry("w", "FLEX")], other: [entry("r", "RB")], size: 1,
    lineupSlots: [{ slot: "FLEX", count: 1 }]
  });
  assert.equal(analyze(flex, proposal(["w"], ["r"])).currentWeek.sources[0].delta, 5);

  const op = snapshot({
    players: [player("r", "RB", 10), player("q", "QB", 18)],
    mine: [entry("r", "OP")], other: [entry("q", "QB")], size: 1,
    lineupSlots: [{ slot: "OP", count: 1 }]
  });
  assert.equal(analyze(op, proposal(["r"], ["q"])).currentWeek.sources[0].delta, 8);

  const unsupported = structuredClone(flex);
  unsupported.league.lineupSlots.push({ slot: "ESPN_SLOT_99", count: 1 });
  const result = analyze(unsupported, proposal(["w"], ["r"]));
  assert.equal(result.currentWeek.sources[0].direction, "UNKNOWN");
  assert.match(result.limitations.join(" "), /fails closed/);
});

test("current-week ESPN lock or passed kickoff makes consequences informational only", () => {
  const explicit = snapshot({
    players: [player("a", "RB", 10), player("x", "RB", 14)],
    mine: [entry("a", "RB", { locked: true })], other: [entry("x", "RB")], size: 1
  });
  const locked = analyze(explicit, proposal(["a"], ["x"]));
  assert.equal(locked.currentWeek.actionability, "INFORMATIONAL_ONLY");
  assert.match(locked.currentWeek.locks[0].reason, /ESPN reported/);
  assert.match(locked.currentWeek.limitation, /does not claim whether ESPN would process/);

  const kickoff = snapshot({
    players: [player("a", "RB", 10, { gameTime: "2026-09-10T11:00:00Z" }), player("x", "RB", 14)],
    mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1
  });
  assert.match(analyze(kickoff, proposal(["a"], ["x"])).currentWeek.locks[0].reason, /kickoff time has passed/);
});

test("incomplete current union-roster projection coverage withholds numeric team delta", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20), player("c", "RB", null), player("x", "RB", 10)],
    mine: [entry("a", "RB"), entry("c", "BE")], other: [entry("x", "RB")], size: 2
  });
  const result = analyze(snap, proposal(["a"], ["x"]));
  assert.equal(result.currentWeek.sources[0].status, "UNKNOWN");
  assert.equal(result.currentWeek.sources[0].delta, null);
  assert.deepEqual(result.currentWeek.sources[0].missingPlayerIds, ["c"]);
});

test("material current-week source disagreement remains separate and is never averaged", () => {
  const snap = snapshot({
    players: [player("a", "RB", 10), player("x", "RB", 14)],
    mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1
  });
  const external = externalInputs(snap, [5], (p) => p.id === "a" ? 16 : 10);
  const result = analyze(snap, proposal(["a"], ["x"]), external);
  assert.equal(result.currentWeek.sources[0].direction, "UPGRADE");
  assert.equal(result.currentWeek.sources[1].direction, "DOWNGRADE");
  assert.equal(result.currentWeek.direction, "UNKNOWN");
  assert.equal(result.evidenceState, "SOURCE_DISAGREEMENT");
  assert.equal(result.conclusion, "BALANCED_OBJECTIVE_DEPENDENT");
  assert.doesNotMatch(JSON.stringify(result), /"delta":-?1(?:\.0)?[,}]/);
});

test("complete future window exposes aggregate and mean-weekly materiality", () => {
  const snap = snapshot({ players: [player("a", "RB", 10), player("x", "RB", 10)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1 });
  const external = externalInputs(snap, [6, 7], (p) => p.id === "x" ? 12 : 10);
  const result = analyze(snap, proposal(["a"], ["x"]), { ...external, futureWeeks: [6, 7] });
  assert.equal(result.future.horizonDelta, 4);
  assert.equal(result.future.meanWeeklyDelta, 2);
  assert.equal(result.future.direction, "UPGRADE");
});

test("large raw future aggregate stays TOSSUP when mean weekly delta is below one", () => {
  const snap = snapshot({ players: [player("a", "RB", 10), player("x", "RB", 10)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1 });
  const weeks = [6, 7, 8, 9, 10, 11, 12, 13];
  const external = externalInputs(snap, weeks, (p) => p.id === "x" ? 10.8 : 10);
  const result = analyze(snap, proposal(["a"], ["x"]), { ...external, futureWeeks: weeks });
  assert.equal(result.future.horizonDelta, 6.4);
  assert.equal(result.future.meanWeeklyDelta, 0.8);
  assert.equal(result.future.direction, "TOSSUP");
});

test("incomplete future coverage withholds aggregate, mean, and direction", () => {
  const snap = snapshot({ players: [player("a", "RB", 10), player("x", "RB", 10)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1 });
  const external = externalInputs(snap, [6, 7], (p) => p.id === "x" ? 12 : 10, { omit: { playerId: "x", week: 7 } });
  const result = analyze(snap, proposal(["a"], ["x"]), { ...external, futureWeeks: [6, 7] });
  assert.equal(result.future.horizonDelta, null);
  assert.equal(result.future.meanWeeklyDelta, null);
  assert.equal(result.future.direction, "UNKNOWN");
  assert.doesNotMatch(result.future.label, /REST_OF_SEASON/);
});

test("complete and incomplete playoff windows use the same mean-weekly coverage rule", () => {
  const snap = snapshot({ players: [player("a", "RB", 10), player("x", "RB", 10)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1, playoffWeeks: [15, 16] });
  const completeInputs = externalInputs(snap, [15, 16], (p) => p.id === "x" ? 13 : 10);
  const complete = analyze(snap, proposal(["a"], ["x"]), { ...completeInputs, futureWeeks: [], playoffWeeks: [15, 16] });
  assert.equal(complete.playoffs.horizonDelta, 6);
  assert.equal(complete.playoffs.meanWeeklyDelta, 3);
  assert.equal(complete.playoffs.direction, "UPGRADE");

  const incompleteInputs = externalInputs(snap, [15, 16], (p) => p.id === "x" ? 13 : 10, { omit: { playerId: "x", week: 16 } });
  const incomplete = analyze(snap, proposal(["a"], ["x"]), { ...incompleteInputs, futureWeeks: [], playoffWeeks: [15, 16] });
  assert.equal(incomplete.playoffs.horizonDelta, null);
  assert.equal(incomplete.playoffs.direction, "UNKNOWN");
});

test("known bye relief is a first-class structural effect even with flat current lineup", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20, { byeWeek: 8 }), player("c", "RB", 5, { byeWeek: 8 }), player("x", "RB", 5, { byeWeek: 9 })],
    mine: [entry("a", "RB"), entry("c", "BE")], other: [entry("x", "RB")], size: 2
  });
  const result = analyze(snap, proposal(["c"], ["x"]));
  assert.equal(result.currentWeek.direction, "TOSSUP");
  assert.deepEqual(result.bye.improvedWeeks, [8]);
  assert.equal(result.conclusion, "BALANCED_OBJECTIVE_DEPENDENT");
});

test("ordinary depth loss is not automatically dangerous, while a supported bye gap with no replacement path is dangerous", () => {
  const ordinary = snapshot({
    players: [player("a", "RB", 10), player("c", "RB", 9), player("x", "RB", 15), player("fa", "RB", 8)],
    mine: [entry("a", "RB"), entry("c", "BE")], other: [entry("x", "RB")], size: 2, availablePlayers: ["fa"]
  });
  const ordinaryResult = analyze(ordinary, proposal(["a", "c"], ["x"]));
  assert.notEqual(ordinaryResult.depth.fragility.state, "DANGEROUS");

  const dangerous = snapshot({
    players: [player("a", "RB", 20, { byeWeek: 8 }), player("c", "RB", 5, { byeWeek: 9 }), player("x", "WR", 5, { byeWeek: 10 })],
    mine: [entry("a", "RB"), entry("c", "BE")], other: [entry("x", "WR")], size: 2, availablePlayers: []
  });
  const dangerousResult = analyze(dangerous, proposal(["c"], ["x"]));
  assert.equal(dangerousResult.depth.fragility.state, "DANGEROUS");
  assert.equal(dangerousResult.conclusion, "DANGEROUS_POSITIONAL_FRAGILITY");
});

test("missing ESPN availability stays unknown rather than being described as an empty pool", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20, { byeWeek: 8 }), player("c", "RB", 5, { byeWeek: 9 }), player("x", "WR", 5, { byeWeek: 10 })],
    mine: [entry("a", "RB"), entry("c", "BE")], other: [entry("x", "WR")], size: 2, includeAvailability: false
  });
  const result = analyze(snap, proposal(["c"], ["x"]));
  assert.equal(result.replacement.status, "UNKNOWN");
  assert.match(result.replacement.reason, /unknown, not weak or empty/);
  assert.notEqual(result.depth.fragility.state, "DANGEROUS");
});

test("team objective changes framing only and does not mutate analysis facts", () => {
  const snap = snapshot({ players: [player("a", "RB", 10), player("x", "RB", 14)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1 });
  const balanced = analyze(snap, proposal(["a"], ["x"], { teamObjective: "BALANCED" }));
  const future = analyze(snap, proposal(["a"], ["x"], { teamObjective: "FUTURE_UPSIDE" }));
  assert.equal(balanced.currentWeek.sources[0].delta, future.currentWeek.sources[0].delta);
  assert.equal(balanced.currentWeek.direction, future.currentWeek.direction);
  assert.equal(balanced.conclusion, future.conclusion);
  assert.notEqual(balanced.reasons[0], future.reasons[0]);
});

test("cross-horizon conflicts outrank generic upgrade labels in both directions", () => {
  const shortCost = snapshot({ players: [player("a", "RB", 15), player("x", "RB", 10)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1 });
  const futureGain = externalInputs(shortCost, [6, 7], (p) => p.id === "x" ? 13 : 10);
  const longGain = analyze(shortCost, proposal(["a"], ["x"]), { ...futureGain, futureWeeks: [6, 7] });
  assert.equal(longGain.currentWeek.direction, "DOWNGRADE");
  assert.equal(longGain.future.direction, "UPGRADE");
  assert.equal(longGain.conclusion, "LONG_TERM_GAIN_SHORT_TERM_COST");

  const shortGain = snapshot({ players: [player("a", "RB", 10), player("x", "RB", 15)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1 });
  const futureCost = externalInputs(shortGain, [6, 7], (p) => p.id === "x" ? 10 : 13);
  const longCost = analyze(shortGain, proposal(["a"], ["x"]), { ...futureCost, futureWeeks: [6, 7] });
  assert.equal(longCost.currentWeek.direction, "UPGRADE");
  assert.equal(longCost.future.direction, "DOWNGRADE");
  assert.equal(longCost.conclusion, "SHORT_TERM_GAIN_LONG_TERM_COST");
  assert.notEqual(longCost.conclusion, "CLEAR_TEAM_UPGRADE");
  assert.notEqual(longCost.conclusion, "STARTER_UPGRADE_DEPTH_COST");
});

test("Trade Analyzer contains no hidden score or ESPN mutation behavior", () => {
  const snap = snapshot({ players: [player("a", "RB", 10), player("x", "RB", 14)], mine: [entry("a", "RB")], other: [entry("x", "RB")], size: 1 });
  const result = analyze(snap, proposal(["a"], ["x"]));
  assert.equal(Object.hasOwn(result, "tradeScore"), false);
  assert.equal(Object.hasOwn(result, "winnerPercentage"), false);
  assert.equal(Object.hasOwn(result, "acceptanceProbability"), false);
  assert.equal(result.readOnly, true);
  assert.deepEqual(result.transactionActions, []);
});
