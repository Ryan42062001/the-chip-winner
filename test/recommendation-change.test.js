import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import { diffLineupRecommendations } from "../src/domain/recommendation-change.js";

test("recommendation changes explain when a prior lineup suggestion clears", () => {
  const current = structuredClone(snapshot); current.players.find((player) => player.id === "p11").projection = 10;
  const changes = diffLineupRecommendations(snapshot, current, "t1");
  assert.equal(changes.some((item) => item.change === "cleared"), true);
  assert.match(changes.find((item) => item.change === "cleared").detail, /no longer/);
});

test("identical snapshots do not create recommendation changes", () => {
  assert.equal(diffLineupRecommendations(snapshot, structuredClone(snapshot), "t1").length, 0);
});
