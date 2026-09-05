import { buildSeasonPlayoffIntelligence } from "../domain/season-intelligence.js";
import { buildScenarioPlan } from "../domain/scenario-planner.js";
import { buildWaiverPriorityBoard } from "../domain/waiver-priority-engine.js";
import { evaluateFutureProjectionCompatibility } from "../providers/projections/future-projection-provider.js";
import { createSectionRenderer as createBaseSectionRenderer } from "./section-renderer-base.js";
import { renderSeasonPlayoffIntelligence } from "./season-intelligence.js";

function signedPoints(value) {
  if (value == null) return "Unavailable";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Unavailable";
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)} pts`;
}

function futureLabel(item) {
  if (item.future.status !== "ready") return item.future.status === "blocked" ? "Blocked by coverage" : "Unavailable";
  return `${signedPoints(item.future.horizonGain)} · ${item.future.positiveWeeks}/${item.future.totalWeeks} positive weeks`;
}

function replacementLabel(item) {
  if (item.replacement?.status !== "ready") return "Benchmark unavailable";
  return `${signedPoints(item.replacement.pointsAbove)} vs next available ${item.add.position}`;
}

function preservationLabel(item, escapeHtml) {
  if (item.preservation.preservesRosteredPlayer) {
    const irName = item.irMove?.player?.name || "eligible bench player";
    return `No drop · move ${escapeHtml(irName)} to IR`;
  }
  return item.drop?.name ? `Drop ${escapeHtml(item.drop.name)}` : "Drop required";
}

function candidateLabel(item) {
  if (item.candidateType === "future-only") return "FUTURE STASH · ADD / DROP";
  return item.kind === "ir-assisted-add" ? "IR-ASSISTED · NO DROP" : "HELPS NOW · ADD / DROP";
}

function renderPriorityItems(board, escapeHtml) {
  return board.items.map((item) => `<article class="panel waiver-priority-card interactive-row" data-player-id="${escapeHtml(item.add.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.add.name)} priority details">
    <div class="panel-head"><div><p class="eyebrow">${candidateLabel(item)}</p><h3>${escapeHtml(item.add.name)}</h3><p>${escapeHtml(item.add.position)} · ${escapeHtml(item.priorityReason)}</p></div><span class="quality ${item.priorityBand === 1 ? "fresh" : "aging"}">Priority band ${item.priorityBand}</span></div>
    <dl class="settings-list waiver-priority-factors">
      <div><dt>This week</dt><dd>${signedPoints(item.currentWeek.lineupGain)}</dd></div>
      <div><dt>Selected future weeks</dt><dd>${futureLabel(item)}</dd></div>
      <div><dt>Replacement value</dt><dd>${replacementLabel(item)}</dd></div>
      <div><dt>${escapeHtml(item.add.position)} depth now</dt><dd>${item.rosterFit.positionDepthBefore == null ? "Unavailable" : `${item.rosterFit.positionDepthBefore} rostered`}</dd></div>
      <div><dt>Roster preservation</dt><dd>${preservationLabel(item, escapeHtml)}</dd></div>
    </dl>
  </article>`).join("");
}

function compatibleFutureInputs(context) {
  const { state, futureProjectionSet, projectionIdentityMap } = context;
  const importedFutureWeeks = futureProjectionSet
    ? [...new Set(futureProjectionSet.projections.map((item) => item.week))].sort((a, b) => a - b)
    : [];
  const compatibility = futureProjectionSet
    ? evaluateFutureProjectionCompatibility(futureProjectionSet, state.snapshot)
    : null;
  return Object.freeze({
    importedFutureWeeks: Object.freeze(importedFutureWeeks),
    projectionSet: compatibility?.usable ? futureProjectionSet : null,
    identityMap: projectionIdentityMap,
    compatibility
  });
}

function priorityPanel(deps, base) {
  const context = deps.getContext();
  const { state, selectedFutureWeeks } = context;
  if (state?.section !== "waivers" || !state.snapshot) return null;

  const futureInputs = compatibleFutureInputs(context);
  const futureWeeks = selectedFutureWeeks === null
    ? futureInputs.importedFutureWeeks
    : futureInputs.importedFutureWeeks.filter((week) => selectedFutureWeeks.includes(week));

  const board = buildWaiverPriorityBoard(state.snapshot, state.selectedTeamId, {
    weeks: futureWeeks,
    projectionSet: futureInputs.projectionSet,
    identityMap: futureInputs.identityMap
  });

  const section = document.createElement("section");
  section.className = "waiver-priority-board";
  section.setAttribute("aria-labelledby", "waiver-priority-title");
  const limitation = board.limitations?.[0] || "No legal waiver moves are currently available to prioritize.";
  const body = board.status !== "ready"
    ? base.emptyState("Priority board unavailable", limitation)
    : board.items.length
      ? `<div class="waiver-list">${renderPriorityItems(board, base.escapeHtml)}</div>`
      : base.emptyState("Nothing to prioritize", limitation);
  const futureContext = futureInputs.projectionSet && futureWeeks.length
    ? `Selected future horizon: Weeks ${futureWeeks.join(", ")}. Future-only stashes require complete selected-week coverage for the current roster and simulated add/drop roster.`
    : "Future-week evidence is unavailable or no future weeks are selected; future-only stashes are withheld and missing future inputs are not scored as zero.";
  const discoveryContext = board.futureDiscovery?.status === "ready"
    ? `${board.futureDiscovery.qualifiedAdds} positive future-only stash candidate${board.futureDiscovery.qualifiedAdds === 1 ? "" : "s"} cleared complete coverage and current ESPN legality.`
    : board.futureDiscovery?.reason || "Future-only stash discovery is unavailable in the current state.";

  section.innerHTML = `<div class="section-divider"><span id="waiver-priority-title">PRIORITY BOARD · TRANSPARENT MULTI-FACTOR</span></div>
    <article class="panel waiver-limitations"><strong>How priority works</strong><span>No weighted score. Priority band 1 means no other fully comparable move is clearly better across every known factor.</span><span>${base.escapeHtml(futureContext)}</span><span>${base.escapeHtml(discoveryContext)}</span></article>
    ${body}`;
  return section;
}

function seasonIntelligencePanel(deps) {
  const context = deps.getContext();
  const { state, selectedPlayoffWeeks } = context;
  if (state?.section !== "season" || !state.snapshot) return null;
  const futureInputs = compatibleFutureInputs(context);
  const espnPlayoffWeeks = Array.isArray(state.snapshot.league?.playoffWeeks) && state.snapshot.league.playoffWeeks.length ? state.snapshot.league.playoffWeeks : null;
  const playoffWeeks = espnPlayoffWeeks || (Array.isArray(selectedPlayoffWeeks) ? selectedPlayoffWeeks : []);
  const playoffPlan = buildScenarioPlan(state.snapshot, state.selectedTeamId, {
    weeks: playoffWeeks,
    projectionSet: futureInputs.projectionSet,
    identityMap: futureInputs.identityMap,
    scenarios: []
  });
  const intelligence = buildSeasonPlayoffIntelligence(state.snapshot, state.selectedTeamId, {
    playoffWeeks,
    scenarioPlan: playoffPlan,
    rankingReconciliation: state.rankingReconciliation
  });
  const section = document.createElement("div");
  section.innerHTML = renderSeasonPlayoffIntelligence(intelligence, state.snapshot);
  return section.firstElementChild;
}

export function createSectionRenderer(deps) {
  const base = createBaseSectionRenderer(deps);
  const render = (...args) => {
    const result = base.render(...args);
    const panel = priorityPanel(deps, base) || seasonIntelligencePanel(deps);
    if (panel) {
      const firstDivider = deps.content.querySelector(".section-divider");
      if (firstDivider) firstDivider.before(panel);
      else deps.content.append(panel);
    }
    return result;
  };

  return Object.freeze({ ...base, render });
}
