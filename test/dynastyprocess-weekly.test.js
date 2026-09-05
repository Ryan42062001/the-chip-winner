import test from "node:test";
import assert from "node:assert/strict";
import { buildDynastyProcessWeeklyBundle, parseDynastyProcessPlayerIdsCsv, parseDynastyProcessWeeklyCsv } from "../scripts/lib/dynastyprocess-weekly.js";
import { parseFutureProjectionCsv } from "../src/providers/projections/future-projection-provider.js";
import { parseProjectionIdentityMapCsv } from "../src/providers/projections/projection-identity-map.js";

const weeklyHeader = "page,scrape_date,fantasypros_id,player_name,pos,r2p_pts";

test("DynastyProcess weekly parser keeps only supported PPR pages and preserves source zeroes", () => {
  const source = [
    weeklyHeader,
    'qb,2026-09-04,19196,"Joe Burrow",QB,21.4',
    'ppr-rb,2026-09-04,22968,"Jahmyr Gibbs",RB,21.6',
    'rb,2026-09-04,99999,"Standard Only",RB,18.0',
    'ppr-wr,2026-09-04,10001,"Receiver, Jr.",WR,0.0',
    'ppr-te,2026-09-04,10002,"Missing Points",TE,NA'
  ].join("\n");
  const parsed = parseDynastyProcessWeeklyCsv(source);
  assert.equal(parsed.sourceDate, "2026-09-04");
  assert.deepEqual(parsed.records.map((item) => [item.providerPlayerId, item.position, item.points]), [
    ["19196", "QB", 21.4],
    ["22968", "RB", 21.6],
    ["10001", "WR", 0]
  ]);
  assert.deepEqual(parsed.exclusions, [{ sourceRow: 6, providerPlayerId: "10002", reason: "invalid-r2p-points" }]);
});

test("DynastyProcess weekly parser rejects mixed scrape dates and duplicate stable IDs", () => {
  assert.throws(() => parseDynastyProcessWeeklyCsv([
    weeklyHeader,
    "qb,2026-09-04,1,One,QB,10",
    "ppr-rb,2026-09-05,2,Two,RB,10"
  ].join("\n")), /mixed scrape dates/);
  assert.throws(() => parseDynastyProcessWeeklyCsv([
    weeklyHeader,
    "qb,2026-09-04,1,One,QB,10",
    "qb,2026-09-04,1,One Again,QB,11"
  ].join("\n")), /duplicate FantasyPros IDs/);
});

test("DynastyProcess player ID parser joins stable IDs and rejects ambiguous mappings", () => {
  const parsed = parseDynastyProcessPlayerIdsCsv([
    "fantasypros_id,espn_id,name",
    "19196,3915511,Joe Burrow",
    "22968,4429795,Jahmyr Gibbs",
    "NA,12345,Missing Provider",
    "10001,NA,Missing ESPN"
  ].join("\n"));
  assert.equal(parsed.map.get("19196"), "3915511");
  assert.equal(parsed.map.get("22968"), "4429795");
  assert.equal(parsed.skippedCount, 2);
  assert.throws(() => parseDynastyProcessPlayerIdsCsv([
    "fantasypros_id,espn_id",
    "1,10",
    "1,11"
  ].join("\n")), /maps to more than one ESPN player/);
  assert.throws(() => parseDynastyProcessPlayerIdsCsv([
    "fantasypros_id,espn_id",
    "1,10",
    "2,10"
  ].join("\n")), /maps to more than one FantasyPros player/);
});

test("DynastyProcess bundle emits existing projection and identity contracts without name joins", () => {
  const weeklyCsv = [
    weeklyHeader,
    "qb,2026-09-04,19196,Joe Burrow,QB,21.4",
    "ppr-rb,2026-09-04,22968,Jahmyr Gibbs,RB,21.6"
  ].join("\n");
  const playerIdsCsv = [
    "fantasypros_id,espn_id,name",
    "19196,3915511,Joe Burrow"
  ].join("\n");
  const publishedAt = "2026-09-04T18:30:00Z";
  const bundle = buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 1, publishedAt });
  assert.equal(bundle.scoringFormat, "PPR");
  assert.equal(bundle.mappedCount, 1);
  assert.deepEqual(bundle.unresolvedProviderIds, ["22968"]);
  assert.ok(!bundle.projectionsCsv.includes("Joe Burrow"));
  assert.ok(!bundle.identityMapCsv.includes("Joe Burrow"));

  const projectionSet = parseFutureProjectionCsv(bundle.projectionsCsv);
  assert.equal(projectionSet.provider, "FantasyPros weekly r2p via DynastyProcess");
  assert.equal(projectionSet.scoringFormat, "PPR");
  assert.equal(projectionSet.season, 2026);
  assert.deepEqual(projectionSet.projections, [{ providerPlayerId: "19196", week: 1, points: 21.4, capturedAt: publishedAt }]);
  assert.deepEqual(parseProjectionIdentityMapCsv(bundle.identityMapCsv), [{ providerPlayerId: "19196", espnPlayerId: "3915511" }]);
});

test("DynastyProcess bundle requires explicit week, matching season, and publication provenance", () => {
  const weeklyCsv = [weeklyHeader, "qb,2026-09-04,19196,Joe Burrow,QB,21.4"].join("\n");
  const playerIdsCsv = ["fantasypros_id,espn_id", "19196,3915511"].join("\n");
  assert.throws(() => buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 0, publishedAt: "2026-09-04T18:30:00Z" }), /explicit NFL week/);
  assert.throws(() => buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2025, week: 1, publishedAt: "2026-09-04T18:30:00Z" }), /does not match requested season/);
  assert.throws(() => buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 1, publishedAt: "not-a-date" }), /publication timestamp/);
});
