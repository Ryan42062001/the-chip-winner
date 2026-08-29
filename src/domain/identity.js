export function canonicalPlayerId(provider, providerPlayerId) {
if (!provider || providerPlayerId == null || String(providerPlayerId).trim() === "") throw new Error("A provider and provider player id are required.");
return `${String(provider).toLowerCase()}:${String(providerPlayerId)}`;
}
export function buildIdentityRegistry(players) {
const registry = new Map();
const conflicts = [];
for (const player of players) {
const identities = { espn: player.id, ...(player.externalIds || {}) };
for (const [provider, providerPlayerId] of Object.entries(identities)) {
if (providerPlayerId == null || providerPlayerId === "") continue;
const key = canonicalPlayerId(provider, providerPlayerId);
if (registry.has(key) && registry.get(key) !== player.id) conflicts.push({ key, playerIds: [registry.get(key), player.id] });
else registry.set(key, player.id);
}
}
return { registry, conflicts };
}
export function reconcileProviderRecords(players, provider, records) {
const { registry, conflicts } = buildIdentityRegistry(players);
const matched = [];
const unresolved = [];
for (const record of records) {
const providerPlayerId = record.providerPlayerId;
if (providerPlayerId == null || providerPlayerId === "") {
unresolved.push({ record, reason: "missing_provider_player_id" });
continue;
}
const playerId = registry.get(canonicalPlayerId(provider, providerPlayerId));
if (!playerId) unresolved.push({ record, reason: "identity_not_mapped" });
else matched.push({ playerId, record });
}
return { matched, unresolved, conflicts };
}
export function attachExternalIdentity(players, playerId, provider, providerPlayerId) {
const target = players.find((player) => player.id === playerId);
if (!target) throw new Error(`Unknown player ${playerId}.`);
const key = canonicalPlayerId(provider, providerPlayerId);
const existing = buildIdentityRegistry(players).registry.get(key);
if (existing && existing !== playerId) throw new Error(`${key} is already mapped to ${existing}.`);
return players.map((player) => player.id === playerId ? { ...player, externalIds: { ...(player.externalIds || {}), [provider]: String(providerPlayerId) } } : player);
}
