import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderSeasonPlayoffIntelligence } from "../src/ui/season-intelligence.js";

function intelligence(overrides = {}) {
  return {
    status: "ready",
    playoffWeeks: [15, 16],
    playoffBoundarySource: "espn",
    byeCoverage: {
      status: "gap",
      gapWeeks: [7],
      unknownByePlayerIds: [],
      weeks: [{ week: 7, status: "gap", byePlayerIds: ["p1"], affectedStarterPlayerIds: ["p1"], uncoveredSlotCount: 1, uncoveredSlotCandidates: ["RB"], requiredStarterSlots: 2 }],
      methodology: "ESPN bye facts"
    },
    fantasyPlayoffSchedule: {
      rows: [{ week: 15, opponentId: "opp", opponentName: "<Rival>", homeAway: "home", status: "upcoming" }],
      coverage: { status: "partial", requestedWeeks: 2, reportedWeeks: 1, missingWeeks: [16], ambiguousWeeks: [], repeatedOpponents: [] }
    },
    playoffProjection: {
      status: "partial",
      completeWeeks: 1,
      blockedWeeks: [16],
      rows: [
        { week: 15, completeCoverage: true, projectedTotal: 101.2, mappedProjectionCount: 2, rosterPlayerCount: 2 },
        { week: 16, completeCoverage: false, projectedTotal: null, mappedProjectionCount: 1, rosterPlayerCount: 2 }
      ],
      aggregate: null,
      methodology: "No partial sums"
    },
    scheduleStrength: { status: "unavailable", items: [], starterSummary: { favorable: 0, neutral: 0, difficult: 0, rated: 0, total: 0 } },
    ...overrides
  };
}

const snapshot = { players: [{ id: "p1", name: "<Alpha>", position: "RB" }] };

test("season intelligence UI escapes source values and labels source separation", () => {
  const html = renderSeasonPlayoffIntelligence(intelligence(), snapshot);
  assert.match(html, /Source separation/);
  assert.match(html, /ESPN owns league state and fantasy opponents/);
  assert.match(html, /&lt;Alpha&gt;/);
  assert.match(html, /&lt;Rival&gt;/);
  assert.doesNotMatch(html, /<Alpha>/);
  assert.doesNotMatch(html, /<Rival>/);
});

test("season intelligence UI explains ambiguous bye slot assignment instead of choosing one", () => {
  const value = intelligence();
  value.byeCoverage.weeks = [{ week: 9, status: "gap", byePlayerIds: ["p1"], affectedStarterPlayerIds: ["p1"], uncoveredSlotCount: 1, uncoveredSlotCandidates: ["FLEX", "RB"], requiredStarterSlots: 2 }];
  const html = renderSeasonPlayoffIntelligence(value, snapshot);
  assert.match(html, /1 uncovered starter slot · could affect FLEX or RB depending on legal slot assignment/);
});

test("season intelligence UI withholds a partial playoff aggregate instead of zero filling", () => {
  const html = renderSeasonPlayoffIntelligence(intelligence(), snapshot);
  assert.match(html, /Playoff aggregate withheld/);
  assert.match(html, /Blocked Weeks 16/);
  assert.match(html, /1\/2 usable/);
  assert.doesNotMatch(html, /Playoff total/);
});

test("season intelligence UI keeps FantasyPros SOS optional and explicit", () => {
  const html = renderSeasonPlayoffIntelligence(intelligence(), snapshot);
  assert.match(html, /Import a compatible FantasyPros rest-of-season CSV/);
  assert.match(html, /does not scrape or invent strength-of-schedule ratings/);
});

test("season intelligence presents core cards in document order and keeps player SOS expandable", () => {
  const value = intelligence({
    scheduleStrength: {
      status: "ready", ratedRosterPlayers: 1, totalRosterPlayers: 1,
      starterSummary: { favorable: 1, neutral: 0, difficult: 0, rated: 1, total: 1 },
      items: [{ playerName: "<Alpha>", position: "RB", seasonStars: 4, seasonBand: "favorable", playoffStars: 3, playoffBand: "neutral" }],
      methodology: "FantasyPros imported advisory only"
    }
  });
  const html = renderSeasonPlayoffIntelligence(value, snapshot);
  const markers = ["CORE SEASON / PLAYOFF INTELLIGENCE", "BYE COVERAGE", "PLAYOFF OPPONENTS", "PLAYOFF PROJECTION WINDOW"];
  assert.deepEqual(markers.map((marker) => html.indexOf(marker)), [...markers.map((marker) => html.indexOf(marker))].sort((a, b) => a - b));
  assert.match(html, /<div class="season-core-grid">/);
  assert.match(html, /<details class="plan-disclosure"><summary>Player-level FantasyPros SOS/);
  assert.match(html, /&lt;Alpha&gt;/);
  assert.match(html, /FantasyPros imported advisory only/);
});

test("section renderer wires season intelligence through the wrapper instead of bloating the base renderer", async () => {
  const wrapper = await readFile(new URL("../src/ui/section-renderer-priority.js", import.meta.url), "utf8");
  const base = await readFile(new URL("../src/ui/section-renderer-base.js", import.meta.url), "utf8");
  assert.match(wrapper, /buildSeasonPlayoffIntelligence/);
  assert.match(wrapper, /renderSeasonPlayoffIntelligence/);
  assert.match(wrapper, /state\?\.section !== "season"/);
  assert.match(wrapper, /espnPlayoffWeeks \|\|/);
  assert.doesNotMatch(base, /buildSeasonPlayoffIntelligence/);
  assert.match(base, /plan-boundary.*plan-depth.*plan-advanced/s);
  assert.match(wrapper, /advanced\.insertBefore\(sos/);
});
