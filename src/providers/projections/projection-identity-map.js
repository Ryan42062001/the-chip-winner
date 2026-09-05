const CACHE_KEY = "chip-winner:projection-identity-map:v1";

function validateDuplicateEspnAliases(entries) {
  const byProvider = new Map(entries.map((item) => [item.providerPlayerId, item]));
  const byEspn = new Map();
  for (const entry of entries) {
    const group = byEspn.get(entry.espnPlayerId) || [];
    group.push(entry);
    byEspn.set(entry.espnPlayerId, group);
  }
  for (const [espnPlayerId, group] of byEspn) {
    if (group.length < 2) continue;
    const roots = group.filter((item) => !item.supersedesProviderPlayerId);
    if (roots.length !== 1) throw new Error(`Projection identity map contains ambiguous duplicate ESPN ID ${espnPlayerId}.`);
    const root = roots[0];
    for (const entry of group) {
      if (entry === root) continue;
      const visited = new Set([entry.providerPlayerId]);
      let current = entry;
      while (current.supersedesProviderPlayerId) {
        if (visited.has(current.supersedesProviderPlayerId)) throw new Error(`Projection identity map contains a supersession cycle for ESPN ID ${espnPlayerId}.`);
        visited.add(current.supersedesProviderPlayerId);
        const parent = byProvider.get(current.supersedesProviderPlayerId);
        if (!parent || parent.espnPlayerId !== espnPlayerId) {
          throw new Error(`Projection identity map contains ambiguous duplicate ESPN ID ${espnPlayerId}.`);
        }
        current = parent;
      }
      if (current.providerPlayerId !== root.providerPlayerId) {
        throw new Error(`Projection identity map contains ambiguous duplicate ESPN ID ${espnPlayerId}.`);
      }
    }
  }
}

export function parseProjectionIdentityMapCsv(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Projection identity map CSV is empty.");
  const headers = lines[0].split(",").map((value) => value.trim().replace(/^"|"$/g, "").toLowerCase());
  for (const name of ["provider_player_id", "espn_player_id"]) if (!headers.includes(name)) throw new Error(`Projection identity map CSV is missing ${name}.`);
  const providerIndex = headers.indexOf("provider_player_id");
  const espnIndex = headers.indexOf("espn_player_id");
  const supersedesIndex = headers.indexOf("supersedes_provider_player_id");
  const entries = lines.slice(1).map((line, index) => {
    const values = line.split(",");
    const clean = (value) => value?.trim().replace(/^"|"$/g, "").replaceAll('""', '"');
    const providerPlayerId = clean(values[providerIndex]);
    const espnPlayerId = clean(values[espnIndex]);
    const supersedesProviderPlayerId = supersedesIndex >= 0 ? clean(values[supersedesIndex]) : null;
    if (!providerPlayerId || !espnPlayerId) throw new Error(`Projection identity map row ${index + 2} is incomplete.`);
    if (supersedesProviderPlayerId === providerPlayerId) throw new Error(`Projection identity map row ${index + 2} cannot supersede itself.`);
    return Object.freeze({
      providerPlayerId,
      espnPlayerId,
      ...(supersedesProviderPlayerId ? { supersedesProviderPlayerId } : {})
    });
  });
  if (new Set(entries.map((item) => item.providerPlayerId)).size !== entries.length) throw new Error("Projection identity map contains duplicate provider IDs.");
  validateDuplicateEspnAliases(entries);
  return Object.freeze(entries);
}

export function mergeProjectionIdentityMaps(existing, incomingEntries) {
  const merged = new Map(existing || []);
  const existingProvidersByEspn = new Map();
  for (const [providerId, espnId] of merged) {
    const providers = existingProvidersByEspn.get(espnId) || new Set();
    providers.add(providerId);
    existingProvidersByEspn.set(espnId, providers);
  }
  for (const { providerPlayerId, espnPlayerId, supersedesProviderPlayerId } of incomingEntries) {
    if (merged.has(providerPlayerId) && merged.get(providerPlayerId) !== espnPlayerId) {
      throw new Error(`Provider ID ${providerPlayerId} conflicts with an existing ESPN mapping.`);
    }
    if (merged.get(providerPlayerId) === espnPlayerId) continue;
    const existingProviders = existingProvidersByEspn.get(espnPlayerId) || new Set();
    if (existingProviders.size && (!supersedesProviderPlayerId || !existingProviders.has(supersedesProviderPlayerId))) {
      throw new Error(`ESPN ID ${espnPlayerId} conflicts with an existing provider mapping.`);
    }
  }
  for (const { providerPlayerId, espnPlayerId } of incomingEntries) merged.set(providerPlayerId, espnPlayerId);
  return merged;
}

export class ProjectionIdentityMapProvider {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  importCsv(text) {
    const entries = parseProjectionIdentityMapCsv(text);
    this.storage?.setItem(CACHE_KEY, JSON.stringify(entries));
    return new Map(entries.map((item) => [item.providerPlayerId, item.espnPlayerId]));
  }
  mergeCsv(text) {
    const incoming = parseProjectionIdentityMapCsv(text);
    const merged = mergeProjectionIdentityMaps(this.readCache(), incoming);
    this.storage?.setItem(CACHE_KEY, JSON.stringify([...merged].map(([providerPlayerId, espnPlayerId]) => ({ providerPlayerId, espnPlayerId }))));
    return merged;
  }
  preflightMergeCsv(text) {
    const incoming = parseProjectionIdentityMapCsv(text);
    const current = this.readCache();
    return { current, incoming, merged: mergeProjectionIdentityMaps(current, incoming) };
  }
  saveCache(map) {
    const value = map instanceof Map ? map : new Map(map || []);
    this.storage?.setItem(CACHE_KEY, JSON.stringify([...value].map(([providerPlayerId, espnPlayerId]) => ({ providerPlayerId, espnPlayerId }))));
    return value;
  }
  readCache() {
    try {
      const entries = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null");
      return Array.isArray(entries) ? new Map(entries.map((item) => [item.providerPlayerId, item.espnPlayerId])) : null;
    } catch {
      this.clearCache();
      return null;
    }
  }
  clearCache() { this.storage?.removeItem(CACHE_KEY); }
}
