import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeEspnLeagueResponse, normalizeEspnReceptionScoring } from "../src/providers/espn/espn-normalizer.js";
import { evaluateFutureProjectionCompatibility } from "../src/providers/projections/future-projection-provider.js";

const leagueResponse = JSON.parse(await readFile(new URL("./fixtures/espn-league-response.json", import.meta.url), "utf8"));
const projectionSet = {
  provider: "DynastyProcess",
  scoringFormat: "PPR",
  season: 2026,
  capturedAt: "2026-09-05T12:00:00Z",
  projections: [{ providerPlayerId: "p-1", week: 1, points: 18.4 }]
};

test("ESPN reception scoring is normalized separately from matchup scoring type", () => {
  assert.deepEqual(normalizeEspnReceptionScoring({ scoringItems: [{ statId: 53, points: 1 }] }), { family: "ppr", pointsPerReception: 1 });
  assert.deepEqual(normalizeEspnReceptionScoring({ scoringItems: [{ statId: 53, points: 0.5 }] }), { family: "half-ppr", pointsPerReception: 0.5 });
  assert.deepEqual(normalizeEspnReceptionScoring({ scoringItems: [] }), { family: "standard", pointsPerReception: 0 });
  assert.deepEqual(normalizeEspnReceptionScoring({ scoringItems: [{ statId: 53, points: 0.25 }] }), { family: "custom", pointsPerReception: 0.25 });
  assert.equal(normalizeEspnReceptionScoring({}), null);
});

test("live ESPN H2H_POINTS league retains PPR reception scoring from mSettings", () => {
  const response = structuredClone(leagueResponse);
  response.settings.scoringSettings.scoringItems = [{ statId: 53, points: 1 }];
  const snapshot = normalizeEspnLeagueResponse(response);
  assert.equal(snapshot.league.scoringType, "H2H_POINTS");
  assert.deepEqual(snapshot.league.receptionScoring, { family: "ppr", pointsPerReception: 1 });
});

test("PPR weekly projections are compatible with ESPN H2H_POINTS when reception scoring is PPR", () => {
  const snapshot = { league: { season: 2026, scoringType: "H2H_POINTS", receptionScoring: { family: "ppr", pointsPerReception: 1 } } };
  const result = evaluateFutureProjectionCompatibility(projectionSet, snapshot, { now: Date.parse("2026-09-05T13:00:00Z") });
  assert.equal(result.usable, true);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.errors, []);
});

test("weekly projection compatibility still blocks real reception-scoring mismatches", () => {
  const snapshot = { league: { season: 2026, scoringType: "H2H_POINTS", receptionScoring: { family: "half-ppr", pointsPerReception: 0.5 } } };
  const result = evaluateFutureProjectionCompatibility(projectionSet, snapshot, { now: Date.parse("2026-09-05T13:00:00Z") });
  assert.equal(result.usable, false);
  assert.match(result.errors.join(" "), /does not match ESPN reception scoring half-ppr/);
});

test("H2H_POINTS alone is never mistaken for a reception-scoring family", () => {
  const snapshot = { league: { season: 2026, scoringType: "H2H_POINTS" } };
  const result = evaluateFutureProjectionCompatibility(projectionSet, snapshot, { now: Date.parse("2026-09-05T13:00:00Z") });
  assert.equal(result.usable, false);
  assert.match(result.errors.join(" "), /ESPN reception scoring format is unavailable/);
});
