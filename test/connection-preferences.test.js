import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ESPN_CONNECTION, EspnConnectionPreferences } from "../src/providers/espn/connection-preferences.js";

test("ESPN connection settings validate and persist locally", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; const preferences = new EspnConnectionPreferences({ storage });
  preferences.save({ leagueId: 123, seasonId: 2026, teamId: 4 }); assert.deepEqual(preferences.read(), { leagueId: "123", seasonId: "2026", teamId: "4" });
});

test("invalid ESPN connection settings are rejected and defaults remain available", () => {
  const preferences = new EspnConnectionPreferences({ storage: null }); assert.deepEqual(preferences.read(), DEFAULT_ESPN_CONNECTION); assert.throws(() => preferences.save({ leagueId: "abc", seasonId: "26", teamId: "" }), /League ID/);
});
