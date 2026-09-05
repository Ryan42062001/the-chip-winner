import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import { diffLineupRecommendations, diffWaiverRecommendations } from "../src/domain/recommendation-change.js";

function waiverSnapshot(capturedAt = "2026-09-04T12:00:00.000Z") {
  return {
    meta: { capturedAt },
    currentWeek: 1,
    league: { id: "league", waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 } },
    teams: [{ id: "mine", acquisition: { waiverRank: null, seasonAcquisitions: null, matchupAcquisitions: null, budgetSpent: null } }],
    players: [
      { id: "qb", name: "Quarterback", position: "QB", projection: 20 },
      { id: "rb", name: "Starter Back", position: "RB", projection: 10 },
      { id: "bench-qb", name: "Bench Quarterback", position: "QB", projection: 8 },
      { id: "bench-rb", name: "Bench Back", position: "RB", projection: 6 },
      { id: "add-wr", name: "Available Receiver", position: "WR", projection: 16 },
      { id: "add-rb", name: "Available Back", position: "RB", projection: 14 }
    ],
    rosters: [{ teamId: "mine", entries: [
      { playerId: "qb", lineupSlot: "QB" }, { playerId: "rb", lineupSlot: "FLEX" },
      { playerId: "bench-qb", lineupSlot: "BE" }, { playerId: "bench-rb", lineupSlot: "BE" }
    ] }],
    availablePlayers: ["add-wr", "add-rb"]
  };
}

test("recommendation changes explain when a prior lineup suggestion clears", () => {
  const current = structuredClone(snapshot); current.players.find((player) => player.id === "p11").projection = 10;
  const changes = diffLineupRecommendations(snapshot, current, "t1");
  assert.equal(changes.some((item) => item.change === "cleared"), true);
  assert.match(changes.find((item) => item.change === "cleared").detail, /no longer/);
});

test("identical snapshots do not create recommendation changes", () => {
  assert.equal(diffLineupRecommendations(snapshot, structuredClone(snapshot), "t1").length, 0);
});

test("waiver recommendation changes stay silent when the latest snapshot revalidates the move", () => {
  const previous = waiverSnapshot();
  const current = structuredClone(previous); current.meta.capturedAt = "2026-09-04T13:00:00.000Z";
  assert.equal(diffWaiverRecommendations(previous, current, "mine").length, 0);
});

test("What Changed recommendation output surfaces a prior waiver move made obsolete by ESPN availability", () => {
  const previous = waiverSnapshot();
  const current = structuredClone(previous); current.meta.capturedAt = "2026-09-04T13:00:00.000Z"; current.availablePlayers = ["add-rb"];
  const changes = diffLineupRecommendations(previous, current, "mine");
  const obsolete = changes.find((item) => item.kind === "waiver-recommendation" && item.change === "obsolete");
  assert.ok(obsolete);
  assert.equal(obsolete.playerId, "add-wr");
  assert.match(obsolete.title, /Prior waiver move obsolete/);
  assert.match(obsolete.detail, /ESPN no longer reports Available Receiver available/);
});
