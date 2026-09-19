import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTrade } from "../src/domain/trade-analyzer.js";

const NOW = Date.parse("2026-09-10T12:00:00Z");
const player = (id, projection = 10) => ({ id, name: id.toUpperCase(), position: "RB", proTeam: "NFL", opponent: "OPP", projection, gameTime: "2026-12-01T18:00:00Z", byeWeek: 14, injury: { status: "ACTIVE" } });
const entry = (playerId, lineupSlot = "BE") => ({ playerId, lineupSlot });
const packageFor = (outgoingPlayerIds, incomingPlayerIds, extra = {}) => ({
  partnerTeamId: "other", outgoingPlayerIds, incomingPlayerIds,
  plannedFollowUpDropIds: [], teamObjective: "BALANCED", ...extra
});

function snapshot({ size = 2, missingProjection = false } = {}) {
  return {
    schemaVersion: 1, provider: "espn", currentWeek: 5,
    meta: { kind: "live-companion", capturedAt: "2026-09-10T11:55:00Z", projectionsSource: "ESPN" },
    league: {
      id: "league", name: "Trade Counterparty Fixture", season: 2026, scoringType: "PPR",
      receptionScoring: { family: "ppr", pointsPerReception: 1 },
      lineupSlots: [{ slot: "RB", count: 1 }, { slot: "BE", count: 2 }],
      rosterRules: { size, positionLimits: [] }, playoffWeeks: [],
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [
      { id: "mine", name: "My real team", abbreviation: "ME", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } },
      { id: "other", name: "Partner Alpha", abbreviation: "ALP", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } },
      { id: "third", name: "Partner Beta", abbreviation: "BET", acquisition: { seasonAcquisitions: 0, matchupAcquisitions: 0 } }
    ],
    players: [
      player("a", missingProjection ? null : 10), player("b", 8),
      player("x", 14), player("y", 12), player("z", 16),
      player("fa", 18)
    ],
    rosters: [
      { teamId: "mine", entries: [entry("a", "RB"), entry("b")] },
      { teamId: "other", entries: [entry("x", "RB"), entry("y")] },
      { teamId: "third", entries: [entry("z", "RB")] }
    ],
    matchups: [], availablePlayers: ["fa"]
  };
}
const analyze = (snap, proposal, teamId = "mine") => analyzeTrade(snap, teamId, proposal, { now: NOW });

test("TCW-031 baseline requires an explicit real opposing team", () => {
  const snap = snapshot();
  const result = analyze(snap, packageFor(["a"], ["x"], { partnerTeamId: "" }));
  assert.equal(result.analysisState, "INVALID_PROPOSAL");
  assert.match(result.reasons.join(" "), /Select one opposing ESPN team/);
  assert.equal(result.proposal.userTeam.name, "My real team");
  assert.equal(result.proposal.partnerTeam.name, "Unavailable");
});

test("TCW-031 rejects selecting the user's own team as counterparty", () => {
  const result = analyze(snapshot(), packageFor(["a"], ["x"], { partnerTeamId: "mine" }));
  assert.equal(result.analysisState, "INVALID_PROPOSAL");
  assert.match(result.reasons.join(" "), /cannot be its own trade partner/);
});

test("TCW-031 rejects a counterparty absent from loaded ESPN teams or rosters", () => {
  const snap = snapshot();
  assert.equal(analyze(snap, packageFor(["a"], ["x"], { partnerTeamId: "ghost" })).analysisState, "INVALID_PROPOSAL");
  snap.rosters = snap.rosters.filter((item) => item.teamId !== "other");
  assert.match(analyze(snap, packageFor(["a"], ["x"])).reasons.join(" "), /roster is unavailable/);
});

test("TCW-031 legitimate opposing-team 1-for-1 produces a visible roster consequence", () => {
  const snap = snapshot();
  const result = analyze(snap, packageFor(["a"], ["x"]));
  assert.equal(result.analysisState, "READY");
  assert.equal(result.proposal.userTeam.name, "My real team");
  assert.equal(result.proposal.partnerTeam.name, "Partner Alpha");
  assert.deepEqual(result.proposal.outgoing.map((p) => p.id), ["a"]);
  assert.deepEqual(result.proposal.incoming.map((p) => p.id), ["x"]);
  assert.equal(result.currentWeek.sources[0].delta, 4);
  assert.equal(result.readOnly, true);
  assert.deepEqual(result.transactionActions, []);
});

test("TCW-031 multi-player 2-for-1 preserves roster-consolidation consequences", () => {
  const result = analyze(snapshot(), packageFor(["a", "b"], ["x"]));
  assert.notEqual(result.analysisState, "INVALID_PROPOSAL");
  assert.equal(result.roster.netRosterCount, -1);
  assert.equal(result.roster.openRosterSpots, 1);
});

test("TCW-031 legitimate 1-for-2 requires explicit follow-up drop on a full roster", () => {
  const snap = snapshot();
  const pending = analyze(snap, packageFor(["b"], ["x", "y"]));
  assert.equal(pending.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(pending.roster.requiredFollowUpRemovals, 1);
  const resolved = analyze(snap, packageFor(["b"], ["x", "y"], { plannedFollowUpDropIds: ["y"] }));
  assert.notEqual(resolved.analysisState, "INVALID_PROPOSAL");
  assert.notEqual(resolved.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.deepEqual(resolved.proposal.plannedFollowUpDrops.map((p) => p.id), ["y"]);
});

test("TCW-031 rejects incoming free agents/unrostered players even when in ESPN player directory", () => {
  const result = analyze(snapshot(), packageFor(["a"], ["fa"]));
  assert.equal(result.analysisState, "INVALID_PROPOSAL");
  assert.match(result.reasons.join(" "), /free agents and mixed-opponent packages/);
});

test("TCW-031 rejects mixed-opponent packages and stale incoming assets after partner switch", () => {
  const snap = snapshot({ size: 3 });
  const mixed = analyze(snap, packageFor(["a"], ["x", "z"]));
  assert.equal(mixed.analysisState, "INVALID_PROPOSAL");
  const switched = analyze(snap, packageFor(["a"], ["x"], { partnerTeamId: "third" }));
  assert.equal(switched.analysisState, "INVALID_PROPOSAL");
  assert.match(switched.reasons.join(" "), /selected opposing team/);
  assert.notEqual(analyze(snap, packageFor(["a"], ["z"], { partnerTeamId: "third" })).analysisState, "INVALID_PROPOSAL");
});

test("TCW-031 rejects a player with ambiguous ownership across opposing rosters", () => {
  const snap = snapshot();
  snap.rosters[2].entries.push(entry("x"));
  const result = analyze(snap, packageFor(["a"], ["x"]));
  assert.equal(result.analysisState, "INVALID_PROPOSAL");
  assert.match(result.reasons.join(" "), /exclusively/);
});

test("TCW-041-F01 outgoing player duplicated onto another roster fails closed while a unique user-owned player remains valid", () => {
  const snap = snapshot({ size: 3 });
  snap.rosters.find((item) => item.teamId === "third").entries.push(entry("a"));
  const ambiguous = analyze(snap, packageFor(["a"], ["x"]));
  assert.equal(ambiguous.analysisState, "INVALID_PROPOSAL");
  assert.match(ambiguous.reasons.join(" "), /outgoing player must belong exclusively/i);

  const normal = analyze(snap, packageFor(["b"], ["x"]));
  assert.notEqual(normal.analysisState, "INVALID_PROPOSAL");
});
test("TCW-031 outgoing ownership, duplicates, and cross-side identities fail closed", () => {
  const snap = snapshot();
  assert.match(analyze(snap, packageFor(["z"], ["x"])).reasons.join(" "), /outgoing player must be/);
  assert.match(analyze(snap, packageFor(["a", "a"], ["x"])).reasons.join(" "), /Outgoing player IDs must be unique/);
  assert.match(analyze(snap, packageFor(["a"], ["x", "x"])).reasons.join(" "), /Incoming player IDs must be unique/);
  assert.match(analyze(snap, packageFor(["a"], ["a"])).reasons.join(" "), /both sides/);
});

test("TCW-031 incomplete ESPN projection is explicit UNKNOWN instead of a fabricated result", () => {
  const result = analyze(snapshot({ missingProjection: true }), packageFor(["a"], ["x"]));
  assert.notEqual(result.analysisState, "INVALID_PROPOSAL");
  assert.equal(result.currentWeek.sources[0].status, "UNKNOWN");
  assert.equal(result.currentWeek.sources[0].delta, null);
  assert.notEqual(result.evidenceState, "COMPLETE_SINGLE_SOURCE");
  assert.equal(result.readOnly, true);
});

test("TCW-031 party metadata remains available on roster-action-required and invalid states", () => {
  const result = analyze(snapshot(), packageFor(["b"], ["x", "y"]));
  assert.equal(result.analysisState, "ROSTER_ACTION_REQUIRED");
  assert.equal(result.proposal.userTeam.name, "My real team");
  assert.equal(result.proposal.partnerTeam.name, "Partner Alpha");
  assert.deepEqual(result.proposal.incoming.map((p) => p.id), ["x", "y"]);
});
