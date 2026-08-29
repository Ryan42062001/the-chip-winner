const CHANNEL = "the-chip-winner:espn-companion:v1";
export class EspnCompanionClient {
constructor({ windowRef = globalThis.window, timeoutMs = 8000 } = {}) {
this.window = windowRef;
this.timeoutMs = timeoutMs;
}
ping() { return this.request("CHIP_WINNER_PING"); }
fetchLeague({ leagueId, seasonId }) { return this.request("CHIP_WINNER_FETCH_LEAGUE", { leagueId, seasonId }); }
request(type, payload = null) {
const requestId = crypto.randomUUID();
return new Promise((resolve, reject) => {
const timer = setTimeout(() => { cleanup(); reject(new Error("ESPN Companion was not detected. Install or reload the extension.")); }, this.timeoutMs);
const onMessage = (event) => {
if (event.source !== this.window || event.origin !== this.window.location.origin) return;
if (event.data?.channel !== CHANNEL || event.data?.direction !== "to-page" || event.data?.requestId !== requestId) return;
cleanup();
event.data.ok ? resolve(event.data) : reject(new Error(event.data.error || "ESPN Companion request failed."));
};
const cleanup = () => { clearTimeout(timer); this.window.removeEventListener("message", onMessage); };
this.window.addEventListener("message", onMessage);
this.window.postMessage({ channel: CHANNEL, direction: "to-extension", requestId, type, payload }, this.window.location.origin);
});
}
}
