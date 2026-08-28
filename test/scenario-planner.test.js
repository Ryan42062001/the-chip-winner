import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectionGapReport, buildScenarioPlan } from "../src/domain/scenario-planner.js";
import sampleSnapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };

test("scenario planner reports missing future inputs honestly", () => {
  const result = buildScenarioPlan(sampleSnapshot, sampleSnapshot.teams[0].id);
  assert.equal(result.status, "missing-future-inputs");
  assert.equal(result.weeks.length, 0);
});

test("scenario planner requires projection data and identity mapping for future weeks", () => {
  const result = buildScenarioPlan(sampleSnapshot, sampleSnapshot.teams[0].id, { weeks: [15, 16] });
  assert.equal(result.status, "missing-future-inputs");
  assert.deepEqual(result.weeks, [15, 16]);
  assert.equal(result.scenarios.length, 0);
});

test("scenario planner reports zero coverage when no projection source is imported", () => {
  const result = buildScenarioPlan(sampleSnapshot, sampleSnapshot.teams[0].id, { weeks: [15, 16] });
  assert.equal(result.source, null);
  assert.deepEqual(result.coverage, { completeWeeks: 0, totalWeeks: 0, mappedProjectionCells: 0, requiredProjectionCells: 0, unmappedPlayerCells: 0, missingProjectionCells: 0, percentage: 0 });
});

test("scenario planner calculates a weekly baseline from explicitly mapped projections", () => {
  const teamId = sampleSnapshot.teams[0].id;
  const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const identityMap = new Map(roster.entries.map((entry) => [`provider-${entry.playerId}`, entry.playerId]));
  const projectionSet = { projections: roster.entries.map((entry, index) => ({ providerPlayerId: `provider-${entry.playerId}`, week: 15, points: 10 + index })) };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet });
  assert.equal(result.status, "ready");
  assert.equal(result.weeklyBaseline.length, 1);
  assert.equal(result.weeklyBaseline[0].week, 15);
  assert.equal(result.weeklyBaseline[0].projectedTotal > 0, true);
  assert.equal(result.weeklyBaseline[0].completeCoverage, true);
  assert.equal(result.weeklyBaseline[0].mappedProjectionCount, roster.entries.length);
  assert.deepEqual(result.coverage, { completeWeeks: 1, totalWeeks: 1, mappedProjectionCells: roster.entries.length, requiredProjectionCells: roster.entries.length, unmappedPlayerCells: 0, missingProjectionCells: 0, percentage: 100 });
});

test("scenario planner compares an isolated add drop move without mutating ESPN state", () => {
  const teamId = sampleSnapshot.teams[0].id;
  const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const dropPlayerId = roster.entries.at(-1).playerId;
  const addPlayer = sampleSnapshot.players.find((player) => !roster.entries.some((entry) => entry.playerId === player.id));
  const identityMap = new Map(sampleSnapshot.players.map((player) => [`provider-${player.id}`, player.id]));
  const projectionSet = { projections: sampleSnapshot.players.map((player) => ({ providerPlayerId: `provider-${player.id}`, week: 15, points: player.id === addPlayer.id ? 30 : 10 })) };
  const before = JSON.stringify(sampleSnapshot);
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet, scenarios: [{ id: "move-1", addPlayerId: addPlayer.id, dropPlayerId }] });
  assert.equal(result.scenarios.length, 1);
  assert.equal(result.scenarios[0].weekly[0].delta != null, true);
  assert.equal(JSON.stringify(sampleSnapshot), before);
});

test("scenario planner labels partial roster projection coverage", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId); const playerId = roster.entries[0].playerId;
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap: new Map([["provider-one", playerId]]), projectionSet: { projections: [{ providerPlayerId: "provider-one", week: 15, points: 20 }] } });
  assert.equal(result.weeklyBaseline[0].mappedProjectionCount, 1);
  assert.equal(result.weeklyBaseline[0].completeCoverage, false);
  assert.equal(result.weeklyBaseline[0].unmappedPlayerIds.length, roster.entries.length - 1);
  assert.deepEqual(result.weeklyBaseline[0].missingProjectionPlayerIds, []);
});

test("scenario planner distinguishes missing weekly values from missing identity mappings", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const identityMap = new Map(roster.entries.map((entry) => [`provider-${entry.playerId}`, entry.playerId]));
  const projectionSet = { projections: [{ providerPlayerId: `provider-${roster.entries[0].playerId}`, week: 15, points: 20 }] };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet });
  assert.deepEqual(result.weeklyBaseline[0].unmappedPlayerIds, []);
  assert.equal(result.weeklyBaseline[0].missingProjectionPlayerIds.length, roster.entries.length - 1);
  assert.equal(result.coverage.unmappedPlayerCells, 0);
  assert.equal(result.coverage.missingProjectionCells, roster.entries.length - 1);
});

test("scenario planner rejects starter drops and unavailable adds", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId); const starter = roster.entries.find((entry) => entry.lineupSlot !== "BE" && entry.lineupSlot !== "IR");
  const identityMap = new Map(sampleSnapshot.players.map((player) => [`p-${player.id}`, player.id])); const projectionSet = { projections: sampleSnapshot.players.map((player) => ({ providerPlayerId: `p-${player.id}`, week: 15, points: 10 })) };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet, scenarios: [{ id: "illegal", addPlayerId: sampleSnapshot.players[0].id, dropPlayerId: starter.playerId }], now: 0 });
  assert.equal(result.scenarios.length, 0);
  assert.match(result.rejectedScenarios[0].reason, /bench/);
});

test("scenario planner suppresses move deltas when either roster has partial coverage", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId); const drop = roster.entries.find((entry) => entry.lineupSlot === "BE"); const add = sampleSnapshot.players.find((player) => sampleSnapshot.availablePlayers?.includes(player.id));
  const identityMap = new Map([[`p-${add.id}`, add.id]]); const projectionSet = { projections: [{ providerPlayerId: `p-${add.id}`, week: 15, points: 30 }] };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet, scenarios: [{ addPlayerId: add.id, dropPlayerId: drop.playerId }], now: 0 });
  assert.equal(result.scenarios[0].weekly[0].delta, null);
  assert.equal(result.scenarios[0].weekly[0].completeCoverage, false);
  assert.equal(result.scenarios[0].weekly[0].unmappedPlayerIds.length > 0, true);
  assert.match(result.scenarios[0].weekly[0].deltaUnavailableReason, /Baseline roster projection coverage is incomplete/);
});

test("scenario planner reports the scenario-only player input that blocks a delta", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId); const drop = roster.entries.find((entry) => entry.lineupSlot === "BE"); const add = sampleSnapshot.players.find((player) => sampleSnapshot.availablePlayers.includes(player.id));
  const identityMap = new Map(roster.entries.map((entry) => [`p-${entry.playerId}`, entry.playerId]));
  const projectionSet = { projections: roster.entries.map((entry) => ({ providerPlayerId: `p-${entry.playerId}`, week: 15, points: 10 })) };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet, scenarios: [{ addPlayerId: add.id, dropPlayerId: drop.playerId }], now: 0 });
  assert.deepEqual(result.scenarios[0].weekly[0].unmappedPlayerIds, [add.id]);
  assert.equal(result.scenarios[0].weekly[0].delta, null);
  assert.match(result.scenarios[0].weekly[0].deltaUnavailableReason, /Scenario roster projection coverage is incomplete/);
});

test("scenario planner exposes projection provenance without inferring missing metadata", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId); const identityMap = new Map(roster.entries.map((entry) => [`provider-${entry.playerId}`, entry.playerId]));
  const projectionSet = { provider: "fixture-provider", scoringFormat: "PPR", capturedAt: "2026-10-08T12:00:00Z", projections: roster.entries.map((entry) => ({ providerPlayerId: `provider-${entry.playerId}`, week: 15, points: 10 })) };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet });
  assert.deepEqual(result.source, { provider: "fixture-provider", scoringFormat: "PPR", capturedAt: "2026-10-08T12:00:00Z", projectionCount: roster.entries.length, identityMappingCount: roster.entries.length });
});

test("projection gap report separates mapping gaps from week-value gaps using ESPN identities", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const mappedPlayerId = roster.entries[0].playerId; const identityMap = new Map([["provider-one", mappedPlayerId]]);
  const plan = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet: { projections: [] } });
  const report = buildProjectionGapReport(sampleSnapshot, plan, identityMap);
  assert.equal(report.status, "gaps");
  assert.equal(report.records.find((item) => item.espnPlayerId === mappedPlayerId).gapType, "missing-week-projection");
  assert.equal(report.records.find((item) => item.espnPlayerId === mappedPlayerId).providerPlayerId, "provider-one");
  assert.equal(report.records.some((item) => item.gapType === "missing-identity-map"), true);
  assert.match(report.limitation, /human review only/);
});

test("projection gap report is empty only when every selected player-week is supplied", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const identityMap = new Map(roster.entries.map((entry) => [`provider-${entry.playerId}`, entry.playerId]));
  const projectionSet = { projections: roster.entries.map((entry) => ({ providerPlayerId: `provider-${entry.playerId}`, week: 15, points: 10 })) };
  const plan = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet });
  assert.deepEqual(buildProjectionGapReport(sampleSnapshot, plan, identityMap), { status: "complete", records: [], limitation: null });
  assert.equal(buildProjectionGapReport(sampleSnapshot, { weeklyBaseline: [] }, identityMap).status, "unavailable");
});
