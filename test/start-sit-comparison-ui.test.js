import test from "node:test";
import assert from "node:assert/strict";
import { renderStartSitComparison } from "../src/ui/start-sit-comparison.js";

test("start sit UI labels data confidence without claiming outcome probability", () => {
  const html = renderStartSitComparison({ status: "preference", first: { id: "1", name: "One", projection: 18 }, second: { id: "2", name: "Two", projection: 16 }, preferred: { id: "1", name: "One" }, difference: 2, reason: "Higher available projection", confidence: { label: "Medium", score: 67, limitations: ["Snapshot is stale."] } });
  assert.match(html, /Medium data confidence · 67% complete/); assert.match(html, /Snapshot is stale/); assert.match(html, /not the chance a player succeeds/);
});

test("start sit UI keeps an explicitly mapped external source separate", () => {
  const result = { status: "preference", first: { id: "espn-1", name: "One", projection: 18 }, second: { id: "espn-2", name: "Two", projection: 16 }, preferred: { id: "espn-1", name: "One" }, difference: 2, reason: "Higher available projection", confidence: { label: "High", score: 100, limitations: [] } };
  const set = { provider: "FantasyPros manual CSV", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T12:00:00Z", projections: [{ providerPlayerId: "fp-1", week: 1, points: 15 }, { providerPlayerId: "fp-2", week: 1, points: 19 }] };
  const html = renderStartSitComparison(result, set, new Map([["fp-1", "espn-1"], ["fp-2", "espn-2"]]), { currentWeek: 1, league: { season: 2026, scoringType: "PPR" } });
  assert.match(html, /PROJECTION LEAN/); assert.match(html, /FantasyPros manual CSV/); assert.match(html, /Leans Two/); assert.match(html, /One 15\.0 vs Two 19\.0/);
});

test("start sit UI withholds external preference when an explicit mapping is missing", () => {
  const result = { status: "tossup", first: { id: "espn-1", name: "One", projection: 18 }, second: { id: "espn-2", name: "Two", projection: 17.5 }, difference: 0.5, reason: "Near tie", confidence: { label: "High", score: 100, limitations: [] } };
  const set = { provider: "External", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T12:00:00Z", projections: [{ providerPlayerId: "fp-1", week: 1, points: 15 }] };
  const html = renderStartSitComparison(result, set, new Map([["fp-1", "espn-1"]]), { currentWeek: 1, league: { season: 2026, scoringType: "PPR" } });
  assert.match(html, /Comparison withheld/); assert.match(html, /Two missing-mapping/); assert.doesNotMatch(html, /Leans Two/);
});
