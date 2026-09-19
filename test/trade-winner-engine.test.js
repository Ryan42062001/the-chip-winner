import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyTradeValueShare,
  evaluatePackageValue,
  TRADE_VALUE_FAIRNESS
} from "../src/domain/trade-value-engine.js";
import {
  createSyntheticApprovedTradeValueSource,
  PRODUCTION_TRADE_VALUE_SOURCES
} from "../src/domain/trade-value-source.js";

const NOW = Date.parse("2026-09-19T12:30:00Z");
const snapshot = {
  league: { season: 2026, scoringType: "PPR" },
  teams: [{ id: "mine" }, { id: "other" }],
  players: [
    { id: "a", projection: 99, restOfSeasonValue: 999, rank: 1 },
    { id: "b", projection: 88, restOfSeasonValue: 888, rank: 2 },
    { id: "x", projection: 77, restOfSeasonValue: 777, rank: 3 },
    { id: "y", projection: 66, restOfSeasonValue: 666, rank: 4 }
  ]
};

function source(values, overrides = {}) {
  return createSyntheticApprovedTradeValueSource({
    asOf: "2026-09-19T12:00:00Z",
    teamCount: 2,
    values,
    ...overrides
  });
}

function evaluate(values, outgoing = ["a"], incoming = ["x"], overrides = {}) {
  return evaluatePackageValue({
    snapshot,
    outgoingPlayerIds: outgoing,
    incomingPlayerIds: incoming,
    sources: [source(values, overrides)],
    now: NOW
  });
}

test("TCW-034 fairness band is inclusive at exact 45 and 55 using unrounded share", () => {
  assert.deepEqual(TRADE_VALUE_FAIRNESS, { inclusiveLower: 45, inclusiveUpper: 55 });

  const lower = evaluate({ a: 55, x: 45 });
  assert.equal(lower.incomingShare, 45);
  assert.equal(lower.winner, "FAIR_TRADE");

  const upper = evaluate({ a: 45, x: 55 });
  assert.equal(upper.incomingShare, 55);
  assert.equal(upper.winner, "FAIR_TRADE");

  assert.equal(classifyTradeValueShare(45), "FAIR_TRADE");
  assert.equal(classifyTradeValueShare(55), "FAIR_TRADE");
});

test("TCW-034 55.01 is YOU_WIN even when presentation rounding still looks 55/45", () => {
  const result = evaluate({ a: 44.99, x: 55.01 });
  assert.equal(result.winner, "YOU_WIN");
  assert.equal(result.incomingShare, 55.01);
  assert.equal(result.displayedSplit.label, "55/45");
  assert.equal(result.displayedSplit.nearFairnessBoundary, true);
});

test("TCW-034 below 45 is THEY_WIN and zero-valued side remains explicit rather than missing", () => {
  assert.equal(evaluate({ a: 56, x: 44 }).winner, "THEY_WIN");

  const allIncoming = evaluate({ a: 0, x: 25 });
  assert.equal(allIncoming.status, "READY");
  assert.equal(allIncoming.incomingShare, 100);
  assert.equal(allIncoming.outgoingShare, 0);
  assert.equal(allIncoming.winner, "YOU_WIN");

  const zeroZero = evaluate({ a: 0, x: 0 });
  assert.equal(zeroZero.status, "WITHHELD");
  assert.equal(zeroZero.winner, "WITHHELD");
});

test("TCW-034 live production provider set is empty and package value is withheld", () => {
  assert.deepEqual(PRODUCTION_TRADE_VALUE_SOURCES, []);
  const result = evaluatePackageValue({ snapshot, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], now: NOW });
  assert.equal(result.status, "WITHHELD");
  assert.equal(result.winner, "WITHHELD");
  assert.equal(result.incomingShare, null);
  assert.equal(result.displayedSplit, null);
  assert.deepEqual(result.reasons, ["NO_APPROVED_COMPARABLE_VALUE_SOURCE"]);
});

test("TCW-034 values present in an unapproved source do not create authority", () => {
  const unapproved = source({ a: 40, x: 60 }, {
    authority: { managerApproved: false, trustedConfiguration: false }
  });
  const result = evaluatePackageValue({ snapshot, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], sources: [unapproved], now: NOW });
  assert.equal(result.status, "WITHHELD");
  assert.equal(result.winner, "WITHHELD");
  assert.match(result.reasons.join(" "), /SOURCE_NOT_MANAGER_APPROVED/);
});

test("TCW-034 stale source fails closed", () => {
  const stale = source({ a: 40, x: 60 }, {
    asOf: "2026-09-01T00:00:00Z",
    maxAgeMs: 60 * 60 * 1000
  });
  const result = evaluatePackageValue({ snapshot, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], sources: [stale], now: NOW });
  assert.equal(result.status, "WITHHELD");
  assert.match(result.reasons.join(" "), /SOURCE_STALE/);
});

test("TCW-034 incompatible scoring/mode/season fails closed", () => {
  for (const incompatible of [
    source({ a: 40, x: 60 }, { league: { season: 2026, scoringType: "HALF_PPR", teamCount: 2 } }),
    source({ a: 40, x: 60 }, { mode: "DYNASTY" }),
    source({ a: 40, x: 60 }, { league: { season: 2025, scoringType: "PPR", teamCount: 2 } })
  ]) {
    const result = evaluatePackageValue({ snapshot, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], sources: [incompatible], now: NOW });
    assert.equal(result.status, "WITHHELD");
    assert.equal(result.winner, "WITHHELD");
  }
});

test("TCW-034 missing ambiguous error invalid and mixed-vintage assets are never coerced to zero", () => {
  const cases = [
    source({ a: 40 }),
    source({ a: 40, x: { status: "AMBIGUOUS" } }),
    source({ a: 40, x: { status: "ERROR" } }),
    source({ a: 40, x: Number.NaN }),
    source({ a: 40, x: Number.POSITIVE_INFINITY }),
    source({ a: 40, x: -1 }),
    source({ a: 40, x: { status: "READY", value: 60, asOf: "2026-09-18T12:00:00Z" } })
  ];
  for (const item of cases) {
    const result = evaluatePackageValue({ snapshot, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], sources: [item], now: NOW });
    assert.equal(result.status, "WITHHELD");
    assert.equal(result.incomingTotal, null);
    assert.equal(result.winner, "WITHHELD");
  }
});

test("TCW-034 unequal packages sum every mapped asset on the common source", () => {
  const result = evaluate({ a: 25, b: 20, x: 60 }, ["a", "b"], ["x"]);
  assert.equal(result.status, "READY");
  assert.equal(result.outgoingTotal, 45);
  assert.equal(result.incomingTotal, 60);
  assert.equal(result.winner, "YOU_WIN");

  const reverse = evaluate({ a: 55, x: 25, y: 20 }, ["a"], ["x", "y"]);
  assert.equal(reverse.outgoingTotal, 55);
  assert.equal(reverse.incomingTotal, 45);
  assert.equal(reverse.winner, "FAIR_TRADE");
});

test("TCW-034 relevant approved source disagreement withholds generic winner without averaging", () => {
  const theyWin = source({ a: 56, x: 44 }, { sourceId: "approved-a", primary: true });
  const youWin = source({ a: 43, x: 57 }, { sourceId: "approved-b", primary: false });
  const result = evaluatePackageValue({ snapshot, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], sources: [theyWin, youWin], now: NOW });

  assert.equal(result.status, "SOURCE_DISAGREEMENT");
  assert.equal(result.winner, "WITHHELD");
  assert.equal(result.incomingShare, null);
  assert.deepEqual(result.sourceResults.map((row) => row.winner).sort(), ["THEY_WIN", "YOU_WIN"]);
});

test("TCW-034 agreeing sources require one designated primary and are never averaged", () => {
  const primary = source({ a: 40, x: 60 }, { sourceId: "approved-a", primary: true });
  const supporting = source({ a: 35, x: 65 }, { sourceId: "approved-b", primary: false });
  const result = evaluatePackageValue({ snapshot, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], sources: [primary, supporting], now: NOW });
  assert.equal(result.status, "READY");
  assert.equal(result.winner, "YOU_WIN");
  assert.equal(result.incomingShare, 60);

  const noPrimary = evaluatePackageValue({
    snapshot,
    outgoingPlayerIds: ["a"],
    incomingPlayerIds: ["x"],
    sources: [
      source({ a: 40, x: 60 }, { sourceId: "approved-a", primary: false }),
      source({ a: 35, x: 65 }, { sourceId: "approved-b", primary: false })
    ],
    now: NOW
  });
  assert.equal(noPrimary.status, "WITHHELD");
  assert.match(noPrimary.reasons.join(" "), /DESIGNATED_PRIMARY_SOURCE_REQUIRED/);
});

test("TCW-034 ranking projection ROS ADP waiver-style numeric fields never become package value", () => {
  const enriched = {
    ...snapshot,
    players: snapshot.players.map((player) => ({
      ...player,
      adp: 1,
      waiverScore: 100,
      vorp: 999,
      sosStars: 5
    }))
  };
  const result = evaluatePackageValue({ snapshot: enriched, outgoingPlayerIds: ["a"], incomingPlayerIds: ["x"], sources: [], now: NOW });
  assert.equal(result.status, "WITHHELD");
  assert.equal(result.incomingTotal, null);
  assert.equal(result.winner, "WITHHELD");
});
