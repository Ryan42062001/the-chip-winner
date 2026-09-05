import test from "node:test";
import assert from "node:assert/strict";
import { LocalDataManager } from "../src/application/local-data-manager.js";

test("local data manager clears every registered cache and extra key", () => {
  const cleared = [];
  const removed = [];
  const manager = new LocalDataManager({
    providers: [{ clearCache: () => cleared.push("a") }, { clearCache: () => cleared.push("b") }],
    storage: { removeItem: (key) => removed.push(key) },
    extraKeys: ["sync"]
  });
  manager.clearAll();
  assert.deepEqual(cleared, ["a", "b"]);
  assert.deepEqual(removed, ["chip-winner:weekly-projection-updates:v1", "sync"]);
});
