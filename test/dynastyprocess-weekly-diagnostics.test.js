import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyDynastyProcessWeeklyGaps,
  parseEspnFantasyPlayerPool
} from "../scripts/lib/dynastyprocess-weekly-diagnostics.js";

const weeklyHeader = "page,scrape_date,fantasypros_id,player_name,team,pos,r2p_pts";
const weeklyCsv = [
  weeklyHeader,
  "qb,2026-09-04,10001,Missing Quarterback,DET,QB,0.0",
  "ppr-te,2026-09-04,10002,Teamless Tight End,DAL,TE,0.5",
  "ppr-wr,2026-09-04,10003,Known Receiver,CIN,WR,5.4",
  "ppr-rb,2026-09-04,10004,Mismatch Runner,CAR,RB,2.0",
  "ppr-wr,2026-09-04,10005,Stale Free Agent,FA,WR,0.0",
  "ppr-rb,2026-09-04,10006,True Free Agent,FA,RB,0.0",
  "k,2026-09-04,9019,Andrew Wellock,CAR,K,6.6",
  "ppr-te,2026-09-04,10007,Duplicate Name,MIN,TE,0.0",
  "ppr-wr,2026-09-04,10008,Unknown Team,XYZ,WR,0.0"
].join("\n");
const unresolved = ["10001", "10002", "10003", "10004", "10005", "10006", "9019", "10007", "10008"];

function player(id, fullName, defaultPositionId, proTeamId) {
  return { id, fullName, defaultPositionId, proTeamId, active: true };
}

test("ESPN Fantasy pool parser unwraps supported payload shapes without inventing fields", () => {
  const parsed = parseEspnFantasyPlayerPool({
    players: [
      { player: player(1, "One Player", 1, 8) },
      { playerPoolEntry: { player: player(2, "Two Player", 2, 0) } },
      player(3, "Three Player", 3, 4),
      { player: { id: null, fullName: "Missing ID" } }
    ]
  });
  assert.deepEqual(parsed, [
    { id: "1", fullName: "One Player", defaultPositionId: 1, proTeamId: 8, active: true },
    { id: "2", fullName: "Two Player", defaultPositionId: 2, proTeamId: 0, active: true },
    { id: "3", fullName: "Three Player", defaultPositionId: 3, proTeamId: 4, active: true }
  ]);
});

test("unresolved weekly diagnostics classify exclusion causes without creating identity mappings", () => {
  const espnFantasyPlayers = parseEspnFantasyPlayerPool({ players: [
    player(20002, "Teamless Tight End", 4, 0),
    player(20003, "Known Receiver", 3, 4),
    player(20004, "Mismatch Runner", 2, 8),
    player(20005, "Stale Free Agent", 3, 6),
    player(20006, "True Free Agent", 2, 0),
    player(20007, "Duplicate Name", 4, 16),
    player(30007, "Duplicate Name", 4, 16),
    player(20008, "Unknown Team", 3, 0)
  ] });

  const result = classifyDynastyProcessWeeklyGaps({ weeklyCsv, unresolvedProviderIds: unresolved, espnFantasyPlayers });
  assert.equal(result.unresolvedCount, 9);
  assert.equal(result.espnFantasyPoolAvailable, true);
  assert.match(result.method, /never used for identity mapping/);
  assert.deepEqual(result.counts, {
    "espn-fantasy-missing": 1,
    "espn-fantasy-team-unassigned": 1,
    "espn-fantasy-present-crosswalk-missing": 1,
    "espn-fantasy-team-mismatch": 1,
    "weekly-source-team-stale": 1,
    "espn-fantasy-free-agent-crosswalk-missing": 1,
    "reviewed-stale-source-row": 1,
    "espn-fantasy-ambiguous": 1,
    "weekly-source-team-unknown": 1
  });

  const byId = new Map(result.rows.map((row) => [row.providerPlayerId, row]));
  assert.equal(byId.get("10001").status, "espn-fantasy-missing");
  assert.deepEqual(
    { status: byId.get("10002").status, observed: byId.get("10002").observedProTeamId, expected: byId.get("10002").expectedProTeamId },
    { status: "espn-fantasy-team-unassigned", observed: 0, expected: 6 }
  );
  assert.equal(byId.get("10003").status, "espn-fantasy-present-crosswalk-missing");
  assert.equal(byId.get("10004").status, "espn-fantasy-team-mismatch");
  assert.equal(byId.get("10005").status, "weekly-source-team-stale");
  assert.equal(byId.get("10006").status, "espn-fantasy-free-agent-crosswalk-missing");
  assert.equal(byId.get("9019").status, "reviewed-stale-source-row");
  assert.match(byId.get("9019").reason, /Andrew Wellock/);
  assert.equal(byId.get("10007").candidateCount, 2);
  assert.equal(byId.get("10008").status, "weekly-source-team-unknown");
  for (const row of result.rows) assert.equal(Object.hasOwn(row, "espnPlayerId"), false);
});

test("diagnostics fail back to stable-ID status when ESPN Fantasy is unavailable", () => {
  const result = classifyDynastyProcessWeeklyGaps({
    weeklyCsv,
    unresolvedProviderIds: ["10001", "9019"]
  });
  assert.equal(result.espnFantasyPoolAvailable, false);
  assert.deepEqual(result.counts, {
    "stable-crosswalk-missing": 1,
    "reviewed-stale-source-row": 1
  });
  assert.equal(result.rows.find((row) => row.providerPlayerId === "10001").status, "stable-crosswalk-missing");
  assert.equal(result.rows.find((row) => row.providerPlayerId === "9019").status, "reviewed-stale-source-row");
  assert.throws(() => classifyDynastyProcessWeeklyGaps({ weeklyCsv, unresolvedProviderIds: ["does-not-exist"] }), /were not present/);
});
