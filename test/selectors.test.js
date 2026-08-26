import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { selectDataCoverage, selectProjectedTotal, selectSnapshotFreshness, selectTeamContext } from "../src/domain/selectors.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("team context selects roster and current opponent", () => {
  const context = selectTeamContext(sample, "t1");
  assert.equal(context.team.name, "Gridiron Architects");
  assert.equal(context.opponent.name, "Fourth & Long");
  assert.equal(context.starters.length, 9);
  assert.equal(context.bench.length, 5);
});

test("projected totals retain completeness metadata", () => {
  const context = selectTeamContext(sample, "t1");
  const result = selectProjectedTotal(context.bench, context.index.players);
  assert.equal(result.total, 61.9);
  assert.equal(result.knownCount, 4);
  assert.equal(result.totalCount, 5);
  assert.equal(result.complete, false);
});

test("freshness thresholds distinguish fresh, aging, stale, and unknown", () => {
  const capturedAt = Date.parse(sample.meta.capturedAt);
  assert.equal(selectSnapshotFreshness(sample, capturedAt + 10 * 60_000).status, "fresh");
  assert.equal(selectSnapshotFreshness(sample, capturedAt + 60 * 60_000).status, "aging");
  assert.equal(selectSnapshotFreshness(sample, capturedAt + 24 * 60 * 60_000).status, "stale");
  assert.equal(selectSnapshotFreshness({ meta: {} }).status, "unknown");
});

test("coverage describes known data instead of filling gaps", () => {
  const coverage = selectDataCoverage(sample, "t1");
  assert.equal(coverage.rosterPlayers, 14);
  assert.equal(coverage.projections, 13 / 14);
  assert.equal(coverage.availability, true);
});
