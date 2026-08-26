import test from "node:test";
import assert from "node:assert/strict";
import { attachExternalIdentity, buildIdentityRegistry, canonicalPlayerId, reconcileProviderRecords } from "../src/domain/identity.js";

const players = [
  { id: "101", name: "Same Name", externalIds: { projections: "p-1" } },
  { id: "102", name: "Same Name", externalIds: { projections: "p-2" } }
];

test("canonical identities require provider-owned ids", () => {
  assert.equal(canonicalPlayerId("ESPN", 101), "espn:101");
  assert.throws(() => canonicalPlayerId("espn", ""), /required/);
});

test("reconciliation uses stable ids and never display names", () => {
  const result = reconcileProviderRecords(players, "projections", [
    { providerPlayerId: "p-2", name: "Wrong Display Name", projection: 10 },
    { providerPlayerId: "unmapped", name: "Same Name", projection: 12 },
    { name: "Same Name", projection: 13 }
  ]);
  assert.equal(result.matched[0].playerId, "102");
  assert.deepEqual(result.unresolved.map((item) => item.reason), ["identity_not_mapped", "missing_provider_player_id"]);
});

test("registry reports conflicting provider mappings", () => {
  const conflictPlayers = [...players, { id: "103", externalIds: { projections: "p-1" } }];
  assert.equal(buildIdentityRegistry(conflictPlayers).conflicts[0].key, "projections:p-1");
});

test("external identities attach immutably and reject collisions", () => {
  const attached = attachExternalIdentity(players, "101", "news", 88);
  assert.equal(attached[0].externalIds.news, "88");
  assert.equal(players[0].externalIds.news, undefined);
  assert.throws(() => attachExternalIdentity(players, "102", "projections", "p-1"), /already mapped/);
});
