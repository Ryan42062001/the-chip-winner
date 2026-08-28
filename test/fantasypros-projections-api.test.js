import test from "node:test";
import assert from "node:assert/strict";
import { identityReferenceToCsv, normalizeFantasyProsProjectionResponses, projectionSetToCsv } from "../scripts/lib/fantasypros-projections.js";

const metadata = { season: 2026, week: 1, scoring: "PPR", capturedAt: "2026-08-28T22:00:00Z" };

test("FantasyPros API projections retain stable IDs, explicit PPR points, and capture metadata", () => {
  const result = normalizeFantasyProsProjectionResponses([{ season: "2026", week: "1", scoring: "PPR", players: [{ fpid: 17240, name: "Known Player", position_id: "RB", team_id: "PHI", stats: [{ points: 10, points_ppr: 14.5, points_half: 12.25 }] }] }], metadata);
  assert.deepEqual(result.projectionSet.projections[0], { providerPlayerId: "17240", week: 1, points: 14.5 });
  assert.match(projectionSetToCsv(result.projectionSet), /FantasyPros API,PPR,2026,2026-08-28T22:00:00.000Z,17240,1,14.5/);
  assert.match(identityReferenceToCsv(result.identities), /17240,,Known Player,PHI,RB/);
});

test("FantasyPros API projections exclude missing IDs and requested scoring values without fallback", () => {
  const result = normalizeFantasyProsProjectionResponses([{ players: [{ name: "No ID", stats: { points_ppr: 5 } }, { fpid: 2, name: "No PPR", stats: { points: 6 } }, { fpid: 3, name: "Usable", stats: { points_ppr: 7 } }] }], metadata);
  assert.equal(result.projectionSet.projections.length, 1);
  assert.deepEqual(result.exclusions.map((item) => item.reason), ["missing-provider-player-id", "missing-points_ppr"]);
});

test("FantasyPros API projections reject mismatched source metadata and conflicting player-week values", () => {
  assert.throws(() => normalizeFantasyProsProjectionResponses([{ season: 2025, players: [] }], metadata), /does not match requested season/);
  assert.throws(() => normalizeFantasyProsProjectionResponses([{ players: [{ fpid: 3, stats: { points_ppr: 7 } }, { fpid: 3, stats: { points_ppr: 8 } }] }], metadata), /conflicting/);
});
