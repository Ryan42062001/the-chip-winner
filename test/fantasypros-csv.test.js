import test from "node:test";
import assert from "node:assert/strict";
import { parseFantasyProsRankingsCsv, validateFantasyProsRankingUsage } from "../src/providers/rankings/fantasypros-csv.js";

const csv = `"RK","PLAYER NAME",TEAM,"POS","SOS SEASON","SOS PLAYOFFS","ECR VS. ADP"
"1","Ja'Marr Chase",CIN,"WR1","4 out of 5 stars","3 out of 5 stars","+2"
"2","Jahmyr Gibbs",DET,"RB1","5 out of 5 stars","4 out of 5 stars","-1"`;

test("FantasyPros ranking CSV preserves rankings without turning them into projections", () => {
  const set = parseFantasyProsRankingsCsv(csv, { kind: "draft", season: 2026, expertFilter: "top-10 accuracy" });
  assert.equal(set.rankings[0].playerName, "Ja'Marr Chase");
  assert.equal(set.rankings[0].position, "WR");
  assert.equal(set.rankings[0].positionRank, 1);
  assert.equal(set.rankings[0].seasonScheduleStrength, 4);
  assert.equal(set.rankings[0].ecrVsAdp, 2);
  assert.equal(set.rankings[0].projection, undefined);
});

test("usage validation exposes metadata and identity limitations", () => {
  const set = parseFantasyProsRankingsCsv(csv, { kind: "draft", season: 2026 });
  const limitations = validateFantasyProsRankingUsage(set);
  assert.equal(limitations.length, 4);
  assert.match(limitations[0], /not identified as a rest-of-season/);
});

test("FantasyPros ranking CSV rejects unsupported position labels", () => {
  assert.throws(() => parseFantasyProsRankingsCsv(csv.replace("WR1", "FLEX1")), /Invalid position rank/);
});

