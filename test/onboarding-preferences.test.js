import test from "node:test";
import assert from "node:assert/strict";
import { OnboardingPreferences } from "../src/application/onboarding-preferences.js";

function memoryStorage() { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; }

test("onboarding is incomplete until the user chooses a path", () => {
  const preferences = new OnboardingPreferences({ storage: memoryStorage() }); assert.equal(preferences.read(), null);
});

test("onboarding remembers connection and sample choices locally", () => {
  const preferences = new OnboardingPreferences({ storage: memoryStorage() }); preferences.complete("sample"); assert.deepEqual(preferences.read(), { mode: "sample" }); preferences.complete("connection"); assert.deepEqual(preferences.read(), { mode: "connection" });
});

test("onboarding rejects unknown completion modes and can be cleared", () => {
  const storage = memoryStorage(); const preferences = new OnboardingPreferences({ storage }); assert.throws(() => preferences.complete("skip"), /connection or sample/); preferences.complete("sample"); preferences.clear(); assert.equal(preferences.read(), null);
});
