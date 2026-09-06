import test from "node:test";
import assert from "node:assert/strict";
import { buildWaiverPositionBoard } from "../src/domain/waiver-position-board.js";

function player(id, name, position, projection, availabilityStatus = "FREEAGENT") {
  return { id, name, position, projection, availabilityStatus };
}

function snapshot() {
  return {
    players: [
      player("rq1", "Roster QB One", "QB", 18),
      player("rq2", "Roster QB Two", "QB", 15),
      player("rr1", "Roster RB", "RB", 12),
      player("ir1", "IR RB", "RB", 5),
      player("qa", "Available QB A", "QB", 19),
      player("qb", "Available QB B", "QB", 16),
      player("qc", "Available QB C", "QB", 14),
      player("qd", "Available QB D", "QB", 13),
      player("qe", "Available QB No Projection", "QB", null),
      player("ra", "Available RB", "RB", 10),
      player("ta", "Available TE", "TE", 8, "WAIVERS")
    ],
    availablePlayers: ["qa", "qb", "qc", "qd", "qe", "ra", "ta", "qa"],
    rosters: [{
      teamId: "t1",
      entries: [
        { playerId: "rq1", lineupSlot: "QB" },
        { playerId: "rq2", lineupSlot: "BE" },
        { playerId: "rr1", lineupSlot: "RB" },
        { playerId: "ir1", lineupSlot: "IR" }
      ]
    }]
  };
}

test("waiver position board ranks the top three projected ESPN-available players per position", () => {
  const board = buildWaiverPositionBoard(snapshot(), "t1");
  assert.equal(board.status, "ready");
  assert.equal(board.displayLimit, 3);
  const qb = board.positions.find((item) => item.position === "QB");
  assert.equal(qb.totalAvailable, 5);
  assert.equal(qb.projectedAvailable, 4);
  assert.deepEqual(qb.items.map((item) => item.player.id), ["qa", "qb", "qc"]);
  assert.deepEqual(qb.items.map((item) => item.signal), ["better", "better", "below"]);
  assert.deepEqual(qb.items.map((item) => item.delta), [4, 1, -1]);
});

test("waiver position board excludes current IR occupants from the same-position roster baseline", () => {
  const board = buildWaiverPositionBoard(snapshot(), "t1");
  const rb = board.positions.find((item) => item.position === "RB");
  assert.equal(rb.baseline.playerId, "rr1");
  assert.equal(rb.baseline.projection, 12);
  assert.equal(rb.items[0].delta, -2);
  assert.equal(rb.items[0].signal, "below");
});

test("waiver position board stays explicit when no projected same-position roster baseline exists", () => {
  const board = buildWaiverPositionBoard(snapshot(), "t1");
  const te = board.positions.find((item) => item.position === "TE");
  assert.equal(te.baseline.status, "unavailable");
  assert.equal(te.items[0].signal, "unknown");
  assert.equal(te.items[0].delta, null);
});

test("waiver position board fails closed when ESPN availability or the selected roster is missing", () => {
  const missingAvailability = snapshot();
  delete missingAvailability.availablePlayers;
  assert.equal(buildWaiverPositionBoard(missingAvailability, "t1").status, "missing-availability");
  assert.equal(buildWaiverPositionBoard(snapshot(), "missing").status, "missing-roster");
});
