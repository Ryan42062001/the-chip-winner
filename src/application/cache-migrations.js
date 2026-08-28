import {
  ESPN_CONNECTION_CACHE_KEY,
  ESPN_CONNECTION_PROFILES_KEY,
  validateEspnConnection,
} from "../providers/espn/connection-preferences.js";

export const STORAGE_VERSION_KEY = "chip-winner:storage-version";
export const CURRENT_STORAGE_VERSION = 1;

export function runCacheMigrations(storage = globalThis.localStorage) {
  if (!storage) return { status: "unavailable", from: 0, to: CURRENT_STORAGE_VERSION };

  try {
    const rawVersion = storage.getItem(STORAGE_VERSION_KEY);
    const parsedVersion = rawVersion === null ? 0 : Number.parseInt(rawVersion, 10);
    const from = Number.isInteger(parsedVersion) && parsedVersion >= 0 ? parsedVersion : 0;

    if (from > CURRENT_STORAGE_VERSION) {
      return { status: "unsupported", from, to: CURRENT_STORAGE_VERSION };
    }
    if (from === CURRENT_STORAGE_VERSION) {
      return { status: "current", from, to: CURRENT_STORAGE_VERSION };
    }

    if (from < 1 && storage.getItem(ESPN_CONNECTION_PROFILES_KEY) === null) {
      const active = JSON.parse(storage.getItem(ESPN_CONNECTION_CACHE_KEY) || "null");
      if (validateEspnConnection(active).valid) {
        storage.setItem(ESPN_CONNECTION_PROFILES_KEY, JSON.stringify([active]));
      }
    }

    storage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
    return { status: "migrated", from, to: CURRENT_STORAGE_VERSION };
  } catch {
    return { status: "failed", from: 0, to: CURRENT_STORAGE_VERSION };
  }
}
