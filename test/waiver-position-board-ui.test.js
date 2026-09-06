import test from "node:test";
import assert from "node:assert/strict";
import { renderWaiverPositionBoard } from "../src/ui/waiver-position-board.js";

function board() {
  const baseline = { status: "ready", playerId: "r1", name: "Roster RB", projection: 10 };
  return {
    status: "ready",
    displayLimit: 3,
    signalThreshold: 0.5,
    totalAvailable: 8,
    totalProjected: 7,
    positions: [
      {
        position: "RB",
        projectedAvailable: 3,
        items: [
          { rank: 1, player: { id: "a1", name: "Better Back", projection: 12, availabilityStatus: "FREEAGENT" }, delta: 2, signal: "better", baseline },
          { rank: 2, player: { id: "a2", name: "Similar Back", projection: 10.2, availabilityStatus: "WAIVERS" }, delta: 0.2, signal: "similar", baseline },
          { rank: 3, player: { id: "a3", name: "Lower Back", projection: 8.5, availabilityStatus: "FREEAGENT" }, delta: -1.5, signal: "below", baseline }
        ]
      },
      ...["QB", "WR", "TE", "K", "D/ST"].map((position) => ({ position, projectedAvailable: 0, items: [] }))
    ]
  };
}

test("waiver position board UI explains plus, similar, and minus as browsing context", () => {
  const html = renderWaiverPositionBoard(board(), new Set(["a1"]));
  assert.match(html, /AVAILABLE PLAYER BOARD · ESPN CURRENT WEEK/);
  assert.match(html, /Top 3 by position/);
  assert.match(html, /\+ Better/);
  assert.match(html, /≈ Similar/);
  assert.match(html, /− Below/);
  assert.match(html, /Act now/);
  assert.match(html, /browsing context, not a transaction recommendation/);
  assert.match(html, /full-lineup legal engine below remains authoritative/);
});

test("waiver position board UI exposes projection coverage and availability status", () => {
  const html = renderWaiverPositionBoard(board());
  assert.match(html, /7 of 8 ESPN-available players have a current-week projection/);
  assert.match(html, /FREE AGENT · 12\.0 pts ESPN/);
  assert.match(html, /WAIVERS · 10\.2 pts ESPN/);
});

test("waiver position board UI gives an honest missing-availability state", () => {
  const html = renderWaiverPositionBoard({ status: "missing-availability" });
  assert.match(html, /Availability data missing/);
  assert.match(html, /Refresh ESPN/);
});
