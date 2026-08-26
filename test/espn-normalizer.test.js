import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeEspnCapture, normalizeEspnInjury, normalizeEspnLeagueResponse, normalizeEspnLineupSlot, normalizeEspnPosition } from "../src/providers/espn/espn-normalizer.js";

const leagueResponse = JSON.parse(await readFile(new URL("./fixtures/espn-league-response.json", import.meta.url), "utf8"));

test("ESPN numeric codes map explicitly", () => {
  assert.equal(normalizeEspnLineupSlot(23), "FLEX");
  assert.equal(normalizeEspnPosition(16), "D/ST");
  assert.throws(() => normalizeEspnLineupSlot(99), /Unsupported ESPN lineup slot/);
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
  assert.equal(snapshot.league.waiver.budget, 100);
});
