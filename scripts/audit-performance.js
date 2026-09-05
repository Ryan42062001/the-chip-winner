import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { buildRosterAwareWaiverIdeas } from "../src/domain/waiver-engine.js";
import { buildScenarioPlan } from "../src/domain/scenario-planner.js";
import { buildWaiverPriorityBoard } from "../src/domain/waiver-priority-engine.js";
import { normalizeFutureProjectionSet } from "../src/providers/projections/future-projection-provider.js";

const kib = 1024;
const budgets = Object.freeze({
  "index.html": 12 * kib,
  "src/styles.css": 32 * kib,
  "src/app.js": 60 * kib,
  "src/data/sample-espn-snapshot.json": 32 * kib,
});

function browserGraph(entry) {
  const found = new Set();
  const visit = (file) => {
    const path = resolve(file);
    if (found.has(path)) return;
    found.add(path);
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g)) {
      if (match[1].startsWith(".")) visit(resolve(dirname(path), match[1].split("?")[0]));
    }
  };
  visit(entry);
  return [...found];
}

function runtimeFixture() {
  const starters = [
    ["qb1", "QB", "QB", 20], ["rb1", "RB", "RB", 15], ["rb2", "RB", "RB", 14],
    ["wr1", "WR", "WR", 15], ["wr2", "WR", "WR", 14], ["te1", "TE", "TE", 10],
    ["wr3", "WR", "FLEX", 12], ["k1", "K", "K", 8], ["dst1", "D/ST", "D/ST", 8]
  ];
  const bench = [
    ["qb2", "QB", 12, true], ["rb3", "RB", 9, false], ["rb4", "RB", 8, false],
    ["wr4", "WR", 9, false], ["wr5", "WR", 8, false], ["te2", "TE", 7, true]
  ];
  const players = starters.map(([id, position, , projection]) => ({ id, name: id, position, projection, injury: { status: "ACTIVE" }, gameTime: null }));
  const entries = starters.map(([id, , slot]) => ({ playerId: id, lineupSlot: slot }));
  for (const [id, position, projection, locked] of bench) {
    players.push({ id, name: id, position, projection, injury: { status: "ACTIVE" }, gameTime: null });
    entries.push({ playerId: id, lineupSlot: "BE", ...(locked ? { locked: true } : {}) });
  }

  const positions = ["QB", "RB", "WR", "TE", "K", "D/ST"];
  const availablePlayers = [];
  for (let index = 0; index < 24; index += 1) {
    const position = positions[index % positions.length];
    const id = `add${index + 1}`;
    availablePlayers.push(id);
    players.push({ id, name: id, position, projection: 4, injury: { status: "ACTIVE" }, gameTime: null });
  }

  const snapshot = {
    schemaVersion: 1,
    provider: "espn",
    meta: { kind: "performance-fixture", capturedAt: "2026-09-05T18:00:00.000Z", projectionsSource: "espn" },
    league: {
      id: "performance",
      name: "Performance Fixture",
      season: 2026,
      scoringType: "PPR",
      lineupSlots: [
        { slot: "QB", count: 1 }, { slot: "RB", count: 2 }, { slot: "WR", count: 2 },
        { slot: "TE", count: 1 }, { slot: "FLEX", count: 1 }, { slot: "K", count: 1 },
        { slot: "D/ST", count: 1 }, { slot: "BE", count: 6 }, { slot: "IR", count: 1 }
      ],
      rosterRules: {
        size: 15,
        positionLimits: [
          { position: "QB", limit: 4 }, { position: "RB", limit: 8 }, { position: "WR", limit: 8 },
          { position: "TE", limit: 3 }, { position: "K", limit: 3 }, { position: "D/ST", limit: 3 }
        ]
      },
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    currentWeek: 1,
    teams: [{ id: "mine", name: "Mine", acquisition: { waiverRank: 10, seasonAcquisitions: 0, matchupAcquisitions: null } }],
    players,
    rosters: [{ teamId: "mine", entries }],
    matchups: [],
    availablePlayers
  };

  const weeks = [2, 3, 4];
  const identityMap = new Map(players.map((player) => [`provider-${player.id}`, player.id]));
  const projectionSet = normalizeFutureProjectionSet({
    provider: "performance-fixture",
    scoringFormat: "PPR",
    season: 2026,
    capturedAt: "2026-09-05T18:00:00.000Z",
    projections: players.flatMap((player) => weeks.map((week) => ({
      providerPlayerId: `provider-${player.id}`,
      week,
      points: player.id.startsWith("add") ? 16 + (Number(player.id.slice(3)) % 5) : player.projection,
      capturedAt: "2026-09-05T18:00:00.000Z"
    })))
  }).value;
  return { snapshot, weeks, identityMap, projectionSet };
}

function measure(label, fn) {
  const started = performance.now();
  const result = fn();
  const elapsedMs = performance.now() - started;
  console.log(`${label}: ${elapsedMs.toFixed(1)} ms`);
  return { result, elapsedMs };
}

const measurements = {
  "index.html": statSync("index.html").size,
  "src/styles.css": statSync("src/styles.css").size,
  "src/app.js": statSync("src/app.js").size,
  "src/data/sample-espn-snapshot.json": statSync("src/data/sample-espn-snapshot.json").size,
};
const browserGraphBytes = browserGraph("src/app.js").reduce((total, path) => total + statSync(path).size, 0);

const failures = [];
for (const [asset, limit] of Object.entries(budgets)) {
  const bytes = measurements[asset]; const percentage = Math.round((bytes / limit) * 100);
  console.log(`${asset}: ${(bytes / kib).toFixed(1)} KiB / ${(limit / kib).toFixed(0)} KiB (${percentage}%)`);
  if (bytes > limit) failures.push(`${asset} exceeds its ${(limit / kib).toFixed(0)} KiB budget by ${((bytes - limit) / kib).toFixed(1)} KiB.`);
}
console.log(`browser JavaScript graph: ${(browserGraphBytes / kib).toFixed(1)} KiB (informational; no hard cap)`);

const fixture = runtimeFixture();
const now = Date.parse("2026-09-05T18:00:00.000Z");
const waiver = measure("cold waiver analysis (24 adds × 4 unlocked bench drops)", () => buildRosterAwareWaiverIdeas(fixture.snapshot, "mine", now, Number.MAX_SAFE_INTEGER));
const priority = measure("priority board after waiver render", () => buildWaiverPriorityBoard(fixture.snapshot, "mine", {
  now,
  weeks: fixture.weeks,
  projectionSet: fixture.projectionSet,
  identityMap: fixture.identityMap,
  limit: 8
}));
const season = measure("playoff-only future baseline", () => buildScenarioPlan(fixture.snapshot, "mine", {
  now,
  weeks: fixture.weeks,
  projectionSet: fixture.projectionSet,
  identityMap: fixture.identityMap,
  scenarios: [],
  includeCurrentWeekScenarios: false
}));
const priorityRepeat = measure("repeat priority navigation", () => buildWaiverPriorityBoard(fixture.snapshot, "mine", {
  now,
  weeks: fixture.weeks,
  projectionSet: fixture.projectionSet,
  identityMap: fixture.identityMap,
  limit: 8
}));

if (waiver.elapsedMs > 1500) failures.push(`Cold waiver analysis took ${waiver.elapsedMs.toFixed(1)} ms; budget is 1500 ms.`);
if (priority.elapsedMs > 2500) failures.push(`Priority board took ${priority.elapsedMs.toFixed(1)} ms; budget is 2500 ms.`);
if (season.elapsedMs > 750) failures.push(`Playoff-only future baseline took ${season.elapsedMs.toFixed(1)} ms; budget is 750 ms.`);
if (priorityRepeat.elapsedMs > 2500) failures.push(`Repeat priority navigation took ${priorityRepeat.elapsedMs.toFixed(1)} ms; budget is 2500 ms.`);
if (priority.result.futureDiscovery?.consideredAdds !== 24) failures.push(`Runtime fixture expected 24 considered adds, found ${priority.result.futureDiscovery?.consideredAdds ?? "missing"}.`);
if (priority.result.futureDiscovery?.completeAdds !== 24) failures.push(`Runtime fixture expected 24 complete adds, found ${priority.result.futureDiscovery?.completeAdds ?? "missing"}.`);
if (priority.result.futureDiscovery?.scenarioCount !== 96) failures.push(`Runtime fixture expected 96 exhaustive future scenarios, found ${priority.result.futureDiscovery?.scenarioCount ?? "missing"}.`);
if (season.result.currentWeekScenarios?.length !== 0) failures.push("Playoff-only baseline unexpectedly ran current-week waiver scenarios.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Static and runtime performance budgets passed.");
}
