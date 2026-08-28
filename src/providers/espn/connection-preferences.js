const CACHE_KEY = "chip-winner:espn-connection:v1";
export const DEFAULT_ESPN_CONNECTION = Object.freeze({ leagueId: "118749183", seasonId: "2026", teamId: "2" });

export function validateEspnConnection(value) {
  const errors = [];
  if (!/^\d+$/.test(String(value?.leagueId || ""))) errors.push("League ID must contain only numbers.");
  if (!/^20\d{2}$/.test(String(value?.seasonId || ""))) errors.push("Season must be a four-digit year.");
  if (!/^\d+$/.test(String(value?.teamId || ""))) errors.push("Team ID must contain only numbers.");
  return { valid: errors.length === 0, errors };
}

export class EspnConnectionPreferences {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  read() { try { const value = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null"); return validateEspnConnection(value).valid ? value : DEFAULT_ESPN_CONNECTION; } catch { return DEFAULT_ESPN_CONNECTION; } }
  save(value) { const normalized = { leagueId: String(value.leagueId), seasonId: String(value.seasonId), teamId: String(value.teamId) }; const result = validateEspnConnection(normalized); if (!result.valid) throw new Error(result.errors.join(" ")); this.storage?.setItem(CACHE_KEY, JSON.stringify(normalized)); return Object.freeze(normalized); }
  clear() { this.storage?.removeItem(CACHE_KEY); }
}
