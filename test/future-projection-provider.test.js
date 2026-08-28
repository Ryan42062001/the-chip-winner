import test from "node:test";
import assert from "node:assert/strict";
import { FutureProjectionProvider, evaluateFutureProjectionCompatibility, indexFutureProjections, normalizeFutureProjectionSet, parseFutureProjectionCsv } from "../src/providers/projections/future-projection-provider.js";

const validSet = { provider: "example", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T00:00:00Z", projections: [{ providerPlayerId: "p-1", week: 1, points: 18.4 }] };

test("future projection sets preserve explicit weekly values", () => {
  const result = normalizeFutureProjectionSet(validSet);
  assert.equal(result.valid, true);
  assert.equal(indexFutureProjections(result.value).get("p-1:1"), 18.4);
});

test("future projection CSV imports and caches explicit weekly records", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const provider = new FutureProjectionProvider({ storage });
  const set = provider.importCsv("provider_player_id,week,points\np-1,15,17.25", { provider: "example", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T00:00:00Z" });
  assert.equal(set.projections[0].points, 17.25);
  assert.equal(provider.readCache().provider, "example");
});

test("future projection CSV rejects duplicate player weeks", () => {
  assert.throws(() => parseFutureProjectionCsv("provider_player_id,week,points\np-1,15,10\np-1,15,11", { provider: "x", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T00:00:00Z" }), /duplicate/);
});

test("future projections reject missing identities and invented numeric values", () => {
  const result = normalizeFutureProjectionSet({ ...validSet, projections: [{ week: 19, points: null }] });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /providerPlayerId/);
});

test("future projection compatibility reports ready and stale source states", () => {
  const snapshot = { league: { season: 2026, scoringType: "PPR" } };
  assert.equal(evaluateFutureProjectionCompatibility(validSet, snapshot, { now: Date.parse("2026-08-29T00:00:00Z") }).status, "ready");
  const stale = evaluateFutureProjectionCompatibility(validSet, snapshot, { now: Date.parse("2026-09-10T00:00:00Z") });
  assert.equal(stale.usable, true); assert.equal(stale.status, "stale"); assert.match(stale.warnings[0], /days old/);
});

test("future projection compatibility blocks season scoring and future-time mismatches", () => {
  const result = evaluateFutureProjectionCompatibility({ ...validSet, season: 2025, scoringFormat: "Standard", capturedAt: "2026-08-30T00:00:00Z" }, { league: { season: 2026, scoringType: "PPR" } }, { now: Date.parse("2026-08-28T00:00:00Z") });
  assert.equal(result.usable, false); assert.equal(result.status, "blocked");
  assert.match(result.errors.join(" "), /season 2025/); assert.match(result.errors.join(" "), /scoring format Standard/); assert.match(result.errors.join(" "), /future/);
});
