import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnCapture, normalizeEspnInjury, normalizeEspnLineupSlot, normalizeEspnPosition } from "../src/providers/espn/espn-normalizer.js";

test("ESPN numeric codes map explicitly", () => {
  assert.equal(normalizeEspnLineupSlot(23), "FLEX");
  assert.equal(normalizeEspnPosition(16), "D/ST");
  assert.throws(() => normalizeEspnLineupSlot(99), /Unsupported ESPN lineup slot/);
});

test("unknown injury states remain unknown and retain the source value", () => {
  assert.deepEqual(normalizeEspnInjury("new-status"), { status: "UNKNOWN", detail: null, sourceStatus: "new-status" });
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
