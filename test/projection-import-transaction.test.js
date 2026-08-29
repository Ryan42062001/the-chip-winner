import test from "node:test";
import assert from "node:assert/strict";
import { FutureProjectionProvider } from "../src/providers/projections/future-projection-provider.js";
import { ProjectionIdentityMapProvider } from "../src/providers/projections/projection-identity-map.js";
import { importProjectionBundle, preflightProjectionImport, summarizeProjectionImport } from "../src/application/projection-import-transaction.js";

const csv = (capturedAt, points = 10, provider = "example") => `provider,scoring_format,season,captured_at,provider_player_id,week,points\n${provider},PPR,2026,${capturedAt},p-1,1,${points}`;
const ids = (espnId = "e-1") => `provider_player_id,espn_player_id\np-1,${espnId}`;
function storage() { const values = new Map(); return { values, getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; }
function providers(shared = storage()) { return { shared, projectionProvider: new FutureProjectionProvider({ storage: shared }), identityProvider: new ProjectionIdentityMapProvider({ storage: shared }) }; }

test("projection import summaries classify identical, older, and newer records deterministically", () => {
  const current = { provider: "example", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T00:00:00Z", projections: [{ providerPlayerId: "p-1", week: 1, points: 10, capturedAt: "2026-08-28T00:00:00Z" }] };
  assert.equal(summarizeProjectionImport(current, current).retained, 1);
  assert.equal(summarizeProjectionImport(current, { ...current, capturedAt: "2026-08-27T00:00:00Z", projections: [{ ...current.projections[0], capturedAt: "2026-08-27T00:00:00Z" }] }).ignoredOlder, 1);
  assert.equal(summarizeProjectionImport(current, { ...current, capturedAt: "2026-08-29T00:00:00Z", projections: [{ ...current.projections[0], points: 11, capturedAt: "2026-08-29T00:00:00Z" }] }).updated, 1);
});

test("projection bundle imports projections and identity mappings together", () => {
  const p = providers(); const result = importProjectionBundle({ ...p, projectionsCsv: csv("2026-08-28T00:00:00Z"), identityMapCsv: ids() });
  assert.equal(result.projectionSet.projections.length, 1); assert.equal(result.identityMap.get("p-1"), "e-1"); assert.equal(result.summary.added, 1);
});

test("projection bundle rejects incompatible sources before either cache write", () => {
  const p = providers(); importProjectionBundle({ ...p, projectionsCsv: csv("2026-08-28T00:00:00Z"), identityMapCsv: ids() });
  const before = new Map(p.shared.values);
  assert.throws(() => preflightProjectionImport({ ...p, projectionsCsv: csv("2026-08-29T00:00:00Z", 11, "other"), identityMapCsv: ids() }), /provider/);
  assert.deepEqual(p.shared.values, before);
});

test("projection bundle rejects identity conflicts before projection cache writes", () => {
  const p = providers(); importProjectionBundle({ ...p, projectionsCsv: csv("2026-08-28T00:00:00Z"), identityMapCsv: ids() }); const before = new Map(p.shared.values);
  assert.throws(() => preflightProjectionImport({ ...p, projectionsCsv: csv("2026-08-29T00:00:00Z", 11), identityMapCsv: ids("e-2") }), /conflicts/);
  assert.deepEqual(p.shared.values, before);
});

test("equal-time conflicts expose a conflicting summary and preserve both caches", () => {
  const p = providers(); importProjectionBundle({ ...p, projectionsCsv: csv("2026-08-28T00:00:00Z"), identityMapCsv: ids() }); const before = new Map(p.shared.values);
  assert.throws(() => preflightProjectionImport({ ...p, projectionsCsv: csv("2026-08-28T00:00:00Z", 99), identityMapCsv: ids() }), (error) => error.summary.conflicting === 1);
  assert.deepEqual(p.shared.values, before);
});

test("commit failure rolls both projection caches back", () => {
  const p = providers(); importProjectionBundle({ ...p, projectionsCsv: csv("2026-08-28T00:00:00Z"), identityMapCsv: ids() }); const before = new Map(p.shared.values); let failed = false;
  const original = p.identityProvider.saveCache.bind(p.identityProvider); p.identityProvider.saveCache = (map) => { if (!failed) { failed = true; throw new Error("storage failure"); } return original(map); };
  assert.throws(() => importProjectionBundle({ ...p, projectionsCsv: csv("2026-08-29T00:00:00Z", 12), identityMapCsv: ids() }), /storage failure/);
  assert.deepEqual(p.shared.values, before);
});
