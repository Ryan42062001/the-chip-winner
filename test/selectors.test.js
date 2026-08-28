import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { selectDataCoverage, selectLeagueMatchups, selectLeagueStandings, selectPlayerDetail, selectProjectedTotal, selectSnapshotFreshness, selectTeamContext, selectTeamSchedule } from "../src/domain/selectors.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("team context selects roster and current opponent", () => {
  const context = selectTeamContext(sample, "t1");
  assert.equal(context.team.name, "Gridiron Architects");
  assert.equal(context.opponent.name, "Fourth & Long");
  assert.equal(context.starters.length, 9);
  assert.equal(context.bench.length, 5);
});

test("projected totals retain completeness metadata", () => {
  const context = selectTeamContext(sample, "t1");
  const result = selectProjectedTotal(context.bench, context.index.players);
  assert.equal(result.total, 61.9);
  assert.equal(result.knownCount, 4);
  assert.equal(result.totalCount, 5);
  assert.equal(result.complete, false);
});

test("freshness thresholds distinguish fresh, aging, stale, and unknown", () => {
  const capturedAt = Date.parse(sample.meta.capturedAt);
  assert.equal(selectSnapshotFreshness(sample, capturedAt + 10 * 60_000).status, "fresh");
  assert.equal(selectSnapshotFreshness(sample, capturedAt + 60 * 60_000).status, "aging");
  assert.equal(selectSnapshotFreshness(sample, capturedAt + 24 * 60 * 60_000).status, "stale");
  assert.equal(selectSnapshotFreshness({ meta: {} }).status, "unknown");
});

test("coverage describes known data instead of filling gaps", () => {
  const coverage = selectDataCoverage(sample, "t1");
  assert.equal(coverage.rosterPlayers, 14);
  assert.equal(coverage.projections, 13 / 14);
  assert.equal(coverage.availability, true);
});

test("player detail preserves roster, availability, and source provenance", () => {
  const rostered = selectPlayerDetail(sample, "t1", "p1");
  assert.equal(rostered.rosterEntry.lineupSlot, "QB");
  assert.equal(rostered.source.projections, "sample");
  const available = selectPlayerDetail(sample, "t1", "p15");
  assert.equal(available.isRostered, false);
  assert.equal(available.isAvailable, true);
  assert.equal(selectPlayerDetail(sample, "t1", "missing"), null);
});

test("league standings sort reported records without claiming official seeding", () => {
  const result = selectLeagueStandings({ teams: [{ id: "a", name: "A", record: { wins: null, losses: null }, pointsFor: null }, { id: "b", name: "B", record: { wins: 4, losses: 1 }, pointsFor: 500 }, { id: "c", name: "C", record: { wins: 5, losses: 0 }, pointsFor: 400 }] });
  assert.deepEqual(result.teams.map((team) => team.id), ["c", "b", "a"]);
  assert.match(result.methodology, /not official ESPN playoff seeding/);
});

test("league matchup selector returns only the requested reported week", () => {
  const snapshot = { matchups: [...sample.matchups, { week: 7, homeTeamId: "t2", awayTeamId: "t1", homeScore: null, awayScore: null, status: "upcoming" }] };
  assert.equal(selectLeagueMatchups(snapshot, 7).length, 1);
  assert.equal(selectLeagueMatchups(snapshot, 6)[0].status, "pre");
  assert.deepEqual(selectLeagueMatchups(snapshot, null), []);
});

test("team schedule reports ESPN matchups and missing horizon weeks without inferring strength", () => {
  const snapshot = { ...sample, matchups: [...sample.matchups, { week: 7, homeTeamId: "t2", awayTeamId: "t1", homeScore: null, awayScore: null, status: "upcoming" }] };
  const result = selectTeamSchedule(snapshot, "t1", [6, 7, 8]);
  assert.deepEqual(result.rows.map((row) => [row.week, row.opponentId, row.homeAway]), [[6, "t2", "home"], [7, "t2", "away"]]);
  assert.deepEqual(result.coverage, { requestedWeeks: 3, reportedWeeks: 2, missingWeeks: [8], ambiguousWeeks: [] });
  assert.equal(result.rows[1].teamScore, null);
  assert.match(result.methodology, /No opponent strength or win probability is inferred/);
});

test("team schedule preserves duplicate week records as ambiguous source data", () => {
  const duplicate = { week: 6, homeTeamId: "t1", awayTeamId: "t2", homeScore: null, awayScore: null, status: "upcoming" };
  const result = selectTeamSchedule({ ...sample, matchups: [...sample.matchups, duplicate] }, "t1", [6]);
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.coverage.ambiguousWeeks, [6]);
  assert.equal(selectTeamSchedule(sample, "missing", [6]).status, "missing-team");
});
