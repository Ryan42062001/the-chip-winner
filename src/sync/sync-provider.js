export class SyncProvider {
async publish() { throw new Error("Sync provider does not implement publish()."); }
async read() { throw new Error("Sync provider does not implement read()."); }
async remove() { throw new Error("Sync provider does not implement remove()."); }
}
export class HttpSyncProvider extends SyncProvider {
constructor({ baseUrl, fetchImpl = (...args) => globalThis.fetch(...args), timeoutMs = 8000 }) {
super();
if (!baseUrl) throw new Error("Sync service URL is required.");
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("Sync timeout must be a positive number of milliseconds.");
this.baseUrl = baseUrl.replace(/\/$/, "");
this.fetch = fetchImpl;
this.timeoutMs = timeoutMs;
}
async request(url, options = {}) {
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
try {
return await this.fetch(url, { ...options, signal: controller.signal });
} catch (error) {
if (controller.signal.aborted) throw new Error(`Sync service timed out after ${Math.ceil(this.timeoutMs / 1000)} seconds.`);
throw error;
} finally {
clearTimeout(timeout);
}
}
async publish(envelope, writeToken) {
const response = await this.request(`${this.baseUrl}/v1/channels/${encodeURIComponent(envelope.channelId)}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${writeToken}` }, body: JSON.stringify(envelope) });
if (!response.ok) throw new Error(`Sync publish failed (${response.status}).`);
return response.json();
}
async read(channelId) {
const response = await this.request(`${this.baseUrl}/v1/channels/${encodeURIComponent(channelId)}`, { headers: { Accept: "application/json" } });
if (response.status === 404) return null;
if (!response.ok) throw new Error(`Sync read failed (${response.status}).`);
return response.json();
}
async remove(channelId, writeToken) {
const response = await this.request(`${this.baseUrl}/v1/channels/${encodeURIComponent(channelId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${writeToken}` } });
if (!response.ok && response.status !== 404) throw new Error(`Sync removal failed (${response.status}).`);
}
}
