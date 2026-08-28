export function normalizeFutureProjectionSet(input) {
  const errors = [];
  if (!input || typeof input !== "object") return { valid: false, errors: ["Projection set must be an object."] };
  if (typeof input.provider !== "string" || !input.provider.trim()) errors.push("provider is required.");
  if (typeof input.scoringFormat !== "string" || !input.scoringFormat.trim()) errors.push("scoringFormat is required.");
  if (!Number.isInteger(input.season)) errors.push("season must be an integer.");
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

export function parseFutureProjectionCsv(text, metadata) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Future projection CSV is empty.");
  const headers = lines[0].split(",").map((item) => item.trim().replace(/^"|"$/g, "").toLowerCase());
  for (const required of ["provider_player_id", "week", "points"]) if (!headers.includes(required)) throw new Error(`Future projection CSV is missing ${required}.`);
  const at = (values, name) => values[headers.indexOf(name)]?.trim().replace(/^"|"$/g, "").replaceAll('""', '"') || "";
  const projections = lines.slice(1).map((line) => {
    const values = line.split(",");
    const week = at(values, "week"); const points = at(values, "points");
    return { providerPlayerId: at(values, "provider_player_id"), week: week === "" ? Number.NaN : Number(week), points: points === "" ? Number.NaN : Number(points) };
  });
  const result = normalizeFutureProjectionSet({ ...metadata, projections });
  if (!result.valid) throw new Error(result.errors.join(" "));
  const keys = result.value.projections.map((item) => `${item.providerPlayerId}:${item.week}`);
  if (new Set(keys).size !== keys.length) throw new Error("Future projection CSV contains duplicate player-week records.");
  return result.value;
}

const CACHE_KEY = "chip-winner:future-projections:v1";
export class FutureProjectionProvider {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  importCsv(text, metadata) { const set = parseFutureProjectionCsv(text, metadata); this.storage?.setItem(CACHE_KEY, JSON.stringify(set)); return set; }
  readCache() {
    try { const value = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null"); return value && normalizeFutureProjectionSet(value).valid ? value : null; }
    catch { this.clearCache(); return null; }
  }
  clearCache() { this.storage?.removeItem(CACHE_KEY); }
}
