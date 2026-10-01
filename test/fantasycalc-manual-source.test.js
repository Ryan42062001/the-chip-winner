import test from "node:test";
import assert from "node:assert/strict";
import { createFantasyCalcManualSource, FANTASYCALC_MAX_AGE_MS } from "../src/domain/fantasycalc-manual-source.js";
import { evaluatePackageValue } from "../src/domain/trade-value-engine.js";
import { renderTradeAdvantage } from "../src/ui/trade-analyzer.js";

const NOW = Date.parse("2026-09-30T12:00:00Z");
const AS_OF = new Date(NOW).toISOString();
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function snapshot(overrides = {}) {
  return {
    league: { season: 2026, scoringType: "H2H_POINTS", receptionScoring: { family: "ppr", pointsPerReception: 1 }, tePremium: false,
      lineupSlots: [{ slot: "QB", count: 1 }, { slot: "RB", count: 2 }, { slot: "BE", count: 4 }], ...overrides.league },
    teams: Array.from({ length: overrides.teamCount || 10 }, (_, i) => ({ id: String(i) })),
    players: [{ id: "a", position: "RB" }, { id: "b", position: "WR" }, { id: "x", position: "RB" }, { id: "k", position: "K" }]
  };
}
function capture(values, overrides = {}) {
  const asOf = overrides.asOf || AS_OF;
  const sessionId = overrides.sessionId || "session-1";
  const profile = { teamCount: 10, ppr: "PPR", qbFormat: "1QB", tePremium: false, ...overrides.profile };
  return {
    sessionId, asOf,
    profile,
    values: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value, sessionId, asOf,
      profileKey: JSON.stringify([profile.teamCount, profile.ppr, profile.qbFormat, profile.tePremium]) }]))
  };
}
function evaluate(values, options = {}) {
  const snap = options.snapshot || snapshot();
  const source = createFantasyCalcManualSource(snap, options.capture || capture(values));
  return evaluatePackageValue({ snapshot: snap, outgoingPlayerIds: options.outgoing || ["a"], incomingPlayerIds: options.incoming || ["x"], sources: [source], now: options.now || NOW });
}
function reason(result, pattern) { assert.equal(result.status, "WITHHELD"); assert.match(result.reasons.join(" "), pattern); assert.equal(result.displayedSplit, null); }

test("manual FantasyCalc share uses exact math with inclusive fair boundaries and symmetric direction", () => {
  for (const [send, receive, expected] of [[50,50,"FAIR_TRADE"],[55,45,"FAIR_TRADE"],[45,55,"FAIR_TRADE"],[44.99,55.01,"YOU_WIN"],[55.01,44.99,"THEY_WIN"]]) {
    const value = evaluate({ a:send, x:receive });
    assert.equal(value.status, "READY");
    assert.equal(value.winner, expected);
    assert.equal(value.incomingShare, receive);
    assert.equal(value.outgoingShare, send);
    assert.equal(value.unit, "fantasycalc-market-value");
  }
});

test("one-for-one and uneven packages sum all exact assets; zero is a legitimate value", () => {
  assert.equal(evaluate({ a:40, x:60 }).winner, "YOU_WIN");
  const uneven = evaluate({ a:20, b:25, x:55 }, { outgoing: ["a","b"] });
  assert.equal(uneven.status, "READY");
  assert.equal(uneven.outgoingTotal, 45);
  assert.equal(uneven.incomingTotal, 55);
  assert.equal(evaluate({ a:0, x:10 }).status, "READY");
  reason(evaluate({ a:0, x:0 }), /TOTAL_VALUE_NOT_POSITIVE/);
});

test("manual values fail closed for missing, invalid, unsupported and mixed capture records", () => {
  reason(evaluate({ x:20 }), /ASSET_VALUE_MISSING/);
  reason(evaluate({ a:20 }), /ASSET_VALUE_MISSING/);
  for (const bad of [-1, NaN, "12", Infinity]) reason(evaluate({ a:bad, x:20 }), /ASSET_VALUE_INVALID/);
  reason(evaluate({ a:20, k:10 }, { incoming: ["k"] }), /UNSUPPORTED_FANTASYCALC_ASSET/);
  const mixed = capture({ a:20, x:30 });
  mixed.values.x.sessionId = "other-session";
  reason(evaluate({}, { capture:mixed }), /MIXED_SOURCE_SETTINGS_OR_VINTAGE/);
  const vintage = capture({ a:20, x:30 });
  vintage.values.x.asOf = "2026-09-29T12:00:00Z";
  reason(evaluate({}, { capture:vintage }), /MIXED_SOURCE_SETTINGS_OR_VINTAGE/);
  const profile = capture({ a:20, x:30 });
  profile.values.x.profileKey = JSON.stringify([12, "PPR", "1QB", false]);
  reason(evaluate({}, { capture:profile }), /MIXED_SOURCE_SETTINGS_OR_VINTAGE/);
});

test("profile compatibility is strict for PPR, team count, QB format and TE premium", () => {
  for (const [profile, expected] of [
    [{ ppr:"HALF_PPR" }, /PPR_PROFILE_INCOMPATIBLE/],
    [{ teamCount:12 }, /TEAM_COUNT_INCOMPATIBLE/],
    [{ qbFormat:"SUPERFLEX" }, /QB_PROFILE_INCOMPATIBLE/],
    [{ tePremium:true }, /TE_PREMIUM_INCOMPATIBLE/]
  ]) reason(evaluate({}, { capture:capture({ a:20, x:30 }, { profile }) }), expected);
  reason(evaluate({ a:20, x:30 }, { snapshot:snapshot({ league:{ receptionScoring:{ family:"custom", pointsPerReception:0.25 } } }) }), /ESPN_PPR_PROFILE_UNRESOLVED/);
  reason(evaluate({ a:20, x:30 }, { snapshot:snapshot({ league:{ lineupSlots:[] } }) }), /ESPN_QB_PROFILE_UNRESOLVED/);
  reason(evaluate({ a:20, x:30 }, { snapshot:snapshot({ league:{ tePremium:null } }) }), /ESPN_TE_PREMIUM_UNRESOLVED/);
});

test("24-hour freshness and 60-second future skew preserve exact boundaries", () => {
  assert.equal(evaluate({}, { capture:capture({ a:20, x:30 }, { asOf:new Date(NOW - FANTASYCALC_MAX_AGE_MS).toISOString() }) }).status, "READY");
  reason(evaluate({}, { capture:capture({ a:20, x:30 }, { asOf:new Date(NOW - FANTASYCALC_MAX_AGE_MS - 1).toISOString() }) }), /SOURCE_STALE/);
  assert.equal(evaluate({}, { capture:capture({ a:20, x:30 }, { asOf:new Date(NOW + 60_000).toISOString() }) }).status, "READY");
  reason(evaluate({}, { capture:capture({ a:20, x:30 }, { asOf:new Date(NOW + 60_001).toISOString() }) }), /SOURCE_FUTURE_DATED/);
});

test("advantage meter stays neutral for withheld and source disagreement without fabricated split", () => {
  const unavailable = renderTradeAdvantage(evaluate({ a:20 }), escapeHtml);
  assert.match(unavailable, /Value unavailable/);
  assert.doesNotMatch(unavailable, /style="width:/);
  const disagreement = renderTradeAdvantage({ status:"SOURCE_DISAGREEMENT", winner:"WITHHELD", reasons:["APPROVED_VALUE_SOURCES_DISAGREE"] }, escapeHtml);
  assert.match(disagreement, /Source disagreement/);
  assert.doesNotMatch(disagreement, /style="width:/);
  const ready = renderTradeAdvantage(evaluate({ a:40, x:60 }), escapeHtml);
  assert.match(ready, /You receive/);
  assert.match(ready, /Package value favors you/);
  assert.doesNotMatch(ready, /probability|chance|confidence/i);
});
