import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ESPN_CONNECTION, EspnConnectionPreferences, connectionKey } from "../src/providers/espn/connection-preferences.js";

test("ESPN connection settings validate and persist locally", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; const preferences = new EspnConnectionPreferences({ storage });
  preferences.save({ leagueId: 123, seasonId: 2026, teamId: 4 }); assert.deepEqual(preferences.read(), { leagueId: "123", seasonId: "2026", teamId: "4" });
});

test("multiple ESPN connection profiles can be saved and activated", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; const preferences = new EspnConnectionPreferences({ storage });
  const first = preferences.save({ leagueId: 1, seasonId: 2026, teamId: 2 }); const second = preferences.save({ leagueId: 3, seasonId: 2026, teamId: 4 });
  assert.equal(preferences.list().length, 2); assert.deepEqual(preferences.activate(connectionKey(first)), first); assert.deepEqual(preferences.read(), first); preferences.remove(connectionKey(second)); assert.equal(preferences.list().length, 1);
});

test("new installations have no hard-coded ESPN league and invalid settings are rejected", () => {
  const preferences = new EspnConnectionPreferences({ storage: null }); assert.deepEqual(preferences.read(), DEFAULT_ESPN_CONNECTION); assert.deepEqual(DEFAULT_ESPN_CONNECTION, { leagueId: "", seasonId: "", teamId: "" }); assert.throws(() => preferences.save({ leagueId: "abc", seasonId: "26", teamId: "" }), /League ID/);
});
