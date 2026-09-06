import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFutureProjectionCompatibility, futureProjectionScoringFamily } from "../src/providers/projections/future-projection-provider.js";

const SET = Object.freeze({
  provider: "FantasyPros weekly r2p via DynastyProcess",
  scoringFormat: "PPR",
  season: 2026,
  capturedAt: "2026-09-08T14:00:00Z",
  projections: Object.freeze([{ providerPlayerId: "1", week: 2, points: 10, capturedAt: "2026-09-08T14:00:00Z" }])
});

test("future projection scoring labels normalize to explicit scoring families", () => {
  assert.equal(futureProjectionScoringFamily("PPR"), "ppr");
  assert.equal(futureProjectionScoringFamily("Head to Head PPR"), "ppr");
  assert.equal(futureProjectionScoringFamily("Half PPR"), "half-ppr");
  assert.equal(futureProjectionScoringFamily("Standard"), "standard");
  assert.equal(futureProjectionScoringFamily("Unknown"), null);
});

test("generic PPR projections remain compatible with ESPN Head to Head PPR without relabeling source metadata", () => {
  const result = evaluateFutureProjectionCompatibility(SET, { league: { season: 2026, scoringType: "Head to Head PPR" } }, { now: Date.parse("2026-09-08T15:00:00Z") });
  assert.equal(result.usable, true);
  assert.equal(result.status, "ready");
  assert.equal(SET.scoringFormat, "PPR");
});

test("PPR projections remain blocked for a different known scoring family", () => {
  const result = evaluateFutureProjectionCompatibility(SET, { league: { season: 2026, scoringType: "Half PPR" } }, { now: Date.parse("2026-09-08T15:00:00Z") });
  assert.equal(result.usable, false);
  assert.match(result.errors.join(" "), /does not match ESPN reception scoring/i);
});
