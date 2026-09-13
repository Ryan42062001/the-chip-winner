import test from "node:test";
import assert from "node:assert/strict";
import { renderStartSitComparison } from "../src/ui/start-sit-comparison.js";

function preferenceResult(overrides = {}) {
  return {
    status: "preference",
    first: { id: "1", name: "One", projection: 18, gameTime: "2026-09-02T17:00:00Z" },
    second: { id: "2", name: "Two", projection: 16, gameTime: "2026-09-02T20:00:00Z" },
    preferred: { id: "1", name: "One" },
    difference: 2,
    reason: "Higher available projection",
    confidence: { label: "High", score: 100, completenessScore: 100, freshness: "fresh", limitations: [] },
    ...overrides
  };
}

function snapshot(entries) {
  return {
    currentWeek: 1,
    league: { season: 2026, scoringType: "PPR" },
    rosters: [{ teamId: "mine", entries }]
  };
}

test("start sit UI labels completeness separately from snapshot freshness", () => {
  const html = renderStartSitComparison({ status: "preference", first: { id: "1", name: "One", projection: 18 }, second: { id: "2", name: "Two", projection: 16 }, preferred: { id: "1", name: "One" }, difference: 2, reason: "Higher available projection", confidence: { label: "High", score: 94, completenessScore: 100, freshness: "aging", limitations: ["Snapshot is aging."] } });
  assert.match(html, /High data confidence · 100% complete/);
  assert.match(html, /Snapshot freshness: aging\./);
  assert.doesNotMatch(html, /94% complete/);
  assert.match(html, /not the chance a player succeeds/);
});

test("start sit UI keeps missing player fields visible without conflating freshness", () => {
  const html = renderStartSitComparison({ status: "preference", first: { id: "1", name: "One", projection: 18 }, second: { id: "2", name: "Two", projection: 16 }, preferred: { id: "1", name: "One" }, difference: 2, reason: "Higher available projection", confidence: { label: "Medium", score: 67, completenessScore: 75, freshness: "stale", limitations: ["Two opponent unavailable.", "Snapshot is stale."] } });
  assert.match(html, /Medium data confidence · 75% complete/);
  assert.match(html, /Snapshot freshness: stale\./);
  assert.match(html, /Two opponent unavailable/);
});

test("start sit UI keeps an explicitly mapped external source separate", () => {
  const result = { status: "preference", first: { id: "espn-1", name: "One", projection: 18 }, second: { id: "espn-2", name: "Two", projection: 16 }, preferred: { id: "espn-1", name: "One" }, difference: 2, reason: "Higher available projection", confidence: { label: "High", score: 100, completenessScore: 100, freshness: "fresh", limitations: [] } };
  const set = { provider: "FantasyPros manual CSV", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T12:00:00Z", projections: [{ providerPlayerId: "fp-1", week: 1, points: 15 }, { providerPlayerId: "fp-2", week: 1, points: 19 }] };
  const html = renderStartSitComparison(result, set, new Map([["fp-1", "espn-1"], ["fp-2", "espn-2"]]), { currentWeek: 1, league: { season: 2026, scoringType: "PPR" } });
  assert.match(html, /PROJECTION LEAN/); assert.match(html, /FantasyPros manual CSV/); assert.match(html, /Leans Two/); assert.match(html, /One 15\.0 vs Two 19\.0/);
});

test("start sit UI withholds external preference when an explicit mapping is missing", () => {
  const result = { status: "tossup", first: { id: "espn-1", name: "One", projection: 18 }, second: { id: "espn-2", name: "Two", projection: 17.5 }, difference: 0.5, reason: "Near tie", confidence: { label: "High", score: 100, completenessScore: 100, freshness: "fresh", limitations: [] } };
  const set = { provider: "External", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T12:00:00Z", projections: [{ providerPlayerId: "fp-1", week: 1, points: 15 }] };
  const html = renderStartSitComparison(result, set, new Map([["fp-1", "espn-1"]]), { currentWeek: 1, league: { season: 2026, scoringType: "PPR" } });
  assert.match(html, /Comparison withheld/); assert.match(html, /Two missing-mapping/); assert.doesNotMatch(html, /Leans Two/);
});

test("explicit ESPN roster lock makes a START / SIT preference informational only", () => {
  const result = preferenceResult();
  const html = renderStartSitComparison(
    result,
    null,
    null,
    snapshot([{ playerId: "1", lineupSlot: "RB", locked: true }, { playerId: "2", lineupSlot: "BE" }]),
    { now: Date.parse("2026-09-01T12:00:00Z") }
  );
  assert.match(html, /LINEUP MOVE LOCKED · INFORMATION ONLY/);
  assert.match(html, /One: ESPN reported this player locked\./);
  assert.match(html, /NO LINEUP ACTION/);
  assert.doesNotMatch(html, /PROJECTION LEAN/);
});

test("passed kickoff makes an otherwise unlocked START / SIT preference informational only", () => {
  const result = preferenceResult({
    first: { id: "1", name: "One", projection: 18, gameTime: "2026-09-01T17:00:00Z" },
    second: { id: "2", name: "Two", projection: 16, gameTime: "2026-09-02T20:00:00Z" }
  });
  const html = renderStartSitComparison(
    result,
    null,
    null,
    snapshot([{ playerId: "1", lineupSlot: "RB" }, { playerId: "2", lineupSlot: "BE" }]),
    { now: Date.parse("2026-09-01T18:00:00Z") }
  );
  assert.match(html, /LINEUP MOVE LOCKED · INFORMATION ONLY/);
  assert.match(html, /reported NFL kickoff time has passed/);
  assert.doesNotMatch(html, /PROJECTION LEAN/);
});

test("locked comparison retains external source context without external action language", () => {
  const result = preferenceResult();
  const set = { provider: "FantasyPros manual CSV", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T12:00:00Z", projections: [{ providerPlayerId: "fp-1", week: 1, points: 15 }, { providerPlayerId: "fp-2", week: 1, points: 19 }] };
  const html = renderStartSitComparison(
    result,
    set,
    new Map([["fp-1", "1"], ["fp-2", "2"]]),
    snapshot([{ playerId: "1", lineupSlot: "RB", locked: true }, { playerId: "2", lineupSlot: "BE" }]),
    { now: Date.parse("2026-09-01T12:00:00Z") }
  );
  assert.match(html, /FantasyPros manual CSV/);
  assert.match(html, /Informational only · higher projection Two/);
  assert.doesNotMatch(html, /Leans Two/);
  assert.doesNotMatch(html, /PROJECTION LEAN/);
});

test("unlocked preference and tossup rendering remain unchanged", () => {
  const unlocked = snapshot([{ playerId: "1", lineupSlot: "RB" }, { playerId: "2", lineupSlot: "BE" }]);
  const preference = renderStartSitComparison(preferenceResult(), null, null, unlocked, { now: Date.parse("2026-09-01T12:00:00Z") });
  assert.match(preference, /PROJECTION LEAN/);
  assert.doesNotMatch(preference, /LINEUP MOVE LOCKED/);

  const tossup = renderStartSitComparison(preferenceResult({ status: "tossup", difference: 0.5, reason: "The projection difference is below the 1-point action threshold.", preferred: undefined }), null, null, unlocked, { now: Date.parse("2026-09-01T12:00:00Z") });
  assert.match(tossup, /NEAR TIE/);
  assert.doesNotMatch(tossup, /LINEUP MOVE LOCKED/);
});

test("invalid and missing comparison states remain unchanged even when roster locks exist", () => {
  const lockedSnapshot = snapshot([{ playerId: "1", lineupSlot: "RB", locked: true }, { playerId: "2", lineupSlot: "BE" }]);
  const invalid = renderStartSitComparison({ status: "invalid", reason: "Choose two different players." }, null, null, lockedSnapshot, { now: Date.parse("2026-09-01T12:00:00Z") });
  assert.match(invalid, /Comparison unavailable/);
  assert.doesNotMatch(invalid, /LINEUP MOVE LOCKED/);

  const missing = renderStartSitComparison({ status: "missing", first: { id: "1", name: "One", projection: null }, second: { id: "2", name: "Two", projection: 16 }, reason: "A projection is missing, so no projection-based preference is available.", confidence: { label: "Low", score: 40, completenessScore: 50, freshness: "fresh", limitations: ["One projection unavailable."] } }, null, null, lockedSnapshot, { now: Date.parse("2026-09-01T12:00:00Z") });
  assert.match(missing, /No ESPN projection preference/);
  assert.doesNotMatch(missing, /LINEUP MOVE LOCKED/);
});
