import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeEspnCapture, normalizeEspnInjury, normalizeEspnLeagueResponse, normalizeEspnLineupSlot, normalizeEspnPosition } from "../src/providers/espn/espn-normalizer.js";

const leagueResponse = JSON.parse(await readFile(new URL("./fixtures/espn-league-response.json", import.meta.url), "utf8"));
const readFixture = async (name) => JSON.parse(await readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const [superflexResponse, offseasonResponse, playoffResponse, partialResponse] = await Promise.all([
  readFixture("espn-superflex-response.json"),
  readFixture("espn-offseason-response.json"),
  readFixture("espn-playoff-final-response.json"),
  readFixture("espn-partial-live-response.json"),
]);

test("ESPN numeric codes map explicitly", () => {
  assert.equal(normalizeEspnLineupSlot(23), "FLEX");
  assert.equal(normalizeEspnPosition(16), "D/ST");
  assert.throws(() => normalizeEspnLineupSlot(99), /Unsupported ESPN lineup slot/);
});

test("ESPN offensive-player slot maps to OP", () => {
  assert.equal(normalizeEspnLineupSlot(7), "OP");
});

test("unknown injury states remain unknown and retain the source value", () => {
  assert.deepEqual(normalizeEspnInjury("new-status"), { status: "UNKNOWN", detail: null, sourceStatus: "new-status" });
  assert.deepEqual(normalizeEspnInjury("NORMAL"), { status: "ACTIVE", detail: null });
});

test("capture normalization creates a valid versioned snapshot", () => {
  const snapshot = normalizeEspnCapture({
    meta: { capturedAt: "2026-10-10T12:00:00Z", projectionsSource: "espn" },
    league: { id: 10, name: "Test League", season: 2026 },
    currentWeek: 6,
    teams: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
    players: [{ id: 100, name: "Player One", positionId: 1, projection: null, injuryStatus: "ACTIVE" }],
    rosters: [{ teamId: 1, entries: [{ playerId: 100, lineupSlotId: 0 }] }, { teamId: 2, entries: [] }],
    matchups: [{ week: 6, homeTeamId: 1, awayTeamId: 2 }]
  });
  assert.equal(snapshot.league.id, "10");
  assert.equal(snapshot.players[0].position, "QB");
  assert.equal(snapshot.players[0].projection, null);
  assert.equal(snapshot.rosters[0].entries[0].lineupSlot, "QB");
});

test("real response shape normalizes teams, rosters, matchup, and explicit projection", () => {
  const response = structuredClone(leagueResponse);
  response.teams[0].roster.entries[0].playerPoolEntry.player.proTeamId = 24;
  const snapshot = normalizeEspnLeagueResponse(response, { capturedAt: "2026-08-26T20:00:00Z", views: ["mTeam", "mRoster"] }, {
    availablePlayers: [{ status: "WAIVERS", player: { id: 202, fullName: "Available Receiver", defaultPositionId: 3, proTeamId: 21, injuryStatus: "NORMAL", stats: [] } }],
    nflScoreboard: { events: [{ date: "2026-09-10T00:20:00Z", competitions: [{ competitors: [{ team: { id: "24", abbreviation: "LAC" } }, { team: { id: "12", abbreviation: "KC" } }] }] }] }
  });
  assert.equal(snapshot.league.id, "118749183");
  assert.equal(snapshot.teams[0].name, "Chip Winners");
  assert.equal(snapshot.rosters[0].entries[0].lineupSlot, "QB");
  assert.equal(snapshot.players[0].projection, 20.5);
  assert.equal(snapshot.players[0].proTeam, "LAC");
  assert.equal(snapshot.players[0].opponent, "KC");
  assert.equal(snapshot.players[0].gameTime, "2026-09-10T00:20:00Z");
  assert.equal(snapshot.players[0].seasonAverage, null);
  assert.deepEqual(snapshot.availablePlayers, ["202"]);
  assert.equal(snapshot.players.find((player) => player.id === "202").injury.status, "ACTIVE");
  assert.equal(snapshot.players.find((player) => player.id === "202").availabilityStatus, "WAIVERS");
  assert.equal(snapshot.matchups[0].homeTeamId, "2");
  assert.equal(snapshot.meta.kind, "live-companion");
  assert.deepEqual(snapshot.league.lineupSlots.find((item) => item.slot === "QB"), { slot: "QB", count: 1, espnSlotId: 0 });
  assert.equal(snapshot.league.rosterRules.size, 10);
  assert.deepEqual(snapshot.league.rosterRules.positionLimits.find((item) => item.position === "QB"), { position: "QB", limit: 3, espnPositionId: 1 });
  assert.equal(snapshot.league.waiver.budget, 100);
  assert.equal(snapshot.league.waiver.matchupAcquisitionLimit, 3);
  assert.deepEqual(snapshot.teams[0].acquisition, { waiverRank: 2, seasonAcquisitions: 3, matchupAcquisitions: 1, budgetSpent: 17 });
});

test("superflex league fixture preserves OP slots and its reported scoring type", () => {
  const snapshot = normalizeEspnLeagueResponse(superflexResponse);
  assert.equal(snapshot.rosters[0].entries[0].lineupSlot, "OP");
  assert.equal(snapshot.league.scoringType, "H2H_POINTS_HALF");
  assert.equal(snapshot.matchups[0].status, "current");
});

test("ESPN normalization retains reported future matchups without borrowing current scores", () => {
  const snapshot = normalizeEspnLeagueResponse(superflexResponse);
  assert.equal(snapshot.matchups.length, 2);
  assert.deepEqual(snapshot.matchups[1], { week: 7, homeTeamId: "2", awayTeamId: "1", homeScore: null, awayScore: null, status: "upcoming" });
});

test("offseason fixture preserves empty state and missing records", () => {
  const snapshot = normalizeEspnLeagueResponse(offseasonResponse);
  assert.equal(snapshot.currentWeek, 0);
  assert.equal(snapshot.matchups.length, 0);
  assert.deepEqual(snapshot.teams[0].record, { wins: null, losses: null, ties: null });
});

test("completed playoff fixture reports a final matchup without inventing a projection", () => {
  const snapshot = normalizeEspnLeagueResponse(playoffResponse);
  assert.equal(snapshot.matchups[0].status, "final");
  assert.equal(snapshot.matchups[0].homeScore, 121.4);
  assert.equal(snapshot.players[0].projection, null);
  assert.deepEqual(snapshot.league.playoffWeeks, [15, 16, 17]);
});

test("ESPN playoff weeks reject malformed explicit settings and remain absent when unreported", () => {
  const malformed = structuredClone(playoffResponse); malformed.settings.scheduleSettings.playoffWeeks = [15, 15];
  assert.throws(() => normalizeEspnLeagueResponse(malformed), /playoffWeeks/);
  assert.equal(normalizeEspnLeagueResponse(leagueResponse).league.playoffWeeks, undefined);
});

test("ESPN roster rules reject unknown explicit position-limit IDs", () => {
  const malformed = structuredClone(leagueResponse); malformed.settings.rosterSettings.positionLimits[99] = 2;
  assert.throws(() => normalizeEspnLeagueResponse(malformed), /position limit id 99/);
});

test("partial live fixture retains unknown injury state and missing NFL context", () => {
  const snapshot = normalizeEspnLeagueResponse(partialResponse);
  assert.deepEqual(snapshot.players[0].injury, { status: "UNKNOWN", detail: null, sourceStatus: "PRESEASON_RECOVERY" });
  assert.equal(snapshot.players[0].opponent, null);
  assert.equal(snapshot.players[0].gameTime, null);
  assert.equal(snapshot.players[0].projection, null);
});
