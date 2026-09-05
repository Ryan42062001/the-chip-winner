import test from "node:test";
import assert from "node:assert/strict";
import { WeeklyProjectionUpdateProvider } from "../src/providers/projections/weekly-projection-update-provider.js";

const WEEKLY = `page,scrape_date,fantasypros_id,pos,r2p_pts,team,player_name\nqb,2026-09-08,100,QB,20.5,BUF,Test Quarterback\ndst,2026-09-08,200,DST,7.0,BUF,Buffalo Bills\n`;
const IDS = `fantasypros_id,espn_id\n100,9001\n`;
const COMMITS = JSON.stringify([{ commit: { committer: { date: "2026-09-08T14:00:00Z" } } }]);

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function fakeFetch(url) {
  const body = url.includes("fp_latest_weekly.csv") ? WEEKLY : url.includes("db_playerids.csv") ? IDS : COMMITS;
  return Promise.resolve({ ok: true, status: 200, text: async () => body });
}

test("weekly update check waits for a new publication before advancing ESPN week", async () => {
  const provider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetch, now: () => Date.parse("2026-09-08T15:00:00Z") });
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

test("weekly update check exposes a newer publication and marks current data as current", async () => {
  const provider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetch, now: () => Date.parse("2026-09-08T15:00:00Z") });
  const available = await provider.check({ season: 2026, week: 2, projectionSet: null });
  assert.equal(available.status, "available");
  assert.equal(available.canUpdate, true);
  assert.equal(available.firstImport, true);

  const current = await provider.check({ season: 2026, week: 2, projectionSet: {
    provider: "FantasyPros weekly r2p via DynastyProcess",
    scoringFormat: "PPR",
    season: 2026,
    capturedAt: "2026-09-08T14:00:00Z",
    projections: [{ providerPlayerId: "100", week: 2, points: 20.5, capturedAt: "2026-09-08T14:00:00Z" }]
  } });
  assert.equal(current.status, "current");
  assert.equal(current.canUpdate, false);
});

test("weekly update stages the stable bundle, D/ST bridge, diagnostics, and local receipt", async () => {
  const storage = memoryStorage();
  const provider = new WeeklyProjectionUpdateProvider({ fetchImpl: fakeFetch, storage, now: () => Date.parse("2026-09-08T15:00:00Z") });
  const staged = await provider.stage({ season: 2026, week: 2, projectionSet: null });
  assert.equal(staged.bundle.sourceRecordCount, 2);
  assert.equal(staged.bundle.mappedCount, 2);
  assert.equal(staged.bundle.derivedDefenseMappingCount, 1);
  assert.equal(staged.bundle.unresolvedProviderIds.length, 0);
  assert.equal(staged.diagnostics.unresolvedCount, 0);
  assert.match(staged.bundle.identityMapCsv, /200,-16002/);

  const receipt = provider.saveReceipt({ season: 2026, week: 2, bundle: staged.bundle, diagnostics: staged.diagnostics });
  assert.equal(receipt.mappedCount, 2);
  assert.equal(provider.readReceipt(2026, 2).publishedAt, "2026-09-08T14:00:00.000Z");
  provider.clearCache();
  assert.equal(provider.readReceipt(2026, 2), null);
});
