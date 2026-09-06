import test from "node:test";
import assert from "node:assert/strict";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; }
  };
}

async function loadCompanionWithFetch(fetchImpl) {
  let listener = null;
  globalThis.chrome = {
    runtime: {
      id: "test-extension",
      onMessage: { addListener(fn) { listener = fn; } },
      getManifest() { return { version: "0.2.4" }; }
    }
  };
  globalThis.fetch = fetchImpl;
  const workerUrl = new URL("../extensions/espn-companion/service-worker.js", import.meta.url);
  await import(`${workerUrl.href}?test=${crypto.randomUUID()}`);
  assert.equal(typeof listener, "function");
  return listener;
}

function requestLeague(listener) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Companion test response timed out.")), 2_000);
    const keepAlive = listener(
      { type: "CHIP_WINNER_FETCH_LEAGUE", payload: { leagueId: "123", seasonId: "2026" } },
      { id: "test-extension" },
      (response) => { clearTimeout(timer); resolve(response); }
    );
    assert.equal(keepAlive, true);
  });
}

test("companion performs a dedicated authenticated mSettings read and merges explicit scoring items", async () => {
  const originalChrome = globalThis.chrome;
  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    const listener = await loadCompanionWithFetch(async (input, options = {}) => {
      const url = String(input);
      calls.push({ url, options });
      if (url.includes("view=kona_player_info")) return jsonResponse({ players: [] });
      if (url.includes("site.api.espn.com")) return jsonResponse({ events: [] });
      if (url.endsWith("?view=mSettings")) {
        return jsonResponse({
          settings: {
            name: "Do not replace main settings",
            scoringSettings: {
              scoringType: "H2H_POINTS",
              scoringItems: [{ statId: 53, points: 1 }]
            }
          }
        });
      }
      return jsonResponse({
        id: 123,
        seasonId: 2026,
        scoringPeriodId: 1,
        settings: { name: "Real League", scoringSettings: { scoringType: "H2H_POINTS" } },
        teams: [],
        schedule: []
      });
    });

    const response = await requestLeague(listener);
    assert.equal(response.ok, true);
    assert.equal(response.data.league.settings.name, "Real League");
    assert.deepEqual(response.data.league.settings.scoringSettings.scoringItems, [{ statId: 53, points: 1 }]);

    const settingsCalls = calls.filter(({ url }) => url.endsWith("?view=mSettings"));
    assert.equal(settingsCalls.length, 1);
    assert.equal(settingsCalls[0].options.credentials, "include");
    assert.equal(settingsCalls[0].options.headers.Accept, "application/json");
  } finally {
    if (originalChrome === undefined) delete globalThis.chrome; else globalThis.chrome = originalChrome;
    if (originalFetch === undefined) delete globalThis.fetch; else globalThis.fetch = originalFetch;
  }
});

test("companion fails the refresh closed when the dedicated settings response omits scoring items", async () => {
  const originalChrome = globalThis.chrome;
  const originalFetch = globalThis.fetch;
  try {
    const listener = await loadCompanionWithFetch(async (input) => {
      const url = String(input);
      if (url.includes("view=kona_player_info")) return jsonResponse({ players: [] });
      if (url.includes("site.api.espn.com")) return jsonResponse({ events: [] });
      if (url.endsWith("?view=mSettings")) return jsonResponse({ settings: { scoringSettings: { scoringType: "H2H_POINTS" } } });
      return jsonResponse({ id: 123, seasonId: 2026, scoringPeriodId: 1, settings: { name: "Real League" }, teams: [], schedule: [] });
    });

    const response = await requestLeague(listener);
    assert.equal(response.ok, false);
    assert.match(response.error, /missing scoring items/i);
  } finally {
    if (originalChrome === undefined) delete globalThis.chrome; else globalThis.chrome = originalChrome;
    if (originalFetch === undefined) delete globalThis.fetch; else globalThis.fetch = originalFetch;
  }
});
