import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTrade } from "../src/domain/trade-analyzer.js";
import { createSyntheticApprovedTradeValueSource } from "../src/domain/trade-value-source.js";

const NOW = Date.parse("2026-09-19T12:30:00Z");
const entry = (playerId, lineupSlot = "BE", extra = {}) => ({ playerId, lineupSlot, ...extra });
const player = (id, position, projection, extra = {}) => ({
  id, name: id.toUpperCase(), position, proTeam: "NFL", opponent: "OPP", projection,
  gameTime: "2026-12-01T18:00:00Z", byeWeek: 14, injury: { status: "ACTIVE" }, ...extra
});

function snap({ players, mine, other, size = mine.filter((item) => item.lineupSlot !== "IR").length,
  lineupSlots = [{ slot: "RB", count: 1 }, { slot: "BE", count: Math.max(0, mine.filter((item) => item.lineupSlot === "BE").length) }],
  availablePlayers, playoffWeeks = [], restOfSeasonWeeks, waiver = { acquisitionLimit: -1, matchupAcquisitionLimit: -1 },
  mineAcquisition = { seasonAcquisitions: 0, matchupAcquisitions: 0 } }) {
  const value = {
    schemaVersion: 1, provider: "espn", currentWeek: 5,
    meta: { kind: "live-companion", capturedAt: "2026-09-19T12:20:00Z", projectionsSource: "ESPN" },
    league: { id: "league", name: "TCW-034 Fixture", season: 2026, scoringType: "PPR",
      receptionScoring: { family: "ppr", pointsPerReception: 1 }, lineupSlots,
      rosterRules: { size, positionLimits: [] }, playoffWeeks,
      ...(Array.isArray(restOfSeasonWeeks) ? { restOfSeasonWeeks } : {}),
      waiver },
    teams: [
      { id: "mine", name: "Mine", abbreviation: "ME", acquisition: mineAcquisition },
      { id: "other", name: "Other", abbreviation: "OTH", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } }
    ],
    players, rosters: [{ teamId: "mine", entries: mine }, { teamId: "other", entries: other }], matchups: []
  };
  if (availablePlayers !== undefined) value.availablePlayers = availablePlayers;
  return value;
}

function proposal(outgoingPlayerIds, incomingPlayerIds, extra = {}) {
  return { partnerTeamId: "other", outgoingPlayerIds, incomingPlayerIds, plannedFollowUpDropIds: [], teamObjective: "BALANCED", ...extra };
}

function valueSource(values, overrides = {}) {
  return createSyntheticApprovedTradeValueSource({
    sourceId: "synthetic-primary", asOf: "2026-09-19T12:00:00Z", teamCount: 2, values, ...overrides
  });
}

function analyze(snapshot, trade, options = {}) {
  return analyzeTrade(snapshot, "mine", trade, { now: NOW, ...options });
}

function external(snapshot, weeks, points) {
  const projections = [];
  const identityMap = new Map();
  for (const p of snapshot.players) {
    const providerPlayerId = "ext-" + p.id;
    identityMap.set(providerPlayerId, p.id);
    for (const week of weeks) {
      if (points[p.id]?.[week] == null) continue;
      projections.push({ providerPlayerId, week, points: points[p.id][week], capturedAt: "2026-09-19T12:00:00Z" });
    }
  }
  return {
    futureProjectionSet: { provider: "Synthetic future fixture", scoringFormat: "PPR", season: 2026, capturedAt: "2026-09-19T12:00:00Z", projections },
    identityMap
  };
}

test("TCW-034 production with no approved value source withholds winner/split while roster consequence still works", () => {
  const snapshot = snap({ players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")] });
  const result = analyze(snapshot, proposal(["a"], ["x"]));
  assert.equal(result.packageValue.status, "WITHHELD");
  assert.equal(result.packageValue.winner, "WITHHELD");
  assert.equal(result.packageValue.displayedSplit, null);
  assert.match(result.packageValue.reasons.join(" "), /NO_APPROVED_COMPARABLE_VALUE_SOURCE/);
  assert.equal(result.doNothing.userDecision, "IMPROVES");
  assert.equal(result.currentWeek.direction, "UPGRADE");
});

test("TCW-034 fair package can still worsen the user's roster", () => {
  const snapshot = snap({ players: [player("a","RB",20), player("b","RB",8), player("x","RB",17)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")] });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { tradeValueSources: [valueSource({ a:50, x:50 })] });
  assert.equal(result.packageValue.winner, "FAIR_TRADE");
  assert.equal(result.currentWeek.direction, "DOWNGRADE");
  assert.equal(result.doNothing.userDecision, "WORSENS");
  assert.equal(result.doNothing.recommendation, "DO_NOT_PROCEED");
});

test("TCW-034 synthetic value win cannot override a supported dangerous roster gap", () => {
  const snapshot = snap({ players: [player("a","RB",20,{byeWeek:8}), player("c","RB",5,{byeWeek:9}), player("x","WR",25,{byeWeek:10})],
    mine: [entry("a","RB"), entry("c","BE")], other: [entry("x","WR")], availablePlayers: [] });
  const result = analyze(snapshot, proposal(["c"], ["x"]), { tradeValueSources: [valueSource({ c:40, x:60 })] });
  assert.equal(result.packageValue.winner, "YOU_WIN");
  assert.equal(result.depth.fragility.state, "DANGEROUS");
  assert.equal(result.doNothing.severeGap, true);
  assert.equal(result.doNothing.userDecision, "WORSENS");
  assert.equal(result.doNothing.recommendation, "DO_NOT_PROCEED");
});

test("TCW-034 2-for-1 exposes open roster space without imaginary waiver points", () => {
  const snapshot = snap({ players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")], availablePlayers: [] });
  const result = analyze(snapshot, proposal(["a","b"], ["x"]), { tradeValueSources: [valueSource({ a:25, b:20, x:60 })] });
  assert.equal(result.packageValue.winner, "YOU_WIN");
  assert.equal(result.roster.openRosterSpots, 1);
  assert.equal(result.rosterSpace.conditionalFollowUpAddsExcluded, true);
  assert.equal(result.currentWeek.direction, "UPGRADE");
  assert.equal(result.doNothing.userDecision, "MIXED");
});

test("TCW-034 1-for-2 keeps explicit-drop gate and resolves only with a user-selected drop", () => {
  const snapshot = snap({ players: [player("a","RB",10), player("b","RB",8), player("x","RB",14), player("y","RB",12)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB"), entry("y","BE")], size: 2 });
  const sources = [valueSource({ b:20, x:25, y:20 })];
  const pending = analyze(snapshot, proposal(["b"], ["x","y"]), { tradeValueSources: sources });
  assert.equal(pending.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(pending.doNothing.userDecision, "WITHHELD");
  assert.equal(pending.roster.requiredFollowUpRemovals, 1);
  const resolved = analyze(snapshot, proposal(["b"], ["x","y"], { plannedFollowUpDropIds:["y"] }), { tradeValueSources:sources });
  assert.notEqual(resolved.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.deepEqual(resolved.proposal.plannedFollowUpDrops.map((item) => item.id), ["y"]);
});

test("TCW-034 high abstract value bench-only incoming does not fabricate starter gain", () => {
  const snapshot = snap({ players: [player("a","RB",20), player("b","RB",8), player("x","RB",7)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")] });
  const result = analyze(snapshot, proposal(["b"], ["x"]), { tradeValueSources:[valueSource({ b:30, x:70 })] });
  assert.equal(result.packageValue.winner, "YOU_WIN");
  assert.equal(result.currentWeek.direction, "TOSSUP");
  assert.deepEqual(result.currentWeek.sources[0].assignments.incomingStarters, []);
  assert.deepEqual(result.currentWeek.sources[0].assignments.incomingBenchDepth, ["x"]);
  assert.equal(result.doNothing.userDecision, "NO_MATERIAL_CHANGE");
});

test("TCW-034 lower abstract incoming value can still improve roster fit", () => {
  const snapshot = snap({ players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")] });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { tradeValueSources:[valueSource({ a:56, x:44 })] });
  assert.equal(result.packageValue.winner, "THEY_WIN");
  assert.equal(result.doNothing.userDecision, "IMPROVES");
  assert.equal(result.currentWeek.direction, "UPGRADE");
});

test("TCW-034 current and complete future conflict remain separate and produce MIXED roster consequence", () => {
  const snapshot = snap({ players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")] });
  const fx = external(snapshot, [6,7], { a:{6:15,7:15}, b:{6:8,7:8}, x:{6:10,7:10} });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { ...fx, futureWeeks:[6,7] });
  assert.equal(result.currentWeek.direction, "UPGRADE");
  assert.equal(result.future.direction, "DOWNGRADE");
  assert.equal(result.horizons.crossHorizonConflict, "SHORT_TERM_GAIN_LONG_TERM_COST");
  assert.equal(result.doNothing.userDecision, "MIXED");
  assert.equal(result.packageValue.status, "WITHHELD");
});

test("TCW-034 incomplete playoff evidence stays UNKNOWN and is never relabeled complete", () => {
  const snapshot = snap({ players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")], playoffWeeks:[15,16] });
  const fx = external(snapshot, [15], { a:{15:10}, b:{15:8}, x:{15:14} });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { ...fx, playoffWeeks:[15,16] });
  assert.equal(result.playoffs.status, "UNKNOWN");
  assert.equal(result.playoffs.horizonDelta, null);
  assert.equal(result.playoffs.meanWeeklyDelta, null);
  assert.equal(result.playoffs.direction, "UNKNOWN");
  assert.equal(result.restOfSeason.status, "UNKNOWN");
});

test("TCW-034 F01 raw listed-position changes stay descriptive when lineup, contingency and bye coverage are unchanged", () => {
  const snapshot = snap({
    players: [
      player("a","RB",20,{byeWeek:8}),
      player("b","RB",8,{byeWeek:9}),
      player("c","RB",7,{byeWeek:10}),
      player("x","WR",6,{byeWeek:10})
    ],
    mine: [entry("a","RB"), entry("b","BE"), entry("c","BE")],
    other: [entry("x","BE")],
    size: 3,
    lineupSlots: [{slot:"RB",count:1},{slot:"BE",count:2}]
  });
  const result = analyze(snapshot, proposal(["c"], ["x"]));
  const byPosition = Object.fromEntries(result.depth.listedPositionChanges.map((row) => [row.position, row.delta]));

  assert.equal(result.currentWeek.direction, "TOSSUP");
  assert.equal(result.depth.contingency.pre.maxUncoveredAfterLoss, 0);
  assert.equal(result.depth.contingency.post.maxUncoveredAfterLoss, 0);
  assert.equal(result.depth.listedPositionChangesAreDescriptive, true);
  assert.equal(byPosition.RB, -1);
  assert.equal(byPosition.WR, 1);
  assert.equal(result.depth.depthCost, false);
  assert.equal(result.depth.depthGain, false);
  assert.equal(result.doNothing.userDecision, "NO_MATERIAL_CHANGE");
  assert.deepEqual(result.doNothing.materialBenefits, []);
  assert.deepEqual(result.doNothing.materialCosts, []);
});

test("TCW-034 F01 UNKNOWN contingency plus listed-position loss cannot become WORSENS", () => {
  const snapshot = snap({
    players: [player("a","RB",20), player("c","RB",7), player("x","WR",6)],
    mine: [entry("a","RB"), entry("c","BE")],
    other: [entry("x","BE")],
    size: 2,
    lineupSlots: [{slot:"UNSUPPORTED_CUSTOM",count:1},{slot:"BE",count:1}]
  });
  const result = analyze(snapshot, proposal(["c"], ["x"]));

  assert.equal(result.depth.contingency.pre.status, "UNKNOWN");
  assert.equal(result.depth.contingency.post.status, "UNKNOWN");
  assert.equal(result.depth.listedPositionChanges.find((row) => row.position === "RB")?.delta, -1);
  assert.equal(result.depth.depthCost, false);
  assert.notEqual(result.doNothing.userDecision, "WORSENS");
  assert.equal(result.doNothing.userDecision, "WITHHELD");
  assert.match(result.doNothing.reasons.join(" "), /descriptive/i);
});

test("TCW-034 F01 genuine legal contingency loss and gain remain material", () => {
  const lossSnapshot = snap({
    players: [player("a","RB",20), player("c","RB",7), player("x","WR",6)],
    mine: [entry("a","RB"), entry("c","BE")],
    other: [entry("x","BE")],
    size: 2
  });
  const loss = analyze(lossSnapshot, proposal(["c"], ["x"]));
  assert.equal(loss.depth.contingency.pre.maxUncoveredAfterLoss, 0);
  assert.equal(loss.depth.contingency.post.maxUncoveredAfterLoss, 1);
  assert.equal(loss.depth.depthCost, true);
  assert.equal(loss.doNothing.userDecision, "WORSENS");
  assert.ok(loss.doNothing.materialCosts.includes("DEPTH_OR_CONTINGENCY_COST"));

  const gainSnapshot = snap({
    players: [player("a","RB",20), player("w","WR",6), player("x","RB",7)],
    mine: [entry("a","RB"), entry("w","BE")],
    other: [entry("x","BE")],
    size: 2
  });
  const gain = analyze(gainSnapshot, proposal(["w"], ["x"]));
  assert.equal(gain.depth.contingency.pre.maxUncoveredAfterLoss, 1);
  assert.equal(gain.depth.contingency.post.maxUncoveredAfterLoss, 0);
  assert.equal(gain.depth.depthGain, true);
  assert.equal(gain.doNothing.userDecision, "IMPROVES");
  assert.ok(gain.doNothing.materialBenefits.includes("DEPTH_OR_CONTINGENCY_GAIN"));
});

test("TCW-034 F02 replacement numeric uses explicit eligible RB demand instead of all-pool maximum", () => {
  const snapshot = snap({
    players: [
      player("a","RB",20), player("c","RB",7), player("x","WR",6),
      player("faQ","QB",30), player("faR","RB",9)
    ],
    mine: [entry("a","RB"), entry("c","BE")],
    other: [entry("x","BE")],
    availablePlayers: ["faQ","faR"],
    size: 3
  });
  const result = analyze(snapshot, proposal(["c"], ["x"]));

  assert.deepEqual(result.replacementScarcity.eligibleSlots, ["RB"]);
  assert.equal(result.replacementScarcity.positionalAndFLEXOPDemand[0].slot, "RB");
  assert.deepEqual(result.replacementScarcity.positionalAndFLEXOPDemand[0].eligibleCandidateIds, ["faR"]);
  assert.equal(result.replacementScarcity.replacementProjectionOrNull, 9);
});

test("TCW-034 F02 replacement numeric withholds when no slot-eligible candidate exists", () => {
  const snapshot = snap({
    players: [player("a","RB",20), player("c","RB",7), player("x","WR",6), player("faQ","QB",30)],
    mine: [entry("a","RB"), entry("c","BE")],
    other: [entry("x","BE")],
    availablePlayers: ["faQ"],
    size: 2
  });
  const result = analyze(snapshot, proposal(["c"], ["x"]));
  assert.deepEqual(result.replacementScarcity.eligibleSlots, []);
  assert.equal(result.replacementScarcity.replacementProjectionOrNull, null);
  assert.match(result.replacementScarcity.reason, /no candidate eligible/i);
});

test("TCW-034 F02 replacement demand honors ordinary FLEX and OP slot eligibility", () => {
  const flexSnapshot = snap({
    players: [
      player("w","WR",20), player("b","RB",7), player("q","QB",6),
      player("faQ","QB",30), player("faR","RB",9)
    ],
    mine: [entry("w","FLEX"), entry("b","BE")],
    other: [entry("q","BE")],
    availablePlayers: ["faQ","faR"],
    size: 3,
    lineupSlots: [{slot:"FLEX",count:1},{slot:"BE",count:1}]
  });
  const flex = analyze(flexSnapshot, proposal(["b"], ["q"]));
  assert.deepEqual(flex.replacementScarcity.eligibleSlots, ["FLEX"]);
  assert.equal(flex.replacementScarcity.replacementProjectionOrNull, 9);

  const opSnapshot = snap({
    players: [
      player("q","QB",20), player("q2","QB",7), player("d","DST",6),
      player("faD","DST",30), player("faQ","QB",9)
    ],
    mine: [entry("q","OP"), entry("q2","BE")],
    other: [entry("d","BE")],
    availablePlayers: ["faD","faQ"],
    size: 3,
    lineupSlots: [{slot:"OP",count:1},{slot:"BE",count:1}]
  });
  const op = analyze(opSnapshot, proposal(["q2"], ["d"]));
  assert.deepEqual(op.replacementScarcity.eligibleSlots, ["OP"]);
  assert.equal(op.replacementScarcity.replacementProjectionOrNull, 9);
});

test("TCW-034 F02 replacement numeric withholds without a feasible acquisition path or numeric projection", () => {
  const exhaustedSnapshot = snap({
    players: [player("a","RB",20), player("c","RB",7), player("x","WR",6), player("faR","RB",9)],
    mine: [entry("a","RB"), entry("c","BE")],
    other: [entry("x","BE")],
    availablePlayers: ["faR"],
    size: 2,
    waiver: { acquisitionLimit: 0, matchupAcquisitionLimit: -1 }
  });
  const exhausted = analyze(exhaustedSnapshot, proposal(["c"], ["x"]));
  assert.equal(exhausted.replacementScarcity.acquisitionPathStatus, "exhausted");
  assert.equal(exhausted.replacementScarcity.replacementProjectionOrNull, null);

  const missingProjectionSnapshot = snap({
    players: [player("a","RB",20), player("c","RB",7), player("x","WR",6), player("faR","RB",null)],
    mine: [entry("a","RB"), entry("c","BE")],
    other: [entry("x","BE")],
    availablePlayers: ["faR"],
    size: 2
  });
  const missingProjection = analyze(missingProjectionSnapshot, proposal(["c"], ["x"]));
  assert.deepEqual(missingProjection.replacementScarcity.eligibleSlots, ["RB"]);
  assert.equal(missingProjection.replacementScarcity.replacementProjectionOrNull, null);
});

test("TCW-045-F02-R1 missing and partial roster settings never authorize numeric direct-add replacement or material quality cost", () => {
  const make = () => snap({
    players: [player("a","RB",20),player("c","RB",9),player("x","WR",6),player("faR","RB",8)],
    mine:[entry("a","RB"),entry("c","BE")], other:[entry("x","BE")],
    size:3, availablePlayers:["faR"]
  });
  for (const [name, rules] of [
    ["absent", undefined],
    ["partial size", { positionLimits:[] }],
    ["partial position rules", { size:3 }],
    ["malformed position rule", { size:3, positionLimits:[{ position:"RB",limit:null }] }]
  ]) {
    const snapshot = make();
    if (rules === undefined) delete snapshot.league.rosterRules;
    else snapshot.league.rosterRules = rules;
    const result = analyze(snapshot, proposal(["c"],["x"]));
    assert.equal(result.replacementScarcity.replacementProjectionOrNull, null, name);
    assert.deepEqual(result.replacementScarcity.positionalAndFLEXOPDemand[0].feasibleCandidateIds, [], name);
    assert.equal(result.replacementScarcity.positionalAndFLEXOPDemand[0].acquisitionPathStatus, "UNKNOWN", name);
    assert.equal(result.depth.materialDepthEvidence.replacementQualityCost, false, name);
    assert.notEqual(result.depth.fragility.state, "DANGEROUS", name);
  }
});

test("TCW-045-F02-R1 unknown rules also fail closed after a simulated conditional drop", () => {
  const make = () => snap({
    players: [player("a","RB",20),player("c","RB",9),player("x","WR",6),player("faR","RB",8)],
    mine:[entry("a","RB"),entry("c","BE")], other:[entry("x","BE")],
    size:2, availablePlayers:["faR"]
  });
  for (const rules of [undefined, {size:2}, {positionLimits:[]}, {size:2,positionLimits:[{position:"RB",limit:"unknown"}]}]) {
    const snapshot=make();
    if (rules === undefined) delete snapshot.league.rosterRules;
    else snapshot.league.rosterRules=rules;
    const result=analyze(snapshot,proposal(["c"],["x"]));
    assert.equal(result.replacementScarcity.replacementProjectionOrNull,null);
    assert.deepEqual(result.replacementScarcity.positionalAndFLEXOPDemand[0].feasibleCandidateIds,[]);
    assert.equal(result.replacementScarcity.positionalAndFLEXOPDemand[0].acquisitionPathStatus,"UNKNOWN");
    assert.equal(result.depth.materialDepthEvidence.replacementQualityCost,false);
    assert.notEqual(result.depth.fragility.state,"DANGEROUS");
  }
});

test("TCW-045-F02-R1 verified direct add permits numeric replacement; a verified but conditional drop does not authorize one", () => {
  const fixture=(size)=>snap({
    players:[player("a","RB",20),player("c","RB",9),player("x","WR",6),player("faR","RB",8)],
    mine:[entry("a","RB"),entry("c","BE")],other:[entry("x","BE")],
    size,availablePlayers:["faR"]
  });
  const direct=analyze(fixture(3),proposal(["c"],["x"]));
  assert.equal(direct.replacementScarcity.replacementProjectionOrNull,8);
  assert.deepEqual(direct.replacementScarcity.positionalAndFLEXOPDemand[0].feasibleCandidateIds,["faR"]);
  assert.equal(direct.replacementScarcity.positionalAndFLEXOPDemand[0].acquisitionPathStatus,"KNOWN_LEGAL");
  const conditional=analyze(fixture(2),proposal(["c"],["x"]));
  assert.equal(conditional.replacementScarcity.replacementProjectionOrNull,null);
  assert.deepEqual(conditional.replacementScarcity.positionalAndFLEXOPDemand[0].feasibleCandidateIds,[]);
  assert.equal(conditional.replacementScarcity.positionalAndFLEXOPDemand[0].acquisitionPathStatus,"CONDITIONAL");
  assert.equal(conditional.depth.materialDepthEvidence.replacementQualityCost,false);
  assert.notEqual(conditional.depth.fragility.state,"DANGEROUS");
  assert.deepEqual(conditional.transactionActions,[]);
});

test("TCW-045-F02-R1 proven QB position-limit block remains KNOWN_BLOCKED for OP demand", () => {
  const snapshot=snap({
    players:[player("r","RB",20),player("c","RB",9),player("x","DST",6),player("faQ","QB",8)],
    mine:[entry("r","OP"),entry("c","BE")],other:[entry("x","BE")],
    size:3,availablePlayers:["faQ"],
    lineupSlots:[{slot:"OP",count:1},{slot:"BE",count:1}]
  });
  snapshot.league.rosterRules={size:3,positionLimits:[{position:"QB",limit:0}]};
  const result=analyze(snapshot,proposal(["c"],["x"]));
  assert.equal(result.replacementScarcity.replacementProjectionOrNull,null);
  assert.deepEqual(result.replacementScarcity.positionalAndFLEXOPDemand[0].feasibleCandidateIds,[]);
  assert.equal(result.replacementScarcity.positionalAndFLEXOPDemand[0].acquisitionPathStatus,"KNOWN_BLOCKED");
  assert.equal(result.depth.materialDepthEvidence.replacementQualityCost,false);
});

test("TCW-034 F03 canonical playoffs cannot be shrunk by caller subset", () => {
  const snapshot = snap({
    players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")],
    other: [entry("x","RB")],
    playoffWeeks: [15,16]
  });
  const fx = external(snapshot, [15], { a:{15:10}, b:{15:8}, x:{15:14} });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { ...fx, playoffWeeks:[15] });

  assert.deepEqual(result.playoffs.weeks, [15,16]);
  assert.equal(result.playoffs.status, "UNKNOWN");
  assert.equal(result.playoffs.horizonDelta, null);
  assert.equal(result.playoffs.meanWeeklyDelta, null);
  assert.equal(result.playoffs.direction, "UNKNOWN");
});

test("TCW-034 F03 bare caller ROS completeness flag cannot create canonical ROS", () => {
  const snapshot = snap({
    players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")],
    other: [entry("x","RB")]
  });
  const fx = external(snapshot, [6], { a:{6:10}, b:{6:8}, x:{6:14} });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { ...fx, restOfSeasonWeeks:[6], restOfSeasonComplete:true });

  assert.equal(result.restOfSeason.status, "UNKNOWN");
  assert.deepEqual(result.restOfSeason.weeks, []);
  assert.equal(result.restOfSeason.horizonDelta, null);
  assert.match(result.restOfSeason.reason, /authoritative complete remaining-season/i);
});

test("TCW-034 F03 authoritative complete league ROS can become READY and caller subset cannot shrink it", () => {
  const snapshot = snap({
    players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")],
    other: [entry("x","RB")],
    restOfSeasonWeeks: [6,7]
  });
  const fx = external(snapshot, [6,7], { a:{6:10,7:10}, b:{6:8,7:8}, x:{6:14,7:14} });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { ...fx, restOfSeasonWeeks:[6], restOfSeasonComplete:true });

  assert.deepEqual(result.restOfSeason.weeks, [6,7]);
  assert.equal(result.restOfSeason.status, "READY");
  assert.equal(result.restOfSeason.direction, "UPGRADE");
});

test("TCW-034 F03 explicitly named partial future window remains supported without relabeling playoffs", () => {
  const snapshot = snap({
    players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")],
    other: [entry("x","RB")],
    playoffWeeks: [15,16]
  });
  const fx = external(snapshot, [15], { a:{15:10}, b:{15:8}, x:{15:14} });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { ...fx, futureWeeks:[15], playoffWeeks:[15] });

  assert.deepEqual(result.future.weeks, [15]);
  assert.equal(result.future.status, "READY");
  assert.deepEqual(result.playoffs.weeks, [15,16]);
  assert.equal(result.playoffs.status, "UNKNOWN");
});

test("TCW-034 replacement/scarcity keeps structural pool separate and withholds unsupported numeric VORP", () => {
  const common = {
    players: [player("a","RB",20,{byeWeek:8}), player("c","RB",5,{byeWeek:9}), player("x","WR",5,{byeWeek:10}), player("fa","RB",10,{byeWeek:11})],
    mine: [entry("a","RB"), entry("c","BE")], other: [entry("x","WR")]
  };
  const strong = analyze(snap({ ...common, availablePlayers:["fa"], size:3 }), proposal(["c"], ["x"]));
  assert.equal(strong.replacementScarcity.fullStructuralPoolUsed, true);
  assert.equal(strong.replacementScarcity.replacementProjectionOrNull, 10);
  assert.equal(strong.replacementScarcity.marginalVorpOrNull, null);
  assert.equal(strong.replacementScarcity.noDoubleCountAttestation, true);
  const unknown = analyze(snap({ ...common, availablePlayers:undefined }), proposal(["c"], ["x"]));
  assert.equal(unknown.replacement.status, "UNKNOWN");
  assert.equal(unknown.replacementScarcity.fullStructuralPoolUsed, false);
  assert.equal(unknown.replacementScarcity.replacementProjectionOrNull, null);
});

test("TCW-034 FLEX and OP remain simultaneously optimized without value double-counting", () => {
  const snapshot = snap({
    players: [player("q","QB",20), player("r","RB",10), player("w","WR",12), player("c","TE",5), player("x","WR",15)],
    mine: [entry("q","OP"), entry("r","RB"), entry("w","FLEX"), entry("c","BE")], other: [entry("x","WR")], size:4,
    lineupSlots:[{slot:"RB",count:1},{slot:"FLEX",count:1},{slot:"OP",count:1},{slot:"BE",count:1}]
  });
  const result = analyze(snapshot, proposal(["c"], ["x"]), { tradeValueSources:[valueSource({ c:40, x:60 })] });
  assert.equal(result.currentWeek.sources[0].status, "READY");
  const assignments = result.currentWeek.sources[0].postAssignments;
  assert.equal(new Set(assignments.map((row) => row.player.id)).size, assignments.length);
  assert.equal(result.packageValue.winner, "YOU_WIN");
});

test("TCW-034 package source disagreement remains independent from supported roster improvement", () => {
  const snapshot = snap({ players: [player("a","RB",10), player("b","RB",8), player("x","RB",14)],
    mine: [entry("a","RB"), entry("b","BE")], other: [entry("x","RB")] });
  const sources = [
    valueSource({ a:56, x:44 }, { sourceId:"source-a", primary:true }),
    valueSource({ a:43, x:57 }, { sourceId:"source-b", primary:false })
  ];
  const result = analyze(snapshot, proposal(["a"], ["x"]), { tradeValueSources:sources });
  assert.equal(result.packageValue.status, "SOURCE_DISAGREEMENT");
  assert.equal(result.packageValue.winner, "WITHHELD");
  assert.equal(result.doNothing.userDecision, "IMPROVES");
});

test("TCW-034 current-week lock stays counterfactual and cannot create executable CONSIDER recommendation", () => {
  const snapshot = snap({ players:[player("a","RB",10), player("x","RB",14)],
    mine:[entry("a","RB",{locked:true})], other:[entry("x","RB")], size:1, lineupSlots:[{slot:"RB",count:1}] });
  const result = analyze(snapshot, proposal(["a"], ["x"]), { tradeValueSources:[valueSource({ a:40, x:60 })] });
  assert.equal(result.currentWeek.actionability, "INFORMATIONAL_ONLY");
  assert.equal(result.packageValue.winner, "YOU_WIN");
  assert.notEqual(result.doNothing.recommendation, "CONSIDER");
  assert.match(result.doNothing.reasons.join(" "), /counterfactual/i);
});
