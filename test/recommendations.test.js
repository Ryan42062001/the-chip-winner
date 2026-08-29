import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assessStartSitDataConfidence, buildLineupSuggestions, buildLineupVacancies, buildPrioritizedWarnings, buildWaiverIdeas, buildWarnings, canFillSlot, compareRosterPlayers } from "../src/domain/recommendations.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("lineup suggestions only recommend eligible higher projections", () => {
  const suggestions = buildLineupSuggestions(sample, "t1");
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].start.name, "James Cook");
  assert.equal(suggestions[0].sit.name, "DeVonta Smith");
  assert.equal(suggestions[0].gain, 2.9);
});

test("flex accepts RB, WR, and TE but not QB", () => {
  assert.equal(canFillSlot({ position: "RB" }, "FLEX"), true);
  assert.equal(canFillSlot({ position: "QB" }, "FLEX"), false);
});

test("OP accepts offensive skill positions including quarterback", () => {
  for (const position of ["QB", "RB", "WR", "TE"]) assert.equal(canFillSlot({ position }, "OP"), true);
  assert.equal(canFillSlot({ position: "K" }, "OP"), false);
});

test("warnings reflect only explicit injury and current-week bye data", () => {
  const warnings = buildWarnings(sample, "t1");
  assert.deepEqual(warnings.map((w) => [w.player.name, w.kind]), [
    ["Breece Hall", "injury"],
    ["David Njoku", "injury"]
  ]);
});

test("lineup vacancies report exact missing configured starter slots", () => {
  const snapshot = structuredClone(sample); snapshot.league.lineupSlots = [{ slot: "QB", count: 1 }, { slot: "RB", count: 3 }, { slot: "WR", count: 2 }, { slot: "BE", count: 6 }];
  const result = buildLineupVacancies(snapshot, "t1");
  assert.equal(result.status, "ready"); assert.equal(result.totalMissing, 1); assert.deepEqual(result.items, [{ slot: "RB", requiredCount: 3, filledCount: 2, missingCount: 1 }]);
});

test("lineup vacancies stay unavailable when ESPN omits lineup settings or the roster", () => {
  assert.equal(buildLineupVacancies(sample, "t1").status, "missing-settings");
  const snapshot = structuredClone(sample); snapshot.league.lineupSlots = [{ slot: "QB", count: 1 }]; assert.equal(buildLineupVacancies(snapshot, "missing").status, "missing-roster");
});

test("lineup vacancies return zero only when every configured starter slot is filled", () => {
  const snapshot = structuredClone(sample); snapshot.league.lineupSlots = [{ slot: "QB", count: 1 }, { slot: "RB", count: 2 }, { slot: "WR", count: 2 }, { slot: "TE", count: 1 }, { slot: "FLEX", count: 1 }, { slot: "K", count: 1 }, { slot: "D/ST", count: 1 }];
  const result = buildLineupVacancies(snapshot, "t1"); assert.equal(result.status, "ready"); assert.equal(result.totalMissing, 0); assert.deepEqual(result.items, []);
});

test("lineup vacancies disclose unsupported reported slot settings", () => {
  const snapshot = structuredClone(sample);
  snapshot.league.lineupSlots = [{ slot: "QB", count: 1 }, { slot: "ESPN_SLOT_99", count: 1 }];
  const result = buildLineupVacancies(snapshot, "t1");
  assert.equal(result.status, "partial");
  assert.equal(result.totalMissing, 0);
  assert.match(result.limitation, /ESPN_SLOT_99/);
});

test("waiver logic reports unavailable inputs honestly", () => {
  const withoutAvailability = structuredClone(sample);
  delete withoutAvailability.availablePlayers;
  assert.deepEqual(buildWaiverIdeas(withoutAvailability, "t1"), { status: "missing", items: [] });
});

test("lineup logic suppresses marginal projection churn", () => {
  const close = structuredClone(sample);
  close.players.find((player) => player.id === "p11").projection = 15.2;
  assert.equal(buildLineupSuggestions(close, "t1").length, 0);
});

test("waiver ideas do not reuse the same drop candidate", () => {
  const waiverSample = structuredClone(sample);
  waiverSample.players.find((player) => player.id === "p15").projection = 18;
  waiverSample.availablePlayers = ["p15", "p18"];
  const result = buildWaiverIdeas(waiverSample, "t1");
  assert.equal(result.items.length, 2);
  assert.equal(new Set(result.items.map((item) => item.drop.id)).size, result.items.length);
});

test("start sit comparison distinguishes preferences, near ties, and missing projections", () => {
  assert.equal(compareRosterPlayers(sample, "t1", "p1", "p10").preferred.id, "p1");
  assert.equal(compareRosterPlayers(sample, "t1", "p5", "p3").status, "tossup");
  assert.equal(compareRosterPlayers(sample, "t1", "p14", "p12").status, "missing");
  assert.equal(compareRosterPlayers(sample, "t1", "p1", "not-rostered").status, "invalid");
});

test("start sit data confidence measures completeness and freshness rather than outcome certainty", () => {
  const players = [{ name: "One", projection: 18, injury: { status: "ACTIVE" }, opponent: "DAL", gameTime: "2026-09-01T17:00:00Z" }, { name: "Two", projection: 17, injury: { status: "ACTIVE" }, opponent: "PHI", gameTime: "2026-09-01T20:00:00Z" }];
  const fresh = assessStartSitDataConfidence({ meta: { capturedAt: "2026-09-01T12:00:00Z" } }, players, Date.parse("2026-09-01T12:10:00Z"));
  assert.equal(fresh.label, "High"); assert.equal(fresh.score, 100); assert.deepEqual(fresh.limitations, []);
  players[1].opponent = null; players[1].gameTime = null;
  const partial = assessStartSitDataConfidence({ meta: { capturedAt: "2026-08-31T12:00:00Z" } }, players, Date.parse("2026-09-01T12:00:00Z"));
  assert.equal(partial.label, "Medium"); assert.equal(partial.score, 67); assert.match(partial.limitations.join(" "), /opponent unavailable.*kickoff unavailable.*stale/);
});

test("alerts prioritize an injured starter near an explicit kickoff", () => {
  const snapshot = structuredClone(sample); const starterId = snapshot.rosters[0].entries.find((entry) => entry.lineupSlot !== "BE" && entry.lineupSlot !== "IR").playerId;
  const player = snapshot.players.find((item) => item.id === starterId); player.injury = { status: "QUESTIONABLE", detail: null }; player.gameTime = "2026-09-01T13:00:00Z";
  const warnings = buildPrioritizedWarnings(snapshot, "t1", Date.parse("2026-09-01T01:00:00Z"));
  assert.equal(warnings[0].player.id, starterId); assert.equal(warnings[0].urgency, "critical"); assert.equal(warnings[0].hoursToKickoff, 12);
});
