import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildLineupSuggestions, buildWaiverIdeas, buildWarnings, canFillSlot } from "../src/domain/recommendations.js";

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
