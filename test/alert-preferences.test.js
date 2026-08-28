import test from "node:test";
import assert from "node:assert/strict";
import { AlertPreferences, alertId } from "../src/domain/alert-preferences.js";

test("alert dismissals persist and remain scoped to week player and kind", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const preferences = new AlertPreferences({ storage }); const warning = { kind: "injury", player: { id: "p1" } }; const id = alertId(warning, 3);
  preferences.dismiss(id);
  assert.equal(preferences.read().has(id), true); assert.notEqual(alertId(warning, 4), id);
  preferences.restoreAll(); assert.equal(preferences.read().size, 0);
});
