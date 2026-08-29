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
function scoringFamily(value) {
const text = String(value || "").toLowerCase().replace(/[_-]/g, " ");
if (/half|0\.5/.test(text) && text.includes("ppr")) return "half-ppr";
if (text.includes("standard") || text.includes("non ppr")) return "standard";
if (text.includes("ppr")) return "ppr";
return null;
}
export function evaluateFantasyProsCompatibility(rankingSet, snapshot) {
const errors = []; const warnings = [];
const leagueSeason = Number(snapshot?.league?.season);
if (Number.isInteger(leagueSeason) && rankingSet?.season !== leagueSeason) errors.push(`FantasyPros season ${rankingSet?.season ?? "unavailable"} does not match ESPN league season ${leagueSeason}.`);
else if (!Number.isInteger(leagueSeason)) warnings.push("ESPN season data is missing, so ranking season compatibility cannot be verified.");
const rankingScoring = scoringFamily(rankingSet?.scoringFormat); const leagueScoring = scoringFamily(snapshot?.league?.scoringType);
if (rankingScoring && leagueScoring && rankingScoring !== leagueScoring) errors.push(`FantasyPros scoring ${rankingSet.scoringFormat} does not match ESPN league scoring ${snapshot.league.scoringType}.`);
else if (!rankingScoring) warnings.push("FantasyPros scoring metadata does not identify a supported PPR family, so ranking scoring compatibility cannot be verified.");
else if (!leagueScoring) warnings.push("ESPN scoring data does not identify a PPR family, so ranking scoring compatibility cannot be verified.");
return Object.freeze({ usable: errors.length === 0, status: errors.length ? "blocked" : warnings.length ? "unverified" : "ready", errors: Object.freeze(errors), warnings: Object.freeze(warnings) });
}
export class FantasyProsRankingProvider {
constructor({ storage = globalThis.localStorage } = {}) {
this.storage = storage;
}
importCsv(text, metadata) {
const metadataErrors = [];
if (metadata?.kind !== "rest-of-season") metadataErrors.push("Ranking kind must be explicitly set to rest-of-season.");
if (!Number.isInteger(Number(metadata?.season)) || Number(metadata.season) < 2000 || Number(metadata.season) > 2100) metadataErrors.push("Ranking season must be a four-digit year from 2000 through 2100.");
if (typeof metadata?.scoringFormat !== "string" || !metadata.scoringFormat.trim()) metadataErrors.push("Ranking scoring format is required.");
if (typeof metadata?.expertFilter !== "string" || !metadata.expertFilter.trim()) metadataErrors.push("Ranking expert filter is required.");
if (metadataErrors.length) throw new Error(metadataErrors.join(" "));
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
