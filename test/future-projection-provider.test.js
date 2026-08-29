import test from "node:test";
import assert from "node:assert/strict";
import { FutureProjectionProvider, evaluateFutureProjectionCompatibility, indexFutureProjections, normalizeFutureProjectionSet, parseFutureProjectionCsv, selectMappedFutureProjection } from "../src/providers/projections/future-projection-provider.js";

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
  const set = provider.importCsv("provider,scoring_format,season,captured_at,provider_player_id,week,points\nexample,PPR,2026,2026-08-28T00:00:00Z,p-1,15,17.25");
  assert.equal(set.projections[0].points, 17.25);
  assert.equal(provider.readCache().provider, "example");
});

test("future projection CSV rejects duplicate player weeks", () => {
  assert.throws(() => parseFutureProjectionCsv("provider,scoring_format,season,captured_at,provider_player_id,week,points\nx,PPR,2026,2026-08-28T00:00:00Z,p-1,15,10\nx,PPR,2026,2026-08-28T00:00:00Z,p-1,15,11"), /duplicate/);
});

test("future projection CSV requires consistent explicit source metadata", () => {
  assert.throws(() => parseFutureProjectionCsv("provider_player_id,week,points\np-1,15,10"), /missing provider/);
  assert.throws(() => parseFutureProjectionCsv("provider,scoring_format,season,captured_at,provider_player_id,week,points\nx,PPR,2026,2026-08-28T00:00:00Z,p-1,15,10\ny,PPR,2026,2026-08-28T00:00:00Z,p-2,15,11"), /identical/);
});

test("future projections reject missing identities and invented numeric values", () => {
  const result = normalizeFutureProjectionSet({ ...validSet, projections: [{ week: 19, points: null }] });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /providerPlayerId/);
});

test("mapped projection lookup distinguishes ready mapping and value gaps", () => {
  const map = new Map([["p-1", "espn-1"]]);
  assert.deepEqual(selectMappedFutureProjection(validSet, map, "espn-1", 1), { status: "ready", points: 18.4 });
  assert.equal(selectMappedFutureProjection(validSet, map, "espn-1", 2).status, "missing-week");
  assert.equal(selectMappedFutureProjection(validSet, map, "espn-2", 1).status, "missing-mapping");
  assert.equal(selectMappedFutureProjection(null, map, "espn-1", 1).status, "missing-source");
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
