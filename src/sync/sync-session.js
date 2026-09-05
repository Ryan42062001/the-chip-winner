import { decryptSyncPayload, encryptSyncPayload } from "./crypto.js";
import { validateLeagueSnapshot } from "../domain/model.js";

function validateSelectedTeam(snapshot, selectedTeamId, context) {
if (selectedTeamId == null) return;
if (!snapshot.teams.some((team) => team.id === selectedTeamId)) throw new Error(`${context} selected team is not present in the ESPN snapshot.`);
}

function sameLeague(left, right) {
return left?.league?.id === right?.league?.id && Number(left?.league?.season) === Number(right?.league?.season);
}

function preparePreviousSnapshot(snapshot, previousSnapshot) {
if (previousSnapshot == null) return null;
const errors = validateLeagueSnapshot(previousSnapshot);
if (errors.length) throw new Error(`Cannot sync invalid previous ESPN state: ${errors.join(" ")}`);
return sameLeague(snapshot, previousSnapshot) ? previousSnapshot : null;
}

function validateSyncedPreviousSnapshot(snapshot, previousSnapshot) {
if (previousSnapshot == null) return;
const errors = validateLeagueSnapshot(previousSnapshot);
if (errors.length) throw new Error(`Synced previous ESPN state is invalid: ${errors.join(" ")}`);
if (!sameLeague(snapshot, previousSnapshot)) throw new Error("Synced previous ESPN state does not belong to the current league and season.");
}

export async function publishSyncState(provider, credentials, snapshot, rankingSet = null, selectedTeamId = null, previousSnapshot = null) {
const errors = validateLeagueSnapshot(snapshot);
if (errors.length) throw new Error(`Cannot sync invalid ESPN state: ${errors.join(" ")}`);
validateSelectedTeam(snapshot, selectedTeamId, "Cannot sync");
const compatiblePreviousSnapshot = preparePreviousSnapshot(snapshot, previousSnapshot);
const envelope = await encryptSyncPayload({ snapshot, previousSnapshot: compatiblePreviousSnapshot, rankingSet, selectedTeamId }, credentials);
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
validateSyncedPreviousSnapshot(decoded.payload.snapshot, decoded.payload?.previousSnapshot);
return decoded;
}
