import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import { buildModelContext } from "../src/domain/model-context.js";

test("model context includes only selected team context and normalized fields", () => {
  const result = buildModelContext(snapshot, snapshot.teams[0].id);
  assert.equal(result.status, "ready");
  assert.equal(result.packet.selectedTeam.id, snapshot.teams[0].id);
  assert.equal(result.packet.roster.length, snapshot.rosters[0].entries.length);
  assert.equal("availablePlayers" in result.packet, false);
  assert.equal(JSON.stringify(result.packet).includes("cookie"), false);
});

test("model context excludes recommendations that fail the evaluator", () => {
  const invalid = { id: "bad", kind: "waiver", status: "review", confidence: "low", inputs: ["ESPN"], limitations: ["test"], payload: { addPlayerId: "invented" } };
  const result = buildModelContext(snapshot, snapshot.teams[0].id, [invalid]);
  assert.equal(result.status, "partial");
  assert.equal(result.packet.recommendations.length, 0);
});
