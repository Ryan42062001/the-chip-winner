const CACHE_KEY = "chip-winner:projection-identity-map:v1";

export function parseProjectionIdentityMapCsv(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Projection identity map CSV is empty.");
  const headers = lines[0].split(",").map((value) => value.trim().replace(/^"|"$/g, "").toLowerCase());
  for (const name of ["provider_player_id", "espn_player_id"]) if (!headers.includes(name)) throw new Error(`Projection identity map CSV is missing ${name}.`);
  const providerIndex = headers.indexOf("provider_player_id"); const espnIndex = headers.indexOf("espn_player_id");
  const entries = lines.slice(1).map((line, index) => {
    const values = line.split(","); const clean = (value) => value?.trim().replace(/^"|"$/g, "").replaceAll('""', '"'); const providerPlayerId = clean(values[providerIndex]); const espnPlayerId = clean(values[espnIndex]);
    if (!providerPlayerId || !espnPlayerId) throw new Error(`Projection identity map row ${index + 2} is incomplete.`);
    return Object.freeze({ providerPlayerId, espnPlayerId });
  });
  if (new Set(entries.map((item) => item.providerPlayerId)).size !== entries.length) throw new Error("Projection identity map contains duplicate provider IDs.");
  if (new Set(entries.map((item) => item.espnPlayerId)).size !== entries.length) throw new Error("Projection identity map contains duplicate ESPN IDs.");
  return Object.freeze(entries);
}

export function mergeProjectionIdentityMaps(existing, incomingEntries) {
  const merged = new Map(existing || []); const espnIds = new Map([...merged].map(([providerId, espnId]) => [espnId, providerId]));
  for (const { providerPlayerId, espnPlayerId } of incomingEntries) {
    if (merged.has(providerPlayerId) && merged.get(providerPlayerId) !== espnPlayerId) throw new Error(`Provider ID ${providerPlayerId} conflicts with an existing ESPN mapping.`);
    if (espnIds.has(espnPlayerId) && espnIds.get(espnPlayerId) !== providerPlayerId) throw new Error(`ESPN ID ${espnPlayerId} conflicts with an existing provider mapping.`);
    merged.set(providerPlayerId, espnPlayerId); espnIds.set(espnPlayerId, providerPlayerId);
  }
  return merged;
}

export class ProjectionIdentityMapProvider {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  importCsv(text) { const entries = parseProjectionIdentityMapCsv(text); this.storage?.setItem(CACHE_KEY, JSON.stringify(entries)); return new Map(entries.map((item) => [item.providerPlayerId, item.espnPlayerId])); }
  mergeCsv(text) {
    const incoming = parseProjectionIdentityMapCsv(text); const merged = mergeProjectionIdentityMaps(this.readCache(), incoming);
    this.storage?.setItem(CACHE_KEY, JSON.stringify([...merged].map(([providerPlayerId, espnPlayerId]) => ({ providerPlayerId, espnPlayerId })))); return merged;
  }
  preflightMergeCsv(text) { const incoming = parseProjectionIdentityMapCsv(text); const current = this.readCache(); return { current, incoming, merged: mergeProjectionIdentityMaps(current, incoming) }; }
  saveCache(map) { const value = map instanceof Map ? map : new Map(map || []); this.storage?.setItem(CACHE_KEY, JSON.stringify([...value].map(([providerPlayerId, espnPlayerId]) => ({ providerPlayerId, espnPlayerId })))); return value; }
  readCache() {
    try { const entries = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null"); return Array.isArray(entries) ? new Map(entries.map((item) => [item.providerPlayerId, item.espnPlayerId])) : null; }
    catch { this.clearCache(); return null; }
  }
  clearCache() { this.storage?.removeItem(CACHE_KEY); }
}
