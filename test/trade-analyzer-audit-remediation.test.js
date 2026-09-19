import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

function snapshot({
  players,
  mine,
  other = [],
  size = mine.filter((item) => item.lineupSlot !== "IR").length,
  positionLimits = [],
  lineupSlots = null,
  availablePlayers = [],
  playoffWeeks = [],
  waiver = { acquisitionLimit: -1, matchupAcquisitionLimit: -1 },
  acquisitions = { seasonAcquisitions: 0, matchupAcquisitions: 0 }
} = {}) {
  return {
    schemaVersion: 1,
    provider: "espn",
    currentWeek: 5,
    meta: { kind: "live-companion", capturedAt: "2026-09-10T11:55:00Z", projectionsSource: "ESPN" },
    league: {
      id: "league",
      name: "TCW-025 Audit Fixture",
      season: 2026,
      scoringType: "PPR",
      receptionScoring: { family: "ppr", pointsPerReception: 1 },
      lineupSlots: lineupSlots || [{ slot: "RB", count: 1 }, { slot: "BE", count: Math.max(0, mine.filter((item) => item.lineupSlot === "BE").length) }],
      rosterRules: { size, positionLimits },
      playoffWeeks,
      waiver
    },
    teams: [
      { id: "mine", name: "Mine", abbreviation: "ME", acquisition: acquisitions },
      { id: "other", name: "Other", abbreviation: "OTH", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } }
    ],
    players,
    rosters: [{ teamId: "mine", entries: mine }, { teamId: "other", entries: other }],
    matchups: [],
    availablePlayers
  };
}

function proposal(outgoingPlayerIds, incomingPlayerIds) {
  return { partnerTeamId: "other", outgoingPlayerIds, incomingPlayerIds, plannedFollowUpDropIds: [], teamObjective: "BALANCED" };
}

function analyze(snap, trade, options = {}) {
  return analyzeTrade(snap, "mine", trade, { now: NOW, ...options });
}

function externalInputs(snap, weeks, pointsFor) {
  const capturedAt = "2026-09-10T11:50:00Z";
  const projections = [];
  const identityMap = new Map();
  for (const p of snap.players) {
    const providerPlayerId = `ext-${p.id}`;
    identityMap.set(providerPlayerId, p.id);
    for (const week of weeks) projections.push({ providerPlayerId, week, points: pointsFor(p, week), capturedAt });
  }
  return {
    futureProjectionSet: { provider: "External fixture", scoringFormat: "PPR", season: 2026, capturedAt, projections },
    identityMap
  };
}

function rbByeGap({ availablePlayers = ["fa"], extras = [], waiver, acquisitions, positionLimits = [] } = {}) {
  return snapshot({
    players: [
      player("a", "RB", 20, { byeWeek: 8 }),
      player("c", "RB", 5, { byeWeek: 9 }),
      player("x", "WR", 5, { byeWeek: 10 }),
      player("fa", "RB", 8, { byeWeek: 11 }),
      ...extras
    ],
    mine: [entry("a", "RB"), entry("c", "BE")],
    other: [entry("x", "WR")],
    size: 2,
    positionLimits,
    availablePlayers,
    waiver,
    acquisitions
  });
}

test("TCW-024-F01 eligible RB replacement prevents false DANGEROUS fragility", () => {
  const result = analyze(rbByeGap(), proposal(["c"], ["x"]));
  assert.notEqual(result.depth.fragility.state, "DANGEROUS");
  assert.notEqual(result.conclusion, "DANGEROUS_POSITIONAL_FRAGILITY");
});

test("TCW-024-F01 FLEX-compatible replacement path uses the supported slot-label contract", () => {
  const snap = snapshot({
    players: [
      player("a", "WR", 20, { byeWeek: 8 }),
      player("c", "TE", 5, { byeWeek: 9 }),
      player("x", "QB", 5, { byeWeek: 10 }),
      player("fa", "RB", 8, { byeWeek: 11 })
    ],
    mine: [entry("a", "FLEX"), entry("c", "BE")],
    other: [entry("x", "QB")],
    size: 2,
    lineupSlots: [{ slot: "FLEX", count: 1 }, { slot: "BE", count: 1 }],
    availablePlayers: ["fa"]
  });
  const result = analyze(snap, proposal(["c"], ["x"]));
  assert.notEqual(result.depth.fragility.state, "DANGEROUS");
});

test("TCW-024-F01 OP-compatible replacement path uses existing supported eligibility", () => {
  const snap = snapshot({
    players: [
      player("a", "QB", 20, { byeWeek: 8 }),
      player("c", "RB", 5, { byeWeek: 9 }),
      player("x", "K", 5, { byeWeek: 10 }),
      player("fa", "WR", 8, { byeWeek: 11 })
    ],
    mine: [entry("a", "OP"), entry("c", "BE")],
    other: [entry("x", "K")],
    size: 2,
    lineupSlots: [{ slot: "OP", count: 1 }, { slot: "BE", count: 1 }],
    availablePlayers: ["fa"]
  });
  const result = analyze(snap, proposal(["c"], ["x"]));
  assert.notEqual(result.depth.fragility.state, "DANGEROUS");
});

test("TCW-024-F01 structural replacement evaluation sees an eligible player outside the top-12 presentation list", () => {
  const distractors = Array.from({ length: 12 }, (_, index) => player(`w${index + 1}`, "WR", 30 - index, { byeWeek: 12 }));
  const availablePlayers = [...distractors.map((item) => item.id), "fa"];
  const result = analyze(rbByeGap({ availablePlayers, extras: distractors }), proposal(["c"], ["x"]));
  assert.equal(result.replacement.candidates.length, 12);
  assert.equal(result.replacement.candidates.some((item) => item.playerId === "fa"), false);
  assert.notEqual(result.depth.fragility.state, "DANGEROUS");
});

test("TCW-024-F01 truly empty or ineligible latest ESPN replacement pool preserves DANGEROUS", () => {
  const noEligible = rbByeGap({ availablePlayers: [] });
  const result = analyze(noEligible, proposal(["c"], ["x"]));
  assert.equal(result.depth.fragility.state, "DANGEROUS");
  assert.equal(result.conclusion, "DANGEROUS_POSITIONAL_FRAGILITY");
});

test("TCW-024-F01 exhausted acquisition capacity preserves DANGEROUS despite an eligible player", () => {
  const snap = rbByeGap({
    availablePlayers: ["fa"],
    waiver: { acquisitionLimit: 1, matchupAcquisitionLimit: -1 },
    acquisitions: { seasonAcquisitions: 1, matchupAcquisitions: 0 }
  });
  const result = analyze(snap, proposal(["c"], ["x"]));
  assert.equal(result.depth.fragility.state, "DANGEROUS");
  assert.match(result.depth.fragility.reason, /acquisition limit is exhausted/i);
});

test("TCW-024-F01 known finite roster-position constraint can block an otherwise slot-eligible replacement path", () => {
  const snap = snapshot({
    players: [
      player("a", "WR", 20, { byeWeek: 8 }),
      player("c", "TE", 5, { byeWeek: 9 }),
      player("x", "QB", 5, { byeWeek: 10 }),
      player("fa", "RB", 8, { byeWeek: 11 })
    ],
    mine: [entry("a", "FLEX"), entry("c", "BE")],
    other: [entry("x", "QB")],
    size: 2,
    positionLimits: [{ position: "RB", limit: 0 }],
    lineupSlots: [{ slot: "FLEX", count: 1 }, { slot: "BE", count: 1 }],
    availablePlayers: ["fa"]
  });
  const result = analyze(snap, proposal(["c"], ["x"]));
  assert.equal(result.depth.fragility.state, "DANGEROUS");
  assert.match(result.depth.fragility.reason, /roster constraint/i);
});

test("TCW-024-F02 current explicit lock semantics remain unchanged", () => {
  const snap = snapshot({
    players: [player("a", "RB", 10), player("x", "RB", 14)],
    mine: [entry("a", "RB", { locked: true })],
    other: [entry("x", "RB")],
    size: 1
  });
  const result = analyze(snap, proposal(["a"], ["x"]));
  assert.equal(result.currentWeek.actionability, "INFORMATIONAL_ONLY");
  assert.match(result.currentWeek.locks[0].reason, /ESPN reported this player locked/);
});

function futureLockFixture({ entryLocked = false, playerLocked = false, kickoff = "2026-12-01T18:00:00Z", playoffWeeks = [] } = {}) {
  return snapshot({
    players: [
      player("a", "RB", 10),
      player("b", "RB", 20, { locked: playerLocked, gameTime: kickoff }),
      player("c", "WR", 5),
      player("x", "RB", 15)
    ],
    mine: [entry("a", "RB"), entry("b", "BE", entryLocked ? { locked: true } : {}), entry("c", "BE")],
    other: [entry("x", "RB")],
    size: 3,
    lineupSlots: [{ slot: "RB", count: 1 }, { slot: "BE", count: 2 }],
    playoffWeeks
  });
}

test("TCW-024-F02 entry-level current lock does not constrain a future week", () => {
  const snap = futureLockFixture({ entryLocked: true });
  const external = externalInputs(snap, [6], (p) => ({ a: 10, b: 20, c: 5, x: 15 })[p.id]);
  const result = analyze(snap, proposal(["c"], ["x"]), { ...external, futureWeeks: [6] });
  assert.equal(result.future.delta, undefined);
  assert.equal(result.future.rows[0].delta, 0);
  assert.equal(result.future.rows[0].preAssignments[0].player.id, "b");
  assert.equal(result.future.rows[0].postAssignments[0].player.id, "b");
});

test("TCW-024-F02 player-level current lock does not constrain a future week", () => {
  const snap = futureLockFixture({ playerLocked: true });
  const external = externalInputs(snap, [6], (p) => ({ a: 10, b: 20, c: 5, x: 15 })[p.id]);
  const result = analyze(snap, proposal(["c"], ["x"]), { ...external, futureWeeks: [6] });
  assert.equal(result.future.rows[0].delta, 0);
  assert.equal(result.future.rows[0].preAssignments[0].player.id, "b");
  assert.equal(result.future.rows[0].postAssignments[0].player.id, "b");
});

test("TCW-024-F02 current kickoff-derived lock does not constrain future optimization", () => {
  const snap = futureLockFixture({ kickoff: "2026-09-10T11:00:00Z" });
  const external = externalInputs(snap, [6], (p) => ({ a: 10, b: 20, c: 5, x: 15 })[p.id]);
  const result = analyze(snap, proposal(["c"], ["x"]), { ...external, futureWeeks: [6] });
  assert.equal(result.future.rows[0].delta, 0);
  assert.equal(result.future.rows[0].preAssignments[0].player.id, "b");
  assert.equal(result.future.rows[0].postAssignments[0].player.id, "b");
});

test("TCW-024-F02 playoff totals and assignments match the unlocked hypothetical future state", () => {
  const snap = futureLockFixture({ playerLocked: true, playoffWeeks: [15, 16] });
  const external = externalInputs(snap, [15, 16], (p) => ({ a: 10, b: 20, c: 5, x: 15 })[p.id]);
  const result = analyze(snap, proposal(["c"], ["x"]), { ...external, futureWeeks: [], playoffWeeks: [15, 16] });
  assert.equal(result.playoffs.horizonDelta, 0);
  assert.equal(result.playoffs.meanWeeklyDelta, 0);
  assert.equal(result.playoffs.direction, "TOSSUP");
  for (const row of result.playoffs.rows) {
    assert.equal(row.preAssignments[0].player.id, "b");
    assert.equal(row.postAssignments[0].player.id, "b");
  }
});

test("TCW-024-F02 current locks cannot fabricate SHORT_TERM_GAIN_LONG_TERM_COST", () => {
  const snap = snapshot({
    players: [player("a", "RB", 10), player("b", "RB", 20), player("x", "RB", 15)],
    mine: [entry("a", "RB"), entry("b", "BE", { locked: true })],
    other: [entry("x", "RB")],
    size: 2,
    lineupSlots: [{ slot: "RB", count: 1 }, { slot: "BE", count: 1 }]
  });
  const external = externalInputs(snap, [6], (p) => ({ a: 15, b: 30, x: 10 })[p.id]);
  const result = analyze(snap, proposal(["a"], ["x"]), { ...external, futureWeeks: [6] });
  assert.equal(result.currentWeek.direction, "UPGRADE");
  assert.equal(result.future.direction, "TOSSUP");
  assert.notEqual(result.conclusion, "SHORT_TERM_GAIN_LONG_TERM_COST");
});

test("TCW-024-F02 current locks cannot fabricate LONG_TERM_GAIN_SHORT_TERM_COST", () => {
  const snap = snapshot({
    players: [player("a", "RB", 15), player("b", "RB", 20), player("x", "RB", 10)],
    mine: [entry("a", "RB"), entry("b", "BE", { locked: true })],
    other: [entry("x", "RB")],
    size: 2,
    lineupSlots: [{ slot: "RB", count: 1 }, { slot: "BE", count: 1 }]
  });
  const external = externalInputs(snap, [6], (p) => ({ a: 10, b: 30, x: 15 })[p.id]);
  const result = analyze(snap, proposal(["a"], ["x"]), { ...external, futureWeeks: [6] });
  assert.equal(result.currentWeek.direction, "DOWNGRADE");
  assert.equal(result.future.direction, "TOSSUP");
  assert.notEqual(result.conclusion, "LONG_TERM_GAIN_SHORT_TERM_COST");
});

test("TCW-024-F03 unverified contingency remains UNKNOWN and is exposed as a limitation", () => {
  const snap = snapshot({
    players: [player("a", "RB", 20), player("c", "RB", null), player("x", "RB", 10)],
    mine: [entry("a", "RB"), entry("c", "BE")],
    other: [entry("x", "RB")],
    size: 2
  });
  const result = analyze(snap, proposal(["a"], ["x"]));
  assert.equal(result.depth.contingency.post.status, "UNKNOWN");
  assert.equal(result.depth.fragility.state, "UNKNOWN");
  assert.match(result.depth.fragility.reason, /could not be fully verified/i);
  assert.match(result.limitations.join(" "), /contingency.*could not be fully verified/i);
});

test("TCW-024-F03 verified COVERED, THIN, SCARCE_THIN, and DANGEROUS states remain distinct", () => {
  const covered = snapshot({
    players: [player("a", "RB", 20), player("b", "RB", 10), player("c", "WR", 5), player("x", "WR", 6)],
    mine: [entry("a", "RB"), entry("b", "BE"), entry("c", "BE")],
    other: [entry("x", "WR")],
    size: 3,
    availablePlayers: ["b"]
  });
  assert.equal(analyze(covered, proposal(["c"], ["x"])).depth.fragility.state, "COVERED");

  const thin = snapshot({
    players: [player("a", "RB", 20), player("c", "WR", 5), player("x", "WR", 6)],
    mine: [entry("a", "RB"), entry("c", "BE")],
    other: [entry("x", "WR")],
    size: 2,
    availablePlayers: []
  });
  assert.equal(analyze(thin, proposal(["c"], ["x"])).depth.fragility.state, "THIN");

  const scarce = snapshot({
    players: [player("a", "RB", 10), player("c", "RB", 9), player("x", "RB", 15), player("fa", "RB", 8)],
    mine: [entry("a", "RB"), entry("c", "BE")],
    other: [entry("x", "RB")],
    size: 2,
    availablePlayers: ["fa"]
  });
  assert.equal(analyze(scarce, proposal(["a", "c"], ["x"])).depth.fragility.state, "SCARCE_THIN");

  const dangerous = analyze(rbByeGap({ availablePlayers: [] }), proposal(["c"], ["x"]));
  assert.equal(dangerous.depth.fragility.state, "DANGEROUS");
});

test("TCW-024-F04 dedicated accessibility and mobile loops include Trade Analyzer", async () => {
  const accessibility = await readFile(new URL("../scripts/audit-accessibility.js", import.meta.url), "utf8");
  const mobile = await readFile(new URL("../scripts/audit-mobile.js", import.meta.url), "utf8");
  assert.match(accessibility, /"overview", "lineup", "trade", "waivers"/);
  assert.match(mobile, /trade: "Trade Analyzer"/);
  assert.match(mobile, /"overview", "lineup", "trade", "waivers"/);
});
