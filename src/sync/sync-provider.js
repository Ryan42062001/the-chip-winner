export class SyncProvider {
async publish() { throw new Error("Sync provider does not implement publish()."); }
async read() { throw new Error("Sync provider does not implement read()."); }
async remove() { throw new Error("Sync provider does not implement remove()."); }
}
export class HttpSyncProvider extends SyncProvider {
constructor({ baseUrl, fetchImpl = (...args) => globalThis.fetch(...args) }) {
super();
if (!baseUrl) throw new Error("Sync service URL is required.");
this.baseUrl = baseUrl.replace(/\/$/, "");
this.fetch = fetchImpl;
}
async publish(envelope, writeToken) {
const response = await this.fetch(`${this.baseUrl}/v1/channels/${encodeURIComponent(envelope.channelId)}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${writeToken}` }, body: JSON.stringify(envelope) });
if (!response.ok) throw new Error(`Sync publish failed (${response.status}).`);
return response.json();
}
async read(channelId) {
const response = await this.fetch(`${this.baseUrl}/v1/channels/${encodeURIComponent(channelId)}`, { headers: { Accept: "application/json" } });
if (response.status === 404) return null;
if (!response.ok) throw new Error(`Sync read failed (${response.status}).`);
return response.json();
}
async remove(channelId, writeToken) {
const response = await this.fetch(`${this.baseUrl}/v1/channels/${encodeURIComponent(channelId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${writeToken}` } });
if (!response.ok && response.status !== 404) throw new Error(`Sync removal failed (${response.status}).`);
}
}
