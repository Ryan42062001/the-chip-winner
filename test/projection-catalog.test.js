import test from "node:test";
import assert from "node:assert/strict";
import { ProjectionCatalog, validateProjectionSet } from "../src/providers/projections/projection-catalog.js";

const base = {
  source: "candidate-consensus",
  season: 2026,
  week: 1,
  scoringFormat: "espn-league:118749183",
  fetchedAt: "2026-09-08T12:00:00Z",
  players: [{ providerPlayerId: "abc", projection: 17.2, floor: null, ceiling: null }]
};

test("projection catalog keeps providers independently queryable", () => {
  const catalog = new ProjectionCatalog();
  catalog.add(base);
  catalog.add({ ...base, source: "espn", players: [{ providerPlayerId: "123", projection: 16.4 }] });

  assert.equal(catalog.list({ season: 2026, week: 1, scoringFormat: base.scoringFormat }).length, 2);
  assert.equal(catalog.get({ source: "candidate-consensus", season: 2026, week: 1, scoringFormat: base.scoringFormat }).players[0].projection, 17.2);
});

test("projection sets require scoring and capture metadata", () => {
  assert.throws(() => validateProjectionSet({ ...base, scoringFormat: "" }), /scoring format is required/i);
  assert.throws(() => validateProjectionSet({ ...base, fetchedAt: "" }), /fetched time is required/i);
});

test("projection sets reject invented or ambiguous values", () => {
  assert.throws(() => validateProjectionSet({ ...base, players: [{ providerPlayerId: "abc", projection: -1 }] }), /non-negative/);
  assert.throws(() => validateProjectionSet({ ...base, players: [{ providerPlayerId: "abc", projection: 1 }, { providerPlayerId: "abc", projection: 2 }] }), /Duplicate/);
  assert.equal(validateProjectionSet({ ...base, players: [{ providerPlayerId: "abc" }] }).players[0].projection, null);
});

