import test from "node:test";
import assert from "node:assert/strict";
import { finalizeManualProjectionReview, manualProjectionReviewToCsv, parseFantasyProsManualProjectionCsv } from "../scripts/lib/fantasypros-manual-csv.js";

test("manual FantasyPros CSV parser handles duplicate stat headers and formatting rows", () => {
  const csv = '"Player","Team","POS","ATT","YDS","TDS","REC","YDS","TDS","FL","FPTS"\n" "," ","",""\n"Known, Jr.","PHI","RB12","1","2","0","3","4","0","0","9.5"';
  const result = parseFantasyProsManualProjectionCsv(csv, { sourceFile: "FLX.csv", position: "FLX" });
  assert.deepEqual(result.records[0], { sourceFile: "FLX.csv", sourceRow: 3, playerName: "Known, Jr.", team: "PHI", position: "RB", points: 9.5, fantasyProsPlayerId: null, espnPlayerId: null });
  assert.equal(result.exclusions.length, 0);
});

test("manual projection finalizer emits only explicitly mapped rows", () => {
  const header = "provider,scoring_format,season,week,retrieved_at,source_file,source_row,fantasypros_player_id,espn_player_id,player_name_for_review_only,team_for_review_only,position_for_review_only,points";
  const result = finalizeManualProjectionReview(`${header}\nFantasyPros manual CSV,PPR,2026,1,2026-08-28T22:00:00Z,QB.csv,2,fp-1,espn-1,Review Name,PHI,QB,21.4\nFantasyPros manual CSV,PPR,2026,1,2026-08-28T22:00:00Z,QB.csv,3,,,Unmapped,DAL,QB,18.2\n`);
  assert.equal(result.approvedCount, 1); assert.equal(result.skippedCount, 1);
  assert.match(result.projectionsCsv, /fp-1,1,21.4/); assert.doesNotMatch(result.projectionsCsv, /Unmapped/);
  assert.equal(result.identityMapCsv, "provider_player_id,espn_player_id\nfp-1,espn-1\n");
});

test("manual projection finalizer rejects partially filled identity mappings", () => {
  const csv = "provider,scoring_format,season,week,retrieved_at,fantasypros_player_id,espn_player_id,points\nFantasyPros manual CSV,PPR,2026,1,2026-08-28T22:00:00Z,fp-1,,21.4";
  assert.throws(() => finalizeManualProjectionReview(csv), /only one player ID/);
});

test("manual FantasyPros CSV parser preserves DST labels and rejects missing point values", () => {
  const csv = 'Player,Team,SACK,FPTS\nDefense One,,,7.4\nDefense Two,,,';
  const result = parseFantasyProsManualProjectionCsv(csv, { sourceFile: "DST.csv", position: "DST" });
  assert.equal(result.records[0].position, "DST"); assert.equal(result.records[0].team, null);
  assert.deepEqual(result.exclusions, [{ sourceRow: 3, reason: "invalid-fpts" }]);
});

test("manual projection review output leaves both identity fields blank", () => {
  const parsed = parseFantasyProsManualProjectionCsv("Player,Team,FPTS\nExample,DAL,8.2", { sourceFile: "K.csv", position: "K" });
  const output = manualProjectionReviewToCsv(parsed.records, { season: 2026, week: 1, scoringFormat: "PPR", retrievedAt: "2026-08-28T22:00:00Z" });
  assert.match(output, /fantasypros_player_id,espn_player_id/);
  assert.match(output, /K.csv,2,,,Example,DAL,K,8.2/);
});
