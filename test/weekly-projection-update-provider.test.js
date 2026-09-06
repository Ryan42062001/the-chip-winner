import test from "node:test";
import assert from "node:assert/strict";
import { WeeklyProjectionUpdateProvider } from "../src/providers/projections/weekly-projection-update-provider.js";

const WEEKLY = `page,scrape_date,fantasypros_id,pos,r2p_pts,team,player_name\nqb,2026-09-08,100,QB,20.5,BUF,Test Quarterback\ndst,2026-09-08,200,DST,7.0,BUF,Buffalo Bills\n`;
const IDS = `fantasypros_id,espn_id\n100,9001\n`;
const commitPayload = (date) => JSON.stringify([{ commit: { committer: { date } } }]);

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function fakeFetchFactory({ weeklyPublishedAt = "2026-09-08T14:00:00Z", playerIdsPublishedAt = "2026-09-08T13:00:00Z" } = {}) {
  return function fakeFetch(url) {
    let body;
    if (url.startsWith("https://raw.githubusercontent.com/") && url.endsWith("/fp_latest_weekly.csv")) body = WEEKLY;
    else if (url.startsWith("https://raw.githubusercontent.com/") && url.endsWith("/db_playerids.csv")) body = IDS;
    else if (url.includes("commits?path=files/db_playerids.csv")) body = commitPayload(playerIdsPublishedAt);
    else if (url.includes("commits?path=files/fp_latest_weekly.csv")) body = commitPayload(weeklyPublishedAt);
    else throw new Error(`Unexpected weekly projection URL: ${url}`);
    return Promise.resolve({ ok: true, status: 200, text: async () => body });
  };
}

const currentProjectionSet = {
  provider: "FantasyPros weekly r2p via DynastyProcess",
  scoringFormat: "PPR",
  season: 2026,
  capturedAt: "2026-09-08T14:00:00Z",
  projections: [{ providerPlayerId: "100", week: 2, points: 20.5, capturedAt: "2026-09-08T14:00:00Z" }]
};

test("weekly update check waits for a new publication before advancing ESPN week", async () => {
  const provider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetchFactory(), now: () => Date.parse("2026-09-08T15:00:00Z") });
  const projectionSet = {
    provider: "FantasyPros weekly r2p via DynastyProcess",
    scoringFormat: "PPR",
    season: 2026,
    capturedAt: "2026-09-08T14:00:00Z",
    projections: [{ providerPlayerId: "100", week: 1, points: 20, capturedAt: "2026-09-08T14:00:00Z" }]
  };
  const result = await provider.check({ season: 2026, week: 2, projectionSet });
  assert.equal(result.status, "waiting-source-refresh");
  assert.equal(result.canUpdate, false);
});

test("weekly update check exposes a new projection publication and becomes current after recording both source publications", async () => {
  const storage = memoryStorage();
  const provider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetchFactory(), storage, now: () => Date.parse("2026-09-08T15:00:00Z") });
  const available = await provider.check({ season: 2026, week: 2, projectionSet: null });
  assert.equal(available.status, "available");
  assert.equal(available.canUpdate, true);
  assert.equal(available.firstImport, true);

  const staged = await provider.stage({ season: 2026, week: 2, projectionSet: null });
  provider.saveReceipt({ season: 2026, week: 2, bundle: staged.bundle, diagnostics: staged.diagnostics, playerIdsPublishedAt: staged.playerIdsPublishedAt });
  const current = await provider.check({ season: 2026, week: 2, projectionSet: currentProjectionSet });
  assert.equal(current.status, "current");
  assert.equal(current.canUpdate, false);
});

test("current projections request a one-time player-ID refresh when an older receipt did not record crosswalk freshness", async () => {
  const storage = memoryStorage();
  storage.setItem("chip-winner:weekly-projection-updates:v1", JSON.stringify({
    "2026:2": {
      season: 2026,
      week: 2,
      provider: "FantasyPros weekly r2p via DynastyProcess",
      sourceDate: "2026-09-08",
      publishedAt: "2026-09-08T14:00:00.000Z",
      mappedCount: 1,
      sourceRecordCount: 2,
      unresolvedCount: 1,
      diagnosticCounts: {}
    }
  }));
  const provider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetchFactory(), storage, now: () => Date.parse("2026-09-08T15:00:00Z") });
  const result = await provider.check({ season: 2026, week: 2, projectionSet: currentProjectionSet });
  assert.equal(result.status, "identity-refresh-available");
  assert.equal(result.canUpdate, true);
  assert.match(result.reason, /no recorded player-ID crosswalk publication/i);
});

test("a newer player-ID publication can refresh identities without a newer weekly projection publication", async () => {
  const storage = memoryStorage();
  const oldProvider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetchFactory({ playerIdsPublishedAt: "2026-09-08T13:00:00Z" }), storage, now: () => Date.parse("2026-09-08T15:00:00Z") });
  const staged = await oldProvider.stage({ season: 2026, week: 2, projectionSet: null });
  oldProvider.saveReceipt({ season: 2026, week: 2, bundle: staged.bundle, diagnostics: staged.diagnostics, playerIdsPublishedAt: staged.playerIdsPublishedAt });

  const refreshedProvider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetchFactory({ playerIdsPublishedAt: "2026-09-08T14:30:00Z" }), storage, now: () => Date.parse("2026-09-08T15:00:00Z") });
  const result = await refreshedProvider.check({ season: 2026, week: 2, projectionSet: currentProjectionSet });
  assert.equal(result.status, "identity-refresh-available");
  assert.equal(result.canUpdate, true);
  assert.match(result.reason, /newer publication/i);
});

test("weekly update stages the stable bundle, D/ST bridge, diagnostics, crosswalk publication, and local receipt", async () => {
  const storage = memoryStorage();
  const provider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetchFactory(), storage, now: () => Date.parse("2026-09-08T15:00:00Z") });
  const staged = await provider.stage({ season: 2026, week: 2, projectionSet: null });
  assert.equal(staged.bundle.sourceRecordCount, 2);
  assert.equal(staged.bundle.mappedCount, 2);
  assert.equal(staged.bundle.derivedDefenseMappingCount, 1);
  assert.equal(staged.bundle.unresolvedProviderIds.length, 0);
  assert.equal(staged.diagnostics.unresolvedCount, 0);
  assert.equal(staged.playerIdsPublishedAt, "2026-09-08T13:00:00.000Z");
  assert.match(staged.bundle.identityMapCsv, /200,-16002/);

  const receipt = provider.saveReceipt({ season: 2026, week: 2, bundle: staged.bundle, diagnostics: staged.diagnostics, playerIdsPublishedAt: staged.playerIdsPublishedAt });
  assert.equal(receipt.mappedCount, 2);
  assert.equal(receipt.publishedAt, "2026-09-08T14:00:00.000Z");
  assert.equal(receipt.playerIdsPublishedAt, "2026-09-08T13:00:00.000Z");
  provider.clearCache();
  assert.equal(provider.readReceipt(2026, 2), null);
});
