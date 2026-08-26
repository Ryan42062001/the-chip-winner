import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildLineupSuggestions, buildWaiverIdeas, buildWarnings, canFillSlot, compareRosterPlayers } from "../src/domain/recommendations.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("lineup suggestions only recommend eligible higher projections", () => {
  const suggestions = buildLineupSuggestions(sample, "t1");
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].start.name, "James Cook");
  assert.equal(suggestions[0].sit.name, "DeVonta Smith");
  assert.equal(suggestions[0].gain, 2.9);
});

test("flex accepts RB, WR, and TE but not QB", () => {
  assert.equal(canFillSlot({ position: "RB" }, "FLEX"), true);
  assert.equal(canFillSlot({ position: "QB" }, "FLEX"), false);
});

test("warnings reflect only explicit injury and current-week bye data", () => {
  const warnings = buildWarnings(sample, "t1");
  assert.deepEqual(warnings.map((w) => [w.player.name, w.kind]), [
    ["Breece Hall", "injury"],
    ["David Njoku", "injury"]
  ]);
});

test("waiver logic reports unavailable inputs honestly", () => {
  const withoutAvailability = structuredClone(sample);
  delete withoutAvailability.availablePlayers;
  assert.deepEqual(buildWaiverIdeas(withoutAvailability, "t1"), { status: "missing", items: [] });
});

test("lineup logic suppresses marginal projection churn", () => {
  const close = structuredClone(sample);
  close.players.find((player) => player.id === "p11").projection = 15.2;
  assert.equal(buildLineupSuggestions(close, "t1").length, 0);
});

test("waiver ideas do not reuse the same drop candidate", () => {
  const waiverSample = structuredClone(sample);
  waiverSample.players.find((player) => player.id === "p15").projection = 18;
  waiverSample.availablePlayers = ["p15", "p18"];
  const result = buildWaiverIdeas(waiverSample, "t1");
  assert.equal(result.items.length, 2);
  assert.equal(new Set(result.items.map((item) => item.drop.id)).size, result.items.length);
});

test("start sit comparison distinguishes preferences, near ties, and missing projections", () => {
  assert.equal(compareRosterPlayers(sample, "t1", "p1", "p10").preferred.id, "p1");
  assert.equal(compareRosterPlayers(sample, "t1", "p5", "p3").status, "tossup");
  assert.equal(compareRosterPlayers(sample, "t1", "p14", "p12").status, "missing");
  assert.equal(compareRosterPlayers(sample, "t1", "p1", "not-rostered").status, "invalid");
});
