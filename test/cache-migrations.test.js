import test from "node:test";
import assert from "node:assert/strict";
import { CURRENT_STORAGE_VERSION, runCacheMigrations, STORAGE_VERSION_KEY } from "../src/application/cache-migrations.js";
import { ESPN_CONNECTION_CACHE_KEY, ESPN_CONNECTION_PROFILES_KEY } from "../src/providers/espn/connection-preferences.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("cache migration preserves a legacy active ESPN connection as a profile", () => {
  const connection = { leagueId: "118749183", seasonId: "2026", teamId: "2" };
  const storage = memoryStorage({ [ESPN_CONNECTION_CACHE_KEY]: JSON.stringify(connection) });

  assert.deepEqual(runCacheMigrations(storage), { status: "migrated", from: 0, to: CURRENT_STORAGE_VERSION });
  assert.deepEqual(JSON.parse(storage.getItem(ESPN_CONNECTION_PROFILES_KEY)), [connection]);
  assert.equal(storage.getItem(STORAGE_VERSION_KEY), String(CURRENT_STORAGE_VERSION));
  assert.equal(runCacheMigrations(storage).status, "current");
});

test("cache migration does not rewrite storage created by a newer app", () => {
  const storage = memoryStorage({ [STORAGE_VERSION_KEY]: "99" });

  assert.deepEqual(runCacheMigrations(storage), { status: "unsupported", from: 99, to: CURRENT_STORAGE_VERSION });
  assert.equal(storage.getItem(STORAGE_VERSION_KEY), "99");
});
