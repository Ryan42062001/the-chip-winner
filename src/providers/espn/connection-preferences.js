export const ESPN_CONNECTION_CACHE_KEY = "chip-winner:espn-connection:v1";
export const ESPN_CONNECTION_PROFILES_KEY = "chip-winner:espn-connections:v1";
export const DEFAULT_ESPN_CONNECTION = Object.freeze({ leagueId: "", seasonId: "", teamId: "" });

export function validateEspnConnection(value) {
  const errors = [];
  if (!/^\d+$/.test(String(value?.leagueId || ""))) errors.push("League ID must contain only numbers.");
  if (!/^20\d{2}$/.test(String(value?.seasonId || ""))) errors.push("Season must be a four-digit year.");
  if (!/^\d+$/.test(String(value?.teamId || ""))) errors.push("Team ID must contain only numbers.");
  return { valid: errors.length === 0, errors };
}

export class EspnConnectionPreferences {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  read() { try { const value = JSON.parse(this.storage?.getItem(ESPN_CONNECTION_CACHE_KEY) || "null"); return validateEspnConnection(value).valid ? value : DEFAULT_ESPN_CONNECTION; } catch { return DEFAULT_ESPN_CONNECTION; } }
  list() { try { const values = JSON.parse(this.storage?.getItem(ESPN_CONNECTION_PROFILES_KEY) || "[]"); return Array.isArray(values) ? values.filter((item) => validateEspnConnection(item).valid) : []; } catch { return []; } }
  save(value) { const normalized = { leagueId: String(value.leagueId), seasonId: String(value.seasonId), teamId: String(value.teamId) }; const result = validateEspnConnection(normalized); if (!result.valid) throw new Error(result.errors.join(" ")); const key = connectionKey(normalized); const profiles = this.list().filter((item) => connectionKey(item) !== key); profiles.push(normalized); this.storage?.setItem(ESPN_CONNECTION_PROFILES_KEY, JSON.stringify(profiles)); this.storage?.setItem(ESPN_CONNECTION_CACHE_KEY, JSON.stringify(normalized)); return Object.freeze(normalized); }
  activate(key) { const profile = this.list().find((item) => connectionKey(item) === key); if (!profile) throw new Error("Saved ESPN connection was not found."); this.storage?.setItem(ESPN_CONNECTION_CACHE_KEY, JSON.stringify(profile)); return Object.freeze(profile); }
  remove(key) { const profiles = this.list().filter((item) => connectionKey(item) !== key); this.storage?.setItem(ESPN_CONNECTION_PROFILES_KEY, JSON.stringify(profiles)); if (connectionKey(this.read()) === key) this.storage?.removeItem(ESPN_CONNECTION_CACHE_KEY); }
  clear() { this.storage?.removeItem(ESPN_CONNECTION_CACHE_KEY); this.storage?.removeItem(ESPN_CONNECTION_PROFILES_KEY); }
}

export const connectionKey = (value) => `${value.leagueId}:${value.seasonId}:${value.teamId}`;
