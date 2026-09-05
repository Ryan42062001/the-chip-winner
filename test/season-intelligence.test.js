import test from "node:test";
import assert from "node:assert/strict";
import { buildByeWeekCoverage, buildPlayoffProjectionOutlook, buildScheduleStrengthOutlook, buildSeasonPlayoffIntelligence } from "../src/domain/season-intelligence.js";

function baseSnapshot() {
  return {
    currentWeek: 5,
    league: { lineupSlots: [{ slot: "RB", count: 1 }, { slot: "FLEX", count: 1 }] },
    teams: [{ id: "mine", name: "Mine" }, { id: "opp", name: "Opponent" }],
    players: [
      { id: "a", name: "Alpha", position: "RB", proTeam: "AAA", byeWeek: 7 },
      { id: "b", name: "Beta", position: "WR", proTeam: "BBB", byeWeek: 9 },
      { id: "c", name: "Gamma", position: "RB", proTeam: "CCC", byeWeek: 10 }
    ],
    rosters: [{ teamId: "mine", entries: [{ playerId: "a", lineupSlot: "RB" }, { playerId: "b", lineupSlot: "FLEX" }, { playerId: "c", lineupSlot: "BE" }] }],
    matchups: []
  };
}

test("bye coverage proves a known starter bye is covered by current roster eligibility", () => {
  const coverage = buildByeWeekCoverage(baseSnapshot(), "mine");
  const week7 = coverage.weeks.find((row) => row.week === 7);
  assert.equal(week7.status, "covered");
  assert.deepEqual(week7.affectedStarterPlayerIds, ["a"]);
  assert.equal(week7.uncoveredSlotCount, 0);
  assert.deepEqual(week7.uncoveredSlotCandidates, []);
});

test("bye coverage exposes every uncovered starter week and never invents replacement depth", () => {
  const snapshot = baseSnapshot();
  snapshot.rosters[0].entries = snapshot.rosters[0].entries.filter((entry) => entry.playerId !== "c");
  const coverage = buildByeWeekCoverage(snapshot, "mine");
  const week7 = coverage.weeks.find((row) => row.week === 7);
  const week9 = coverage.weeks.find((row) => row.week === 9);
  assert.equal(coverage.status, "gap");
  assert.deepEqual(coverage.gapWeeks, [7, 9]);
  assert.equal(week7.uncoveredSlotCount, 1);
  assert.deepEqual(week7.uncoveredSlotCandidates, ["RB"]);
  assert.equal(week9.uncoveredSlotCount, 1);
});

test("bye coverage exposes ambiguous legal slot assignment instead of pretending one slot is uniquely uncovered", () => {
  const snapshot = baseSnapshot();
  snapshot.rosters[0].entries = snapshot.rosters[0].entries.filter((entry) => entry.playerId !== "c");
  const coverage = buildByeWeekCoverage(snapshot, "mine");
  const week9 = coverage.weeks.find((row) => row.week === 9);
  assert.equal(week9.uncoveredSlotCount, 1);
  assert.deepEqual(week9.uncoveredSlotCandidates, ["FLEX", "RB"]);
  assert.match(coverage.methodology, /multiple equally valid slot assignments/);
});

test("unknown bye weeks keep otherwise fillable coverage partial", () => {
  const snapshot = baseSnapshot();
  snapshot.players.push({ id: "d", name: "Delta", position: "TE", proTeam: "DDD", byeWeek: null });
  snapshot.rosters[0].entries.push({ playerId: "d", lineupSlot: "BE" });
  const coverage = buildByeWeekCoverage(snapshot, "mine");
  assert.equal(coverage.status, "partial");
  assert.deepEqual(coverage.unknownByePlayerIds, ["d"]);
  assert.equal(coverage.weeks.find((row) => row.week === 7).status, "partial");
});

test("playoff projection aggregates are withheld when any configured week is incomplete", () => {
  const snapshot = baseSnapshot();
  const plan = { weeklyBaseline: [
    { week: 15, completeCoverage: true, projectedTotal: 100, starters: [{ playerId: "a", slot: "RB", points: 20 }, { playerId: "b", slot: "FLEX", points: 18 }], mappedProjectionCount: 3, rosterPlayerCount: 3, unmappedPlayerIds: [], missingProjectionPlayerIds: [] },
    { week: 16, completeCoverage: false, projectedTotal: 105, starters: [], mappedProjectionCount: 2, rosterPlayerCount: 3, unmappedPlayerIds: [], missingProjectionPlayerIds: ["c"] }
  ], source: { provider: "dynastyprocess" } };
  const outlook = buildPlayoffProjectionOutlook(snapshot, "mine", [15, 16], plan);
  assert.equal(outlook.status, "partial");
  assert.equal(outlook.aggregate, null);
  assert.deepEqual(outlook.blockedWeeks, [16]);
  assert.equal(outlook.rows[1].projectedTotal, null);
});

test("complete playoff projection window reports only fully covered aggregate facts", () => {
  const snapshot = baseSnapshot();
  const plan = { weeklyBaseline: [
    { week: 15, completeCoverage: true, projectedTotal: 100, starters: [{ playerId: "a", slot: "RB", points: 20 }, { playerId: "b", slot: "FLEX", points: 18 }], mappedProjectionCount: 3, rosterPlayerCount: 3, unmappedPlayerIds: [], missingProjectionPlayerIds: [] },
    { week: 16, completeCoverage: true, projectedTotal: 110, starters: [{ playerId: "a", slot: "RB", points: 21 }, { playerId: "c", slot: "FLEX", points: 19 }], mappedProjectionCount: 3, rosterPlayerCount: 3, unmappedPlayerIds: [], missingProjectionPlayerIds: [] }
  ], source: { provider: "dynastyprocess" } };
  const outlook = buildPlayoffProjectionOutlook(snapshot, "mine", [16, 15, 15], plan);
  assert.equal(outlook.status, "ready");
  assert.deepEqual(outlook.weeks, [15, 16]);
  assert.equal(outlook.aggregate.horizonTotal, 210);
  assert.equal(outlook.aggregate.average, 105);
  assert.deepEqual(outlook.aggregate.lowestWeek, { week: 15, projectedTotal: 100 });
  assert.deepEqual(outlook.aggregate.highestWeek, { week: 16, projectedTotal: 110 });
  assert.deepEqual(outlook.aggregate.stableStarterIds, ["a"]);
  assert.equal(outlook.aggregate.starterTurnover, 1);
});

test("schedule strength remains a separate explicit FantasyPros overlay with missing stars preserved", () => {
  const snapshot = baseSnapshot();
  const outlook = buildScheduleStrengthOutlook(snapshot, "mine", { byPlayerId: {
    a: { seasonScheduleStrength: 4, playoffScheduleStrength: 5 },
    b: { seasonScheduleStrength: 3, playoffScheduleStrength: 2 }
  } });
  assert.equal(outlook.status, "partial");
  assert.equal(outlook.ratedRosterPlayers, 2);
  assert.deepEqual(outlook.starterSummary, { favorable: 1, neutral: 0, difficult: 1, rated: 2, total: 2 });
  assert.equal(outlook.items.find((item) => item.playerId === "c").playoffStars, null);
  assert.match(outlook.methodology, /does not encode the exact week range/);
});

test("season intelligence uses configured playoff weeks for ESPN fantasy opponent coverage without inventing missing matchups", () => {
  const snapshot = baseSnapshot();
  snapshot.matchups = [{ week: 15, homeTeamId: "mine", awayTeamId: "opp", homeScore: null, awayScore: null, status: "upcoming" }];
  const intelligence = buildSeasonPlayoffIntelligence(snapshot, "mine", { playoffWeeks: [15, 16] });
  assert.equal(intelligence.playoffBoundarySource, "local");
  assert.equal(intelligence.fantasyPlayoffSchedule.coverage.status, "partial");
  assert.deepEqual(intelligence.fantasyPlayoffSchedule.coverage.missingWeeks, [16]);
  assert.equal(intelligence.playoffProjection.aggregate, null);
});
