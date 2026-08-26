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
