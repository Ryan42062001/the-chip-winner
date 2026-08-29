const CACHE_KEY = "chip-winner:planning-weeks:v1";
const PLAYOFF_KEY = "chip-winner:playoff-weeks:v1";

export function normalizePlanningWeeks(weeks) {
  if (!Array.isArray(weeks)) throw new Error("Planning weeks must be an array.");
  const normalized = [...new Set(weeks.map(Number))].filter((week) => Number.isInteger(week) && week >= 1 && week <= 18).sort((a, b) => a - b);
  if (normalized.length !== weeks.length) throw new Error("Planning weeks must be unique NFL week numbers from 1 through 18.");
  return Object.freeze(normalized);
}

export class PlanningPreferences {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  read() { try { const raw = this.storage?.getItem(CACHE_KEY); if (raw === null || raw === undefined) return null; return normalizePlanningWeeks(JSON.parse(raw)); } catch { return null; } }
  save(weeks) { const normalized = normalizePlanningWeeks(weeks); this.storage?.setItem(CACHE_KEY, JSON.stringify(normalized)); return normalized; }
  readPlayoff(leagueId, season) { try { return normalizePlanningWeeks(JSON.parse(this.storage?.getItem(PLAYOFF_KEY) || "{}")[`${leagueId}:${season}`]); } catch { return null; } }
  savePlayoff(leagueId, season, weeks) { const normalized = normalizePlanningWeeks(weeks), values = JSON.parse(this.storage?.getItem(PLAYOFF_KEY) || "{}"); values[`${leagueId}:${season}`] = normalized; this.storage?.setItem(PLAYOFF_KEY, JSON.stringify(values)); return normalized; }
  clear() { this.storage?.removeItem(CACHE_KEY); this.storage?.removeItem(PLAYOFF_KEY); }
}
