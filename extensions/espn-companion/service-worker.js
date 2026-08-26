const ALLOWED_VIEWS = Object.freeze(["mTeam", "mRoster", "mMatchup", "mSettings"]);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "CHIP_WINNER_PING") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return false;
  }
  if (message?.type !== "CHIP_WINNER_FETCH_LEAGUE") return false;
  fetchLeague(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: safeError(error) }));
  return true;
});

async function fetchLeague(payload) {
  const leagueId = requireDigits(payload?.leagueId, "leagueId");
  const seasonId = requireDigits(payload?.seasonId, "seasonId");
  const params = new URLSearchParams();
  ALLOWED_VIEWS.forEach((view) => params.append("view", view));
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}?${params}`;
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  let body = null;
  try { body = await response.json(); } catch { /* handled below */ }
  if (!response.ok) {
    const message = body?.messages?.[0] || `ESPN request failed (${response.status}).`;
    throw new Error(message);
  }
  return {
    league: body,
    meta: {
      capturedAt: new Date().toISOString(),
      endpoint: "league",
      views: [...ALLOWED_VIEWS]
    }
  };
}

function requireDigits(value, label) {
  const text = String(value ?? "");
  if (!/^\d+$/.test(text)) throw new Error(`${label} must contain only digits.`);
  return text;
}

function safeError(error) {
  const message = error instanceof Error ? error.message : "Unknown companion error.";
  return message.slice(0, 300);
}
