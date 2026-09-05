import test from "node:test";
import assert from "node:assert/strict";
import { compareVersions, EspnRefreshCooldown, evaluateCompanionPing, REFRESH_HISTORY_KEY } from "../src/providers/espn/connection-health.js";

test("companion versions compare numerically", () => {
  assert.equal(compareVersions("0.2.10", "0.2.9"), 1);
  assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
  assert.equal(compareVersions("invalid", "1.0.0"), null);
});

test("companion health rejects missing and outdated versions", () => {
  assert.equal(evaluateCompanionPing({ version: "0.2.1" }).status, "incompatible");
  assert.equal(evaluateCompanionPing({ version: "0.2.2" }).status, "ready");
  assert.equal(evaluateCompanionPing({}).status, "incompatible");
});

test("ESPN refresh cooldown is scoped and expires", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  let currentTime = 1_000; const cooldown = new EspnRefreshCooldown({ storage, now: () => currentTime, cooldownMs: 15_000 });
  cooldown.mark("league-a"); assert.equal(cooldown.remainingMs("league-a"), 15_000); assert.equal(cooldown.remainingMs("league-b"), 0);
  currentTime += 15_001; assert.equal(cooldown.remainingMs("league-a"), 0); cooldown.clear(); assert.equal(storage.getItem(REFRESH_HISTORY_KEY), null);
});
