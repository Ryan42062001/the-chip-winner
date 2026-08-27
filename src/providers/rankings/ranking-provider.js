import { parseFantasyProsRankingsCsv } from "./fantasypros-csv.js";

const CACHE_KEY = "chip-winner:fantasypros-rankings:v1";
const TEAM_ALIASES = Object.freeze({ JAC: "JAX", WSH: "WAS" });

function normalizedName(value) {
  return String(value || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\.?$/i, "").replace(/[^a-z0-9]/g, "");
}

function normalizedTeam(value) {
  const team = String(value || "").toUpperCase();
  return TEAM_ALIASES[team] || team;
}

function normalizedPosition(value) {
  return String(value || "").toUpperCase().replace("D/ST", "DST");
}

function identityKey({ name, playerName, proTeam, team, position }) {
  const normalizedPos = normalizedPosition(position);
  const playerKey = normalizedPos === "DST" ? "team-defense" : normalizedName(name || playerName);
  return [playerKey, normalizedTeam(proTeam || team), normalizedPos].join("|");
}

export function reconcileFantasyProsRankings(players, rankingSet) {
  const candidates = new Map();
  for (const player of players) {
    const key = identityKey(player);
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key).push(player);
  }

  const byPlayerId = {};
  const unresolved = [];
  const conflicts = [];
  for (const ranking of rankingSet.rankings) {
    const matches = candidates.get(identityKey(ranking)) || [];
    if (matches.length === 1) byPlayerId[matches[0].id] = ranking;
    else if (matches.length > 1) conflicts.push({ ranking, playerIds: matches.map((player) => player.id) });
    else unresolved.push(ranking);
  }
  return Object.freeze({ byPlayerId: Object.freeze(byPlayerId), unresolved: Object.freeze(unresolved), conflicts: Object.freeze(conflicts) });
}

export class FantasyProsRankingProvider {
  constructor({ storage = globalThis.localStorage } = {}) {
    this.storage = storage;
  }

  importCsv(text, metadata) {
    const set = parseFantasyProsRankingsCsv(text, metadata);
    this.storage?.setItem(CACHE_KEY, JSON.stringify(set));
    return set;
  }

  readCache() {
    try {
      const cached = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null");
      return cached?.source === "fantasypros" && Array.isArray(cached.rankings) ? cached : null;
    } catch {
      this.clearCache();
      return null;
    }
  }

  clearCache() {
    this.storage?.removeItem(CACHE_KEY);
  }
}
