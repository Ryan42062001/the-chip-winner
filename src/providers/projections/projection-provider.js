export class ProjectionProvider {
constructor(id) {
if (!id) throw new Error("Projection providers require an id.");
this.id = id;
}
async getProjections() {
throw new Error(`${this.id} does not implement getProjections().`);
}
}
export function applyProjectionSet(snapshot, projectionSet) {
if (!projectionSet || typeof projectionSet !== "object" || !projectionSet.source) throw new Error("Projection set source is required.");
const byPlayerId = new Map((projectionSet.players || []).map((item) => [item.playerId, item]));
const unresolved = [];
const players = snapshot.players.map((player) => {
const incoming = byPlayerId.get(player.id);
if (!incoming) return player;
byPlayerId.delete(player.id);
if (incoming.projection == null) return { ...player, projection: null };
if (!Number.isFinite(incoming.projection) || incoming.projection < 0) throw new Error(`Invalid projection for ${player.id}.`);
return { ...player, projection: incoming.projection };
});
for (const playerId of byPlayerId.keys()) unresolved.push(playerId);
return {
snapshot: {
...snapshot,
players,
meta: {
...(snapshot.meta || {}),
projectionsSource: projectionSet.source,
projectionsUpdatedAt: projectionSet.updatedAt || null
}
},
unresolved
};
}
