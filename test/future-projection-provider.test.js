import test from "node:test";
import assert from "node:assert/strict";
import { indexFutureProjections, normalizeFutureProjectionSet } from "../src/providers/projections/future-projection-provider.js";

const validSet = { provider: "example", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T00:00:00Z", projections: [{ providerPlayerId: "p-1", week: 1, points: 18.4 }] };

test("future projection sets preserve explicit weekly values", () => {
  const result = normalizeFutureProjectionSet(validSet);
  assert.equal(result.valid, true);
  assert.equal(indexFutureProjections(result.value).get("p-1:1"), 18.4);
});

test("future projections reject missing identities and invented numeric values", () => {
  const result = normalizeFutureProjectionSet({ ...validSet, projections: [{ week: 19, points: null }] });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /providerPlayerId/);
});
