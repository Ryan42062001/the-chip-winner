import test from "node:test";
import assert from "node:assert/strict";
import { buildDynastyProcessWeeklyBundle, deriveEspnDefensePlayerId, parseDynastyProcessPlayerIdsCsv, parseDynastyProcessWeeklyCsv } from "../scripts/lib/dynastyprocess-weekly.js";
import { parseFutureProjectionCsv } from "../src/providers/projections/future-projection-provider.js";
import { parseProjectionIdentityMapCsv } from "../src/providers/projections/projection-identity-map.js";

const weeklyHeader = "page,scrape_date,fantasypros_id,player_name,team,pos,r2p_pts";

test("DynastyProcess weekly parser keeps only supported PPR pages and preserves source zeroes", () => {
  const source = [
    weeklyHeader,
    'qb,2026-09-04,19196,"Joe Burrow",CIN,QB,21.4',
    'ppr-rb,2026-09-04,22968,"Jahmyr Gibbs",DET,RB,21.6',
    'rb,2026-09-04,99999,"Standard Only",DET,RB,18.0',
    'ppr-wr,2026-09-04,10001,"Receiver, Jr.",BUF,WR,0.0',
    'ppr-te,2026-09-04,10002,"Missing Points",KC,TE,NA'
  ].join("\n");
  const parsed = parseDynastyProcessWeeklyCsv(source);
  assert.equal(parsed.sourceDate, "2026-09-04");
  assert.deepEqual(parsed.records.map((item) => [item.providerPlayerId, item.position, item.teamCode, item.points]), [
    ["19196", "QB", "CIN", 21.4],
    ["22968", "RB", "DET", 21.6],
    ["10001", "WR", "BUF", 0]
  ]);
  assert.deepEqual(parsed.exclusions, [{ sourceRow: 6, providerPlayerId: "10002", reason: "invalid-r2p-points" }]);
});

test("DynastyProcess weekly parser rejects mixed scrape dates and duplicate stable IDs", () => {
  assert.throws(() => parseDynastyProcessWeeklyCsv([
    weeklyHeader,
    "qb,2026-09-04,1,One,ATL,QB,10",
    "ppr-rb,2026-09-05,2,Two,BUF,RB,10"
  ].join("\n")), /mixed scrape dates/);
  assert.throws(() => parseDynastyProcessWeeklyCsv([
    weeklyHeader,
    "qb,2026-09-04,1,One,ATL,QB,10",
    "qb,2026-09-04,1,One Again,ATL,QB,11"
  ].join("\n")), /duplicate FantasyPros IDs/);
});

test("DynastyProcess weekly parser requires a team code for D/ST rows", () => {
  const parsed = parseDynastyProcessWeeklyCsv([
    weeklyHeader,
    "dst,2026-09-04,8140,Jacksonville Jaguars,,DST,7.4",
    "qb,2026-09-04,19196,Joe Burrow,CIN,QB,21.4"
  ].join("\n"));
  assert.deepEqual(parsed.records.map((item) => item.providerPlayerId), ["19196"]);
  assert.deepEqual(parsed.exclusions, [{ sourceRow: 2, providerPlayerId: "8140", reason: "missing-defense-team-code" }]);
});

test("ESPN D/ST synthetic IDs derive only from explicit pro-team codes", () => {
  const canonicalTeams = {
    ATL: "-16001", BUF: "-16002", CHI: "-16003", CIN: "-16004", CLE: "-16005", DAL: "-16006", DEN: "-16007", DET: "-16008",
    GB: "-16009", TEN: "-16010", IND: "-16011", KC: "-16012", LV: "-16013", LAR: "-16014", MIA: "-16015", MIN: "-16016",
    NE: "-16017", NO: "-16018", NYG: "-16019", NYJ: "-16020", PHI: "-16021", ARI: "-16022", PIT: "-16023", LAC: "-16024",
    SF: "-16025", SEA: "-16026", TB: "-16027", WSH: "-16028", CAR: "-16029", JAX: "-16030", BAL: "-16033", HOU: "-16034"
  };
  assert.equal(Object.keys(canonicalTeams).length, 32);
  for (const [teamCode, expected] of Object.entries(canonicalTeams)) assert.equal(deriveEspnDefensePlayerId(teamCode), expected, teamCode);
  assert.equal(new Set(Object.values(canonicalTeams)).size, 32);
  assert.equal(deriveEspnDefensePlayerId("WAS"), "-16028");
  assert.equal(deriveEspnDefensePlayerId("JAC"), "-16030");
  assert.equal(deriveEspnDefensePlayerId("unknown"), null);
  assert.equal(deriveEspnDefensePlayerId(""), null);
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
    "qb,2026-09-04,19196,Joe Burrow,CIN,QB,21.4",
    "ppr-rb,2026-09-04,22968,Jahmyr Gibbs,DET,RB,21.6"
  ].join("\n");
  const playerIdsCsv = [
    "fantasypros_id,espn_id,name",
    "19196,3915511,Joe Burrow"
  ].join("\n");
  const publishedAt = "2026-09-04T18:30:00Z";
  const bundle = buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 1, publishedAt });
  assert.equal(bundle.scoringFormat, "PPR");
  assert.equal(bundle.mappedCount, 1);
  assert.equal(bundle.derivedDefenseMappingCount, 0);
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

test("DynastyProcess bundle derives D/ST ESPN IDs from explicit team codes", () => {
  const weeklyCsv = [
    weeklyHeader,
    "qb,2026-09-04,19196,Joe Burrow,CIN,QB,21.4",
    "dst,2026-09-04,8140,Jacksonville Jaguars,JAC,DST,7.4",
    "dst,2026-09-04,8250,Los Angeles Chargers,LAC,DST,7.4",
    "dst,2026-09-04,8020,Baltimore Ravens,BAL,DST,6.1",
    "dst,2026-09-04,8340,Houston Texans,HOU,DST,5.0"
  ].join("\n");
  const playerIdsCsv = [
    "fantasypros_id,espn_id,name",
    "19196,3915511,Joe Burrow"
  ].join("\n");
  const publishedAt = "2026-09-04T18:30:00Z";
  const bundle = buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 1, publishedAt });
  assert.equal(bundle.mappedCount, 5);
  assert.equal(bundle.derivedDefenseMappingCount, 4);
  assert.deepEqual(bundle.unresolvedProviderIds, []);
  assert.deepEqual(parseProjectionIdentityMapCsv(bundle.identityMapCsv), [
    { providerPlayerId: "19196", espnPlayerId: "3915511" },
    { providerPlayerId: "8140", espnPlayerId: "-16030" },
    { providerPlayerId: "8250", espnPlayerId: "-16024" },
    { providerPlayerId: "8020", espnPlayerId: "-16033" },
    { providerPlayerId: "8340", espnPlayerId: "-16034" }
  ]);
});

test("DynastyProcess bundle rejects a conflicting direct D/ST mapping", () => {
  const weeklyCsv = [
    weeklyHeader,
    "qb,2026-09-04,19196,Joe Burrow,CIN,QB,21.4",
    "dst,2026-09-04,8140,Jacksonville Jaguars,JAC,DST,7.4"
  ].join("\n");
  const playerIdsCsv = [
    "fantasypros_id,espn_id,name",
    "19196,3915511,Joe Burrow",
    "8140,-16029,Jacksonville Jaguars"
  ].join("\n");
  assert.throws(() => buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 1, publishedAt: "2026-09-04T18:30:00Z" }), /conflicting ESPN IDs/);
});

test("DynastyProcess bundle requires explicit week, matching season, and publication provenance", () => {
  const weeklyCsv = [weeklyHeader, "qb,2026-09-04,19196,Joe Burrow,CIN,QB,21.4"].join("\n");
  const playerIdsCsv = ["fantasypros_id,espn_id", "19196,3915511"].join("\n");
  assert.throws(() => buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 0, publishedAt: "2026-09-04T18:30:00Z" }), /explicit NFL week/);
  assert.throws(() => buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2025, week: 1, publishedAt: "2026-09-04T18:30:00Z" }), /does not match requested season/);
  assert.throws(() => buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 1, publishedAt: "not-a-date" }), /publication timestamp/);
});
