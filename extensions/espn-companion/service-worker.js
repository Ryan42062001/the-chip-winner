const ALLOWED_VIEWS = Object.freeze(["mTeam", "mRoster", "mMatchup", "mSettings"]);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only this extension's own isolated content script may invoke the read bridge.
  if (sender?.id !== chrome.runtime.id) return false;
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

  // Availability is independent of the league response. Start it at the same
  // time so a refresh does not pay for the two authenticated ESPN requests in
  // series. The league response still owns the scoring period used by the NFL
  // scoreboard request below.
  const availablePromise = fetchAvailablePlayers({ leagueId, seasonId }).catch(() => null);
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  let body = null;
  try { body = await response.json(); } catch { /* handled below */ }
  if (!response.ok) {
    const message = body?.messages?.[0] || `ESPN request failed (${response.status}).`;
    throw new Error(message);
  }
  const [availablePlayers, nflScoreboard] = await Promise.all([
    availablePromise,
    fetchNflScoreboard({ seasonId, week: body.scoringPeriodId }).catch(() => ({ events: [] }))
  ]);
  return {
    league: body,
    availablePlayers,
    nflScoreboard,
    meta: {
      capturedAt: new Date().toISOString(),
      endpoint: "league",
      views: [...ALLOWED_VIEWS]
    }
  };
}

async function fetchAvailablePlayers({ leagueId, seasonId }) {
  const filter = {
    players: {
      filterStatus: { value: ["FREEAGENT", "WAIVERS"] },
      filterSlotIds: { value: [0, 2, 4, 6, 16, 17] },
      limit: 100,
      sortPercOwned: { sortPriority: 1, sortAsc: false }
    }
  };
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=kona_player_info`;
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json", "X-Fantasy-Filter": JSON.stringify(filter) } });
  if (!response.ok) throw new Error(`ESPN availability request failed (${response.status}).`);
  const body = await response.json();
  return body.players || [];
}

async function fetchNflScoreboard({ seasonId, week }) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${seasonId}&seasontype=2&week=${week}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return { events: [] };
  return response.json();
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
