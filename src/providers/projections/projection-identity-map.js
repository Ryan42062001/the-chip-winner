const CACHE_KEY = "chip-winner:projection-identity-map:v1";

export function parseProjectionIdentityMapCsv(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Projection identity map CSV is empty.");
  const headers = lines[0].split(",").map((value) => value.trim().toLowerCase());
  for (const name of ["provider_player_id", "espn_player_id"]) if (!headers.includes(name)) throw new Error(`Projection identity map CSV is missing ${name}.`);
  const providerIndex = headers.indexOf("provider_player_id"); const espnIndex = headers.indexOf("espn_player_id");
  const entries = lines.slice(1).map((line, index) => {
    const values = line.split(","); const providerPlayerId = values[providerIndex]?.trim(); const espnPlayerId = values[espnIndex]?.trim();
    if (!providerPlayerId || !espnPlayerId) throw new Error(`Projection identity map row ${index + 2} is incomplete.`);
    return Object.freeze({ providerPlayerId, espnPlayerId });
  });
  if (new Set(entries.map((item) => item.providerPlayerId)).size !== entries.length) throw new Error("Projection identity map contains duplicate provider IDs.");
  if (new Set(entries.map((item) => item.espnPlayerId)).size !== entries.length) throw new Error("Projection identity map contains duplicate ESPN IDs.");
  return Object.freeze(entries);
}

export class ProjectionIdentityMapProvider {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  importCsv(text) { const entries = parseProjectionIdentityMapCsv(text); this.storage?.setItem(CACHE_KEY, JSON.stringify(entries)); return new Map(entries.map((item) => [item.providerPlayerId, item.espnPlayerId])); }
  readCache() {
    try { const entries = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null"); return Array.isArray(entries) ? new Map(entries.map((item) => [item.providerPlayerId, item.espnPlayerId])) : null; }
    catch { this.clearCache(); return null; }
  }
  clearCache() { this.storage?.removeItem(CACHE_KEY); }
}
