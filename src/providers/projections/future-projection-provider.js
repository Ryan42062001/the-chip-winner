export function normalizeFutureProjectionSet(input) {
  const errors = [];
  if (!input || typeof input !== "object") return { valid: false, errors: ["Projection set must be an object."] };
  if (typeof input.provider !== "string" || !input.provider.trim()) errors.push("provider is required.");
  if (typeof input.scoringFormat !== "string" || !input.scoringFormat.trim()) errors.push("scoringFormat is required.");
  if (!Number.isInteger(input.season) || input.season < 2000 || input.season > 2100) errors.push("season must be a four-digit year from 2000 through 2100.");
  if (!input.capturedAt || !Number.isFinite(Date.parse(input.capturedAt))) errors.push("capturedAt must be an ISO date-time.");
  if (!Array.isArray(input.projections)) errors.push("projections must be an array.");
  const records = [];
  for (const [index, item] of (input.projections || []).entries()) {
    if (typeof item?.providerPlayerId !== "string" || !item.providerPlayerId.trim()) { errors.push(`Projection ${index} requires providerPlayerId.`); continue; }
    if (!Number.isInteger(item.week) || item.week < 1 || item.week > 18) { errors.push(`Projection ${index} has an invalid week.`); continue; }
    if (!Number.isFinite(item.points) || item.points < 0) { errors.push(`Projection ${index} has invalid points.`); continue; }
    records.push(Object.freeze({ providerPlayerId: item.providerPlayerId, week: item.week, points: item.points }));
  }
  if (errors.length) return { valid: false, errors, value: null };
  return { valid: true, errors: [], value: Object.freeze({ provider: input.provider, scoringFormat: input.scoringFormat, season: input.season, capturedAt: input.capturedAt, projections: Object.freeze(records) }) };
}

export function indexFutureProjections(set) {
  const index = new Map();
  for (const item of set.projections) index.set(`${item.providerPlayerId}:${item.week}`, item.points);
  return index;
}

export function selectMappedFutureProjection(set, identityMap, espnPlayerId, week) {
  const result = (status, points = null) => Object.freeze({ status, points });
  if (!set) return result("missing-source"); if (!(identityMap instanceof Map)) return result("missing-mapping");
  const ids = [...identityMap].filter(([, id]) => id === espnPlayerId).map(([id]) => id);
  if (ids.length !== 1) return result(ids.length ? "identity-conflict" : "missing-mapping");
  const record = set.projections.find((item) => item.providerPlayerId === ids[0] && item.week === week);
  return record ? result("ready", record.points) : result("missing-week");
}

export function evaluateFutureProjectionCompatibility(set, snapshot, { now = Date.now(), staleAfterMs = 7 * 24 * 60 * 60 * 1000 } = {}) {
  const normalized = normalizeFutureProjectionSet(set);
  if (!normalized.valid) return Object.freeze({ usable: false, status: "invalid", ageMs: null, errors: Object.freeze(normalized.errors), warnings: Object.freeze([]) });
  const value = normalized.value; const errors = []; const warnings = [];
  const leagueSeason = Number(snapshot?.league?.season);
  if (Number.isInteger(leagueSeason) && value.season !== leagueSeason) errors.push(`Projection season ${value.season} does not match ESPN league season ${leagueSeason}.`);
  const leagueScoring = String(snapshot?.league?.scoringType || "").trim();
  if (leagueScoring && leagueScoring.toLowerCase() !== "unknown" && value.scoringFormat.trim().toLowerCase() !== leagueScoring.toLowerCase()) errors.push(`Projection scoring format ${value.scoringFormat} does not match ESPN league scoring ${leagueScoring}.`);
  const capturedTime = Date.parse(value.capturedAt); const ageMs = Number.isFinite(capturedTime) ? now - capturedTime : null;
  if (ageMs != null && ageMs < -5 * 60 * 1000) errors.push("Projection capture time is in the future.");
  else if (ageMs != null && ageMs > staleAfterMs) warnings.push(`Projection source is ${Math.floor(ageMs / 86_400_000)} days old.`);
  return Object.freeze({ usable: errors.length === 0, status: errors.length ? "blocked" : warnings.length ? "stale" : "ready", ageMs, errors: Object.freeze(errors), warnings: Object.freeze(warnings) });
}

export function parseFutureProjectionCsv(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Future projection CSV is empty.");
  const headers = lines[0].split(",").map((item) => item.trim().replace(/^"|"$/g, "").toLowerCase());
  for (const required of ["provider", "scoring_format", "season", "captured_at", "provider_player_id", "week", "points"]) if (!headers.includes(required)) throw new Error(`Future projection CSV is missing ${required}.`);
  const at = (values, name) => values[headers.indexOf(name)]?.trim().replace(/^"|"$/g, "").replaceAll('""', '"') || "";
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const week = at(values, "week"); const points = at(values, "points");
    return { provider: at(values, "provider"), scoringFormat: at(values, "scoring_format"), season: at(values, "season"), capturedAt: at(values, "captured_at"), projection: { providerPlayerId: at(values, "provider_player_id"), week: week === "" ? Number.NaN : Number(week), points: points === "" ? Number.NaN : Number(points) } };
  });
  const metadataKeys = rows.map((row) => JSON.stringify([row.provider, row.scoringFormat, row.season, row.capturedAt]));
  if (new Set(metadataKeys).size !== 1) throw new Error("Future projection CSV source metadata must be identical on every row.");
  const first = rows[0];
  const result = normalizeFutureProjectionSet({ provider: first.provider, scoringFormat: first.scoringFormat, season: Number(first.season), capturedAt: first.capturedAt, projections: rows.map((row) => row.projection) });
  if (!result.valid) throw new Error(result.errors.join(" "));
  const keys = result.value.projections.map((item) => `${item.providerPlayerId}:${item.week}`);
  if (new Set(keys).size !== keys.length) throw new Error("Future projection CSV contains duplicate player-week records.");
  return result.value;
}

const CACHE_KEY = "chip-winner:future-projections:v1";
export class FutureProjectionProvider {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  importCsv(text) { const set = parseFutureProjectionCsv(text); this.storage?.setItem(CACHE_KEY, JSON.stringify(set)); return set; }
  readCache() {
    try { const value = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null"); return value && normalizeFutureProjectionSet(value).valid ? value : null; }
    catch { this.clearCache(); return null; }
  }
  clearCache() { this.storage?.removeItem(CACHE_KEY); }
}
