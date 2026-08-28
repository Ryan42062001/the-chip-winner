export const MINIMUM_COMPANION_VERSION = "0.2.1";
export const REFRESH_COOLDOWN_MS = 15_000;
export const REFRESH_HISTORY_KEY = "chip-winner:espn-refresh-history:v1";

function versionParts(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(value || ""));
  return match ? match.slice(1).map(Number) : null;
}

export function compareVersions(left, right) {
  const a = versionParts(left); const b = versionParts(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  return 0;
}

export function evaluateCompanionPing(response, minimumVersion = MINIMUM_COMPANION_VERSION) {
  const version = response?.version;
  const comparison = compareVersions(version, minimumVersion);
  if (comparison === null) return { status: "incompatible", version: version || null, message: "The companion did not report a valid version. Reload or reinstall it." };
  if (comparison < 0) return { status: "incompatible", version, message: `Companion ${version} is outdated. Reload version ${minimumVersion} or newer from the repository.` };
  return { status: "ready", version, message: `Companion ${version} is ready for read-only ESPN refreshes.` };
}

export class EspnRefreshCooldown {
  constructor({ storage = globalThis.localStorage, now = () => Date.now(), cooldownMs = REFRESH_COOLDOWN_MS } = {}) { this.storage = storage; this.now = now; this.cooldownMs = cooldownMs; }
  read() { try { const value = JSON.parse(this.storage?.getItem(REFRESH_HISTORY_KEY) || "{}"); return value && typeof value === "object" && !Array.isArray(value) ? value : {}; } catch { return {}; } }
  remainingMs(key) { const lastRefresh = Number(this.read()[key]); return Number.isFinite(lastRefresh) ? Math.max(0, this.cooldownMs - (this.now() - lastRefresh)) : 0; }
  mark(key) { const history = this.read(); history[key] = this.now(); this.storage?.setItem(REFRESH_HISTORY_KEY, JSON.stringify(history)); }
  clear() { this.storage?.removeItem(REFRESH_HISTORY_KEY); }
}
