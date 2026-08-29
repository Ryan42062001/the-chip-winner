import test from "node:test";
import assert from "node:assert/strict";
import { normalizePlanningWeeks, PlanningPreferences } from "../src/application/planning-preferences.js";

function memoryStorage() { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; }

test("planning preferences distinguish no saved choice from an empty horizon", () => {
  const preferences = new PlanningPreferences({ storage: memoryStorage() });
  assert.equal(preferences.read(), null); preferences.save([]); assert.deepEqual(preferences.read(), []);
});

test("planning preferences persist sorted unique NFL weeks", () => {
  const preferences = new PlanningPreferences({ storage: memoryStorage() });
  assert.deepEqual(preferences.save([17, 15, 16]), [15, 16, 17]);
  assert.deepEqual(preferences.read(), [15, 16, 17]);
});

test("planning preferences reject duplicate and out-of-range weeks", () => {
  assert.throws(() => normalizePlanningWeeks([15, 15]), /unique/);
  assert.throws(() => normalizePlanningWeeks([19]), /1 through 18/);
});

test("playoff preferences are scoped by ESPN league and season and clear together", () => {
  const preferences = new PlanningPreferences({ storage: memoryStorage() });
  preferences.savePlayoff("10", 2026, [17, 15, 16]); preferences.savePlayoff("10", 2027, [16, 17]);
  assert.deepEqual(preferences.readPlayoff("10", 2026), [15, 16, 17]);
  assert.deepEqual(preferences.readPlayoff("10", 2027), [16, 17]);
  assert.equal(preferences.readPlayoff("11", 2026), null);
  preferences.clear(); assert.equal(preferences.readPlayoff("10", 2026), null);
});
