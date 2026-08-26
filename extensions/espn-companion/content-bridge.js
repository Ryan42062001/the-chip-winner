const CHANNEL = "the-chip-winner:espn-companion:v1";

window.postMessage({ channel: CHANNEL, type: "COMPANION_READY" }, window.location.origin);

window.addEventListener("message", async (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  if (event.data?.channel !== CHANNEL || event.data?.direction !== "to-extension") return;
  const requestId = event.data.requestId;
  const allowed = new Set(["CHIP_WINNER_PING", "CHIP_WINNER_FETCH_LEAGUE"]);
  if (!allowed.has(event.data.type)) return;
  try {
    const response = await chrome.runtime.sendMessage({ type: event.data.type, payload: event.data.payload });
    window.postMessage({ channel: CHANNEL, direction: "to-page", requestId, ...response }, window.location.origin);
  } catch (error) {
    window.postMessage({ channel: CHANNEL, direction: "to-page", requestId, ok: false, error: error?.message || "Companion unavailable." }, window.location.origin);
  }
});
