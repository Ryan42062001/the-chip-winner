import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderTradeAnalysisResult } from "../src/ui/trade-analyzer.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const snapshot = { players: [
  { id: "out", name: "Outgoing", position: "RB" },
  { id: "in", name: "Incoming", position: "RB" }
] };

function result(overrides = {}) {
  return {
    analysisState: "READY",
    proposal: { outgoing: [{ id: "out", name: "Outgoing", position: "RB" }], incoming: [{ id: "in", name: "Incoming", position: "RB" }], plannedFollowUpDrops: [], teamObjective: "BALANCED" },
    snapshot: { capturedAt: "2026-09-10T12:00:00Z" },
    readOnly: true,
    evidenceState: "COMPLETE_SINGLE_SOURCE",
    sourceAgreement: { currentWeek: "SINGLE_SOURCE" },
    conclusion: "CLEAR_TEAM_UPGRADE",
    currentWeek: { direction: "UPGRADE", actionability: "HYPOTHETICAL_READ_ONLY", locks: [], sources: [{ source: "ESPN", status: "READY", preTotal: 100, postTotal: 104, delta: 4, direction: "UPGRADE", assignments: { incomingStarters: ["in"], incomingBenchDepth: [], outgoingStarters: ["out"], promotedExisting: [], displacedExisting: [] } }] },
    roster: { netRosterCount: 0, openRosterSpots: 0, requiredFollowUpRemovals: 0, incomingPlacedOnIr: false, resolved: { status: "verified", violations: [] }, direct: { violations: [] } },
    depth: { listedPositionChanges: [{ position: "RB", before: 2, after: 2, delta: 0 }], fragility: { state: "COVERED", reason: "Covered." }, contingency: { post: { maxUncoveredAfterLoss: 0 } } },
    replacement: { status: "UNKNOWN", reason: "ESPN availability is missing from the latest snapshot; replacement quality is unknown, not weak or empty.", candidates: [] },
    bye: { status: "READY", rows: [] },
    future: { label: "Weeks 6, 7", status: "READY", source: "External", horizonDelta: 4, meanWeeklyDelta: 2, direction: "UPGRADE", rows: [{ week: 6, preTotal: 100, postTotal: 102, delta: 2, direction: "UPGRADE" }, { week: 7, preTotal: 101, postTotal: 103, delta: 2, direction: "UPGRADE" }] },
    playoffs: { label: "Playoff weeks 15, 16", status: "UNKNOWN", source: "External", horizonDelta: null, meanWeeklyDelta: null, direction: "UNKNOWN", rows: [], reason: "Incomplete coverage." },
    reasons: ["Current-week supported direction: UPGRADE."],
    limitations: ["Playoff window: incomplete."],
    transactionActions: [],
    ...overrides
  };
}

test("Trade Analyzer result keeps proposal, evidence, roster, source, horizons, depth, limitations, and read-only status inspectable", () => {
  const html = renderTradeAnalysisResult(result(), snapshot, escapeHtml);
  assert.match(html, /CLEAR_TEAM_UPGRADE/);
  assert.match(html, /COMPLETE_SINGLE_SOURCE/);
  assert.match(html, /Outgoing/);
  assert.match(html, /Incoming/);
  assert.match(html, /ESPN/);
  assert.match(html, /\+4\.0 pts/);
  assert.match(html, /Mean weekly delta/);
  assert.match(html, /\+2\.0 pts/);
  assert.match(html, /COVERED/);
  assert.match(html, /replacement quality is unknown, not weak or empty/);
  assert.match(html, /READ ONLY/);
  assert.match(html, /No ESPN trade mutation/);
  assert.match(html, /There is no trade score, winner percentage, confidence percentage, acceptance probability, or ESPN transaction action/);
});

test("TCW-031 result identifies both ESPN teams and the exact hypothetical package in all analysis states", () => {
  const identified = result({
    proposal: {
      userTeam: { id: "mine", name: "My real team" },
      partnerTeam: { id: "other", name: "Partner Alpha" },
      outgoing: [{ id: "out", name: "Outgoing", position: "RB" }],
      incoming: [{ id: "in", name: "Incoming", position: "RB" }],
      plannedFollowUpDrops: [{ id: "drop", name: "Explicit Drop", position: "WR" }],
      teamObjective: "BALANCED"
    }
  });
  for (const state of ["READY", "INVALID_PROPOSAL", "ROSTER_ACTION_REQUIRED"]) {
    const html = renderTradeAnalysisResult({
      ...identified, analysisState: state,
      reasons: state === "INVALID_PROPOSAL" ? ["Selected partner roster unavailable."] : identified.reasons
    }, snapshot, escapeHtml);
    for (const name of ["My real team", "Partner Alpha", "Outgoing", "Incoming", "Explicit Drop"]) assert.match(html, new RegExp(name));
    assert.match(html, /EVALUATED PARTIES/);
  }
});

test("TCW-031 production UI requires a partner and guards stale proposal state", async () => {
  const source = await readFile(new URL("../src/ui/trade-analyzer.js", import.meta.url), "utf8");
  assert.match(source, /id="trade-partner-select"/);
  assert.match(source, /Select opposing team/);
  assert.match(source, /partnerRoster\?\.entries/);
  assert.match(source, /proposal\.incomingPlayerIds = \[\]/);
  assert.match(source, /boundSnapshot !== state\.snapshot/);
  assert.match(source, /boundTeamId !== state\.selectedTeamId/);
  assert.match(source, /result = null/);
  assert.match(source, /Trade analysis unavailable/);
});

test("TCW-042 proposal entry uses dedicated balanced trade-side controls and explicit accessible Add names", async () => {
  const source = await readFile(new URL("../src/ui/trade-analyzer.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  for (const token of ["trade-partner-control", "trade-sides", 'data-trade-side="send"', 'data-trade-side="receive"', "trade-player-entry", "trade-add-button", "trade-objective-control"]) {
    assert.ok(source.includes(token), `Missing Trade Analyzer UI token: ${token}`);
  }
  assert.match(source, /aria-label="Add outgoing"[^>]*>Add</);
  assert.match(source, /aria-label="Add incoming"[^>]*>Add</);
  assert.match(source, /isUniquelyOwnedByTeam\(ownerTeams, player\.id, state\.selectedTeamId\)/);
  assert.match(source, /isUniquelyOwnedByTeam\(owners, id, state\.selectedTeamId\)/);

  assert.match(styles, /\.trade-sides\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.trade-player-entry\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(styles, /\.trade-add-button\{width:auto;min-width:68px;min-height:44px/);
  assert.match(styles, /@media\(max-width:720px\)[\s\S]*\.trade-sides\{grid-template-columns:1fr/);
});
test("Trade Analyzer lock state is visually dominant and explicitly informational", () => {
  const html = renderTradeAnalysisResult(result({ currentWeek: { ...result().currentWeek, actionability: "INFORMATIONAL_ONLY", locks: [{ playerId: "out", playerName: "Outgoing", reason: "ESPN reported this player locked." }] } }), snapshot, escapeHtml);
  assert.match(html, /Locked\/current-game limitation/);
  assert.match(html, /ESPN reported this player locked/);
  assert.match(html, /informational only/i);
  assert.match(html, /does not claim whether ESPN would process the trade/);
});

test("Trade Analyzer roster-action-required result does not present an expanded roster as final", () => {
  const html = renderTradeAnalysisResult(result({
    analysisState: "ROSTER_ACTION_REQUIRED",
    roster: { netRosterCount: 1, openRosterSpots: 0, requiredFollowUpRemovals: 1, incomingPlacedOnIr: false, direct: { status: "violation", violations: [{ kind: "ROSTER_SIZE", count: 16, limit: 15, excess: 1 }] }, resolved: { status: "violation", violations: [{ kind: "ROSTER_SIZE", count: 16, limit: 15, excess: 1 }] } },
    reasons: ["Known ESPN roster size requires at least 1 explicit follow-up removal."],
    limitations: ["No expanded-roster optimizer result is presented as a final legal post-trade lineup."]
  }), snapshot, escapeHtml);
  assert.match(html, /Another explicit roster action is required/);
  assert.match(html, /does not silently choose a drop/);
  assert.match(html, /ROSTER_ACTION_REQUIRED/);
});

test("production UI exposes a first-class Trade Analyzer route and editable multi-player controls", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const source = await readFile(new URL("../src/ui/trade-analyzer.js", import.meta.url), "utf8");
  assert.match(html, /data-section="trade"/);
  assert.match(html, />Trade Analyzer</);
  for (const id of ["trade-outgoing-select", "trade-incoming-select", "trade-objective", "trade-add-outgoing", "trade-add-incoming", "trade-analyze", "trade-reset"]) assert.match(source, new RegExp(id));
  assert.match(source, /plannedFollowUpDropIds/);
  assert.match(source, /data-trade-remove/);
  assert.match(source, /BALANCED/);
  assert.match(source, /CURRENT_WEEK_STABILITY/);
  assert.match(source, /FUTURE_UPSIDE/);
});
