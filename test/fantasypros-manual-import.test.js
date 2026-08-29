import test from "node:test";
import assert from "node:assert/strict";
import { buildApprovedManualImports, fantasyProsProviderId, parseManualFantasyProsExport } from "../src/providers/projections/fantasypros-manual-import.js";

test("browser manual importer preserves source rows and explicit missing values", () => {
  const records = parseManualFantasyProsExport('Player,Team,POS,FPTS\n"Known, Jr.",PHI,RB12,9.5\nMissing,DAL,RB,', { fileName: "FLX.csv", fallbackPosition: "FLX" });
  assert.deepEqual(records, [{ sourceKey: "FLX.csv:2", sourceFile: "FLX.csv", sourceRow: 2, playerName: "Known, Jr.", team: "PHI", position: "RB", points: 9.5 }]);
});

test("FantasyPros profile URLs provide explicit provider-owned slugs", () => {
  assert.equal(fantasyProsProviderId("https://www.fantasypros.com/nfl/players/jalen-hurts.php"), "fantasypros:jalen-hurts");
  assert.equal(fantasyProsProviderId("https://www.fantasypros.com/nfl/projections/jalen-hurts.php"), "fantasypros:jalen-hurts");
  assert.throws(() => fantasyProsProviderId("https://example.com/nfl/players/jalen-hurts.php"), /FantasyPros URL/);
});

test("manual imports activate only explicitly approved URL and ESPN mappings", () => {
  const records = parseManualFantasyProsExport("Player,Team,FPTS\nOne,PHI,21.2\nTwo,DAL,19", { fileName: "QB.csv", fallbackPosition: "QB" });
  const result = buildApprovedManualImports({ records, approvals: [{ sourceKey: "QB.csv:2", profileUrl: "https://www.fantasypros.com/nfl/players/one.php", espnPlayerId: "espn-1" }], season: 2026, week: 1, scoringFormat: "PPR", capturedAt: "2026-08-28T22:00:00Z" });
  assert.equal(result.count, 1); assert.match(result.projectionsCsv, /fantasypros:one/); assert.doesNotMatch(result.projectionsCsv, /Two/); assert.match(result.identityMapCsv, /espn-1/);
});
