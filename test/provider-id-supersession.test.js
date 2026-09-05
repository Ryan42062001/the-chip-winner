import test from "node:test";
import assert from "node:assert/strict";
import { buildDynastyProcessWeeklyBundle } from "../scripts/lib/dynastyprocess-weekly.js";
import { ProjectionIdentityMapProvider, parseProjectionIdentityMapCsv } from "../src/providers/projections/projection-identity-map.js";

const weeklyHeader = "page,scrape_date,fantasypros_id,player_name,team,pos,r2p_pts";
const publishedAt = "2026-09-04T18:30:00Z";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test("DynastyProcess stages Roman Wilson's reviewed FantasyPros ID supersession", () => {
  const bundle = buildDynastyProcessWeeklyBundle({
    weeklyCsv: [
      weeklyHeader,
      "qb,2026-09-04,19196,Joe Burrow,CIN,QB,21.4",
      "ppr-wr,2026-09-04,28896,Roman Wilson,PIT,WR,8.7"
    ].join("\n"),
    playerIdsCsv: [
      "fantasypros_id,espn_id,name",
      "19196,3915511,Joe Burrow",
      "26160,4431492,Roman Wilson"
    ].join("\n"),
    season: 2026,
    week: 1,
    publishedAt
  });

  assert.equal(bundle.mappedCount, 2);
  assert.equal(bundle.providerSupersessionMappingCount, 1);
  assert.deepEqual(bundle.unresolvedProviderIds, []);
  assert.deepEqual(parseProjectionIdentityMapCsv(bundle.identityMapCsv), [
    { providerPlayerId: "19196", espnPlayerId: "3915511" },
    { providerPlayerId: "28896", espnPlayerId: "4431492", supersedesProviderPlayerId: "26160" }
  ]);

  const identityProvider = new ProjectionIdentityMapProvider({ storage: memoryStorage() });
  identityProvider.importCsv("provider_player_id,espn_player_id\n26160,4431492");
  const merged = identityProvider.mergeCsv(bundle.identityMapCsv);
  assert.equal(merged.get("26160"), "4431492");
  assert.equal(merged.get("28896"), "4431492");
});

test("reviewed provider ID supersession fails closed without exact predecessor evidence", () => {
  const weeklyCsv = [
    weeklyHeader,
    "qb,2026-09-04,19196,Joe Burrow,CIN,QB,21.4",
    "ppr-wr,2026-09-04,28896,Roman Wilson,PIT,WR,8.7"
  ].join("\n");

  const missingPredecessor = buildDynastyProcessWeeklyBundle({
    weeklyCsv,
    playerIdsCsv: ["fantasypros_id,espn_id", "19196,3915511"].join("\n"),
    season: 2026,
    week: 1,
    publishedAt
  });
  assert.equal(missingPredecessor.providerSupersessionMappingCount, 0);
  assert.deepEqual(missingPredecessor.unresolvedProviderIds, ["28896"]);

  assert.throws(() => buildDynastyProcessWeeklyBundle({
    weeklyCsv,
    playerIdsCsv: [
      "fantasypros_id,espn_id",
      "19196,3915511",
      "26160,9999999"
    ].join("\n"),
    season: 2026,
    week: 1,
    publishedAt
  }), /supersession 26160 -> 28896 expected ESPN ID 4431492.*9999999/);
});

test("a future direct current FantasyPros mapping automatically replaces the reviewed supersession", () => {
  const bundle = buildDynastyProcessWeeklyBundle({
    weeklyCsv: [weeklyHeader, "ppr-wr,2026-09-04,28896,Roman Wilson,PIT,WR,8.7"].join("\n"),
    playerIdsCsv: ["fantasypros_id,espn_id", "28896,4431492"].join("\n"),
    season: 2026,
    week: 1,
    publishedAt
  });

  assert.equal(bundle.mappedCount, 1);
  assert.equal(bundle.providerSupersessionMappingCount, 0);
  assert.deepEqual(parseProjectionIdentityMapCsv(bundle.identityMapCsv), [
    { providerPlayerId: "28896", espnPlayerId: "4431492" }
  ]);
});
