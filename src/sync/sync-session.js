import { decryptSyncPayload, encryptSyncPayload } from "./crypto.js";
import { validateLeagueSnapshot } from "../domain/model.js";
export async function publishSyncState(provider, credentials, snapshot, rankingSet = null) {
const errors = validateLeagueSnapshot(snapshot);
if (errors.length) throw new Error(`Cannot sync invalid ESPN state: ${errors.join(" ")}`);
const envelope = await encryptSyncPayload({ snapshot, rankingSet }, credentials);
await provider.publish(envelope, credentials.writeToken);
return envelope;
}
export async function readSyncState(provider, credentials) {
const envelope = await provider.read(credentials.channelId);
if (!envelope) return null;
const decoded = await decryptSyncPayload(envelope, credentials);
const errors = validateLeagueSnapshot(decoded.payload?.snapshot);
if (errors.length) throw new Error(`Synced ESPN state is invalid: ${errors.join(" ")}`);
return decoded;
}
