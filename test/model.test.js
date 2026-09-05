import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateLeagueSnapshot } from "../src/domain/model.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("sample snapshot satisfies the normalized league contract", () => {
  assert.deepEqual(validateLeagueSnapshot(sample), []);
});

test("validation reports references to players that do not exist", () => {
  const invalid = structuredClone(sample);
  invalid.rosters[0].entries.push({ playerId: "missing-player", lineupSlot: "BE" });
  assert.match(validateLeagueSnapshot(invalid).join(" "), /unknown player missing-player/);
});

test("validation requires an explicit schema version", () => {
  const invalid = structuredClone(sample);
  delete invalid.schemaVersion;
  assert.match(validateLeagueSnapshot(invalid).join(" "), /schemaVersion/);
});

test("validation rejects malformed optional ESPN acquisition facts without coercion", () => {
  const invalid = structuredClone(sample);
  invalid.league.waiver = { acquisitionLimit: "5", matchupAcquisitionLimit: -2, acquisitionType: 7, usesAcquisitionBudget: "false", waiverOrderReset: 1, waiverProcessDays: null, budget: null };
  invalid.teams[0].acquisition = { waiverRank: 0, seasonAcquisitions: "3", matchupAcquisitions: null, budgetSpent: -1 };
  const errors = validateLeagueSnapshot(invalid).join(" ");
  assert.match(errors, /acquisitionLimit/);
  assert.match(errors, /matchupAcquisitionLimit/);
  assert.match(errors, /acquisitionType/);
  assert.match(errors, /usesAcquisitionBudget/);
  assert.match(errors, /waiverOrderReset/);
  assert.match(errors, /waiverRank/);
  assert.match(errors, /seasonAcquisitions/);
  assert.match(errors, /budgetSpent/);
});
