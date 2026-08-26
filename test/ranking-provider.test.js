import test from "node:test";
import assert from "node:assert/strict";
import { FantasyProsRankingProvider, reconcileFantasyProsRankings } from "../src/providers/rankings/ranking-provider.js";

const rankingSet = { rankings: [
  { rank: 1, playerName: "Ja'Marr Chase", team: "CIN", position: "WR" },
  { rank: 2, playerName: "Brian Thomas Jr.", team: "JAX", position: "WR" },
  { rank: 3, playerName: "Unknown Player", team: "FA", position: "RB" }
] };

test("ranking reconciliation requires exact composite identity", () => {
  const result = reconcileFantasyProsRankings([
    { id: "1", name: "Ja'Marr Chase", proTeam: "CIN", position: "WR" },
    { id: "2", name: "Brian Thomas Jr", proTeam: "JAC", position: "WR" },
    { id: "3", name: "Ja'Marr Chase", proTeam: "CIN", position: "RB" }
  ], rankingSet);
  assert.equal(result.byPlayerId["1"].rank, 1);
  assert.equal(result.byPlayerId["2"].rank, 2);
  assert.equal(result.byPlayerId["3"], undefined);
  assert.equal(result.unresolved.length, 1);
});

test("ambiguous composite identities are conflicts, not automatic matches", () => {
  const players = [
    { id: "1", name: "Example Player", proTeam: "BUF", position: "RB" },
    { id: "2", name: "Example Player", proTeam: "BUF", position: "RB" }
  ];
  const result = reconcileFantasyProsRankings(players, { rankings: [{ rank: 1, playerName: "Example Player", team: "BUF", position: "RB" }] });
  assert.equal(Object.keys(result.byPlayerId).length, 0);
  assert.equal(result.conflicts.length, 1);
});

test("ranking provider caches normalized imports locally", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const provider = new FantasyProsRankingProvider({ storage });
  const csv = '"RK","PLAYER NAME",TEAM,"POS"\n"1","Ja\'Marr Chase",CIN,"WR1"';
  provider.importCsv(csv, { kind: "rest-of-season", season: 2026, scoringFormat: "PPR", expertFilter: "top-10" });
  assert.equal(provider.readCache().rankings[0].rank, 1);
  provider.clearCache();
  assert.equal(provider.readCache(), null);
});

