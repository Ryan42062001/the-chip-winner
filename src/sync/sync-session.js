import { decryptSyncPayload, encryptSyncPayload } from "./crypto.js";
import { validateLeagueSnapshot } from "../domain/model.js";

function validateSelectedTeam(snapshot, selectedTeamId, context) {
if (selectedTeamId == null) return;
if (!snapshot.teams.some((team) => team.id === selectedTeamId)) throw new Error(`${context} selected team is not present in the ESPN snapshot.`);
}

export async function publishSyncState(provider, credentials, snapshot, rankingSet = null, selectedTeamId = null) {
const errors = validateLeagueSnapshot(snapshot);
if (errors.length) throw new Error(`Cannot sync invalid ESPN state: ${errors.join(" ")}`);
validateSelectedTeam(snapshot, selectedTeamId, "Cannot sync");
const envelope = await encryptSyncPayload({ snapshot, rankingSet, selectedTeamId }, credentials);
await provider.publish(envelope, credentials.writeToken);
return envelope;
}

export async function readSyncState(provider, credentials) {
const envelope = await provider.read(credentials.channelId);
if (!envelope) return null;
const decoded = await decryptSyncPayload(envelope, credentials);
const errors = validateLeagueSnapshot(decoded.payload?.snapshot);
if (errors.length) throw new Error(`Synced ESPN state is invalid: ${errors.join(" ")}`);
validateSelectedTeam(decoded.payload.snapshot, decoded.payload?.selectedTeamId, "Synced");
return decoded;
}
