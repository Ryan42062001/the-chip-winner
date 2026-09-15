import { analyzeTrade } from "../domain/trade-analyzer.js";

function signed(value) {
  if (!Number.isFinite(value)) return "Unavailable";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)} pts`;
}

function playerName(playerMap, id) { return playerMap.get(id)?.name || id || "Unavailable"; }
function playerList(items) { return items.length ? items.map((item) => item.name).join(", ") : "None"; }

function sourceRows(result, escapeHtml) {
  return (result.currentWeek?.sources || []).map((source) => `<tr><td>${escapeHtml(source.source)}</td><td>${escapeHtml(source.status)}</td><td>${source.preTotal == null ? "—" : source.preTotal.toFixed(1)}</td><td>${source.postTotal == null ? "—" : source.postTotal.toFixed(1)}</td><td>${source.delta == null ? "—" : signed(source.delta)}</td><td>${escapeHtml(source.direction)}</td></tr>`).join("");
}

function horizonCard(title, horizon, escapeHtml) {
  if (!horizon) return "";
  const rows = (horizon.rows || []).map((row) => `<tr><td>Week ${row.week}</td><td>${row.preTotal == null ? "—" : row.preTotal.toFixed(1)}</td><td>${row.postTotal == null ? "—" : row.postTotal.toFixed(1)}</td><td>${row.delta == null ? "—" : signed(row.delta)}</td><td>${escapeHtml(row.direction || row.status)}</td></tr>`).join("");
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">${escapeHtml(title)}</p><h3>${escapeHtml(horizon.direction)}</h3></div><span class="quality ${horizon.status === "READY" ? "fresh" : "aging"}">${escapeHtml(horizon.status)}</span></div>
    <dl class="settings-list"><div><dt>Window</dt><dd>${escapeHtml(horizon.label)}</dd></div><div><dt>Aggregate delta</dt><dd>${horizon.horizonDelta == null ? "Unavailable" : signed(horizon.horizonDelta)}</dd></div><div><dt>Mean weekly delta</dt><dd>${horizon.meanWeeklyDelta == null ? "Unavailable" : signed(horizon.meanWeeklyDelta)}</dd></div><div><dt>Projection source</dt><dd>${escapeHtml(horizon.source || "Unavailable")}</dd></div></dl>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Week</th><th>Before</th><th>After</th><th>Delta</th><th>Direction</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="data-note">${escapeHtml(horizon.reason || "No complete horizon evidence is available.")}</p>`}
  </article>`;
}

function lineupChanges(result, playerMap, escapeHtml) {
  const ready = result.currentWeek?.sources?.find((item) => item.status === "READY" && item.assignments);
  if (!ready) return `<p class="data-note">Starter assignment changes are unavailable because no complete current-week source produced both legal lineups.</p>`;
  const items = ready.assignments;
  return `<dl class="settings-list"><div><dt>Incoming starters/FLEX</dt><dd>${escapeHtml(items.incomingStarters.map((id) => playerName(playerMap, id)).join(", ") || "None")}</dd></div><div><dt>Incoming bench depth</dt><dd>${escapeHtml(items.incomingBenchDepth.map((id) => playerName(playerMap, id)).join(", ") || "None")}</dd></div><div><dt>Outgoing optimized starters</dt><dd>${escapeHtml(items.outgoingStarters.map((id) => playerName(playerMap, id)).join(", ") || "None")}</dd></div><div><dt>Existing players promoted</dt><dd>${escapeHtml(items.promotedExisting.map((id) => playerName(playerMap, id)).join(", ") || "None")}</dd></div><div><dt>Existing players displaced</dt><dd>${escapeHtml(items.displacedExisting.map((id) => playerName(playerMap, id)).join(", ") || "None")}</dd></div></dl>`;
}

export function renderTradeAnalysisResult(result, snapshot, escapeHtml) {
  const playerMap = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const reasons = (result.reasons || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const limitations = (result.limitations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const violations = (result.roster?.resolved?.violations || result.roster?.direct?.violations || []).map((item) => item.kind === "ROSTER_SIZE" ? `Roster size: ${item.count}/${item.limit} (${item.excess} over)` : `${item.position}: ${item.count}/${item.limit} (${item.excess} over)`).join(" · ");
  if (result.analysisState === "INVALID_PROPOSAL") return `<section class="trade-results" aria-labelledby="trade-results-title"><div class="section-divider"><span id="trade-results-title">ANALYSIS RESULTS</span></div><article class="panel"><div class="panel-head"><div><p class="eyebrow">INVALID PROPOSAL</p><h3>Trade cannot be analyzed yet</h3></div></div><ul>${reasons}</ul></article></section>`;

  const rosterCard = result.roster ? `<article class="panel"><div class="panel-head"><div><p class="eyebrow">ROSTER CONSEQUENCES</p><h3>${escapeHtml(result.roster.resolved?.status || result.roster.direct?.status || "Unknown")}</h3></div><span class="quality ${result.analysisState === "ROSTER_ACTION_REQUIRED" ? "aging" : "fresh"}">${escapeHtml(result.analysisState)}</span></div><dl class="settings-list"><div><dt>Net roster count</dt><dd>${result.roster.netRosterCount >= 0 ? "+" : ""}${result.roster.netRosterCount}</dd></div><div><dt>Open active spots after resolution</dt><dd>${result.roster.openRosterSpots == null ? "Unknown" : result.roster.openRosterSpots}</dd></div><div><dt>Known follow-up removals required</dt><dd>${result.roster.requiredFollowUpRemovals}</dd></div><div><dt>Incoming auto-placed on IR</dt><dd>${result.roster.incomingPlacedOnIr ? "Yes" : "No — never automatic"}</dd></div>${violations ? `<div><dt>Known violations</dt><dd>${escapeHtml(violations)}</dd></div>` : ""}</dl></article>` : "";

  if (result.analysisState === "ROSTER_ACTION_REQUIRED") return `<section class="trade-results" aria-labelledby="trade-results-title"><div class="section-divider"><span id="trade-results-title">ANALYSIS RESULTS</span></div>${rosterCard}<article class="panel"><h3>Another explicit roster action is required</h3><ul>${reasons}</ul><p class="data-note">The analyzer does not silently choose a drop, add a free agent, or present the expanded roster as a legal final lineup.</p></article></section>`;

  const depthRows = (result.depth?.listedPositionChanges || []).map((item) => `<tr><td>${escapeHtml(item.position)}</td><td>${item.before}</td><td>${item.after}</td><td>${item.delta >= 0 ? "+" : ""}${item.delta}</td></tr>`).join("");
  const byeRows = (result.bye?.rows || []).map((row) => `<tr><td>Week ${row.week}</td><td>${row.preUncovered}</td><td>${row.postUncovered}</td><td>${row.gapDelta >= 0 ? "+" : ""}${row.gapDelta}</td></tr>`).join("");
  const replacement = result.replacement;
  const replacementNames = replacement?.status === "READY" ? replacement.candidates.slice(0, 5).map((item) => `${item.name} (${item.position}${item.projection == null ? "" : ` ${item.projection.toFixed(1)}`})`).join(", ") : replacement?.reason || "Unavailable";

  return `<section class="trade-results" aria-labelledby="trade-results-title"><div class="section-divider"><span id="trade-results-title">ANALYSIS RESULTS</span></div>
    <article class="panel optimizer-summary"><div><p class="eyebrow">${escapeHtml(result.analysisState)} · ${escapeHtml(result.evidenceState || "STRUCTURAL_ONLY")}</p><h3>${escapeHtml(result.conclusion)}</h3><p>${escapeHtml(result.currentWeek?.actionability || "Read-only hypothetical")}</p></div><div class="optimizer-score"><strong>${result.readOnly ? "READ ONLY" : "—"}</strong><span>No ESPN trade mutation</span></div></article>
    <div class="dashboard-grid"><article class="panel"><div class="panel-head"><div><p class="eyebrow">PROPOSAL</p><h3>${escapeHtml(result.proposal.teamObjective)}</h3></div></div><dl class="settings-list"><div><dt>Send</dt><dd>${escapeHtml(playerList(result.proposal.outgoing))}</dd></div><div><dt>Receive</dt><dd>${escapeHtml(playerList(result.proposal.incoming))}</dd></div><div><dt>Follow-up drops</dt><dd>${escapeHtml(playerList(result.proposal.plannedFollowUpDrops))}</dd></div><div><dt>Snapshot</dt><dd>${escapeHtml(result.snapshot.capturedAt || "Unknown capture time")}</dd></div></dl></article>${rosterCard}</div>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">CURRENT WEEK · SOURCES KEPT SEPARATE</p><h3>${escapeHtml(result.currentWeek?.direction || "UNKNOWN")}</h3></div><span class="quality ${result.currentWeek?.sourceDisagreement ? "aging" : "fresh"}">${escapeHtml(result.sourceAgreement?.currentWeek || "UNKNOWN")}</span></div><div class="table-wrap"><table><thead><tr><th>Source</th><th>Coverage</th><th>Before</th><th>After</th><th>Delta</th><th>Direction</th></tr></thead><tbody>${sourceRows(result, escapeHtml)}</tbody></table></div>${result.currentWeek?.locks?.length ? `<p class="data-note"><strong>Locked/current-game limitation:</strong> ${escapeHtml(result.currentWeek.locks.map((item) => `${item.playerName}: ${item.reason}`).join(" "))} This is informational only and does not claim whether ESPN would process the trade.</p>` : ""}${lineupChanges(result, playerMap, escapeHtml)}</article>
    <div class="dashboard-grid"><article class="panel"><div class="panel-head"><div><p class="eyebrow">DEPTH & CONTINGENCY</p><h3>${escapeHtml(result.depth?.fragility?.state || "UNKNOWN")}</h3></div></div><p>${escapeHtml(result.depth?.fragility?.reason || "Unavailable")}</p><div class="table-wrap"><table><thead><tr><th>Position</th><th>Before</th><th>After</th><th>Delta</th></tr></thead><tbody>${depthRows}</tbody></table></div><p class="data-note">Listed-position depth and legal contingency coverage are separate. Post-trade maximum uncovered starter slots after losing one optimized starter: ${result.depth?.contingency?.post?.maxUncoveredAfterLoss ?? "Unknown"}.</p></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">REPLACEMENT CONTEXT</p><h3>${escapeHtml(replacement?.status || "UNKNOWN")}</h3></div></div><p>${escapeHtml(replacementNames)}</p><p class="data-note">Latest ESPN availability only. Any add is a separate conditional follow-up action and is never included automatically in this trade.</p></article></div>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">KNOWN BYE EFFECTS</p><h3>${escapeHtml(result.bye?.status || "UNKNOWN")}</h3></div></div>${byeRows ? `<div class="table-wrap"><table><thead><tr><th>Week</th><th>Before gaps</th><th>After gaps</th><th>Gap delta</th></tr></thead><tbody>${byeRows}</tbody></table></div>` : `<p class="data-note">No supported bye-gap change is available.</p>`}</article>
    <div class="dashboard-grid">${horizonCard("FUTURE WINDOW", result.future, escapeHtml)}${horizonCard("PLAYOFF WINDOW", result.playoffs, escapeHtml)}</div>
    <div class="dashboard-grid"><article class="panel"><p class="eyebrow">ORDERED REASONS</p><h3>Why this conclusion</h3><ol>${reasons}</ol></article><article class="panel"><p class="eyebrow">LIMITATIONS</p><h3>What this does not know</h3>${limitations ? `<ul>${limitations}</ul>` : `<p>No additional limitations were recorded for the selected evidence.</p>`}<p class="data-note">There is no trade score, winner percentage, confidence percentage, acceptance probability, or ESPN transaction action.</p></article></div>
  </section>`;
}

function optionRows(players, selected, escapeHtml) {
  return players.map((player) => `<option value="${escapeHtml(player.id)}" ${player.id === selected ? "selected" : ""}>${escapeHtml(player.name)} · ${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "NFL team unavailable")}</option>`).join("");
}

export function createTradeAnalyzerView({ content, getContext, escapeHtml }) {
  const proposal = { outgoingPlayerIds: [], incomingPlayerIds: [], plannedFollowUpDropIds: [], teamObjective: "BALANCED" };
  let result = null;

  function contextInputs() {
    const context = getContext();
    const { state, futureProjectionSet, projectionIdentityMap, selectedFutureWeeks, selectedPlayoffWeeks } = context;
    const importedWeeks = futureProjectionSet ? [...new Set(futureProjectionSet.projections.map((item) => item.week))].sort((a, b) => a - b) : [];
    const futureWeeks = selectedFutureWeeks === null ? importedWeeks.filter((week) => week > state.snapshot.currentWeek && !(state.snapshot.league?.playoffWeeks || []).includes(week)) : importedWeeks.filter((week) => selectedFutureWeeks.includes(week));
    return { context, futureWeeks, playoffWeeks: Array.isArray(state.snapshot.league?.playoffWeeks) && state.snapshot.league.playoffWeeks.length ? state.snapshot.league.playoffWeeks : (selectedPlayoffWeeks || []), futureProjectionSet, projectionIdentityMap };
  }

  function mutate(side, id, add) {
    const list = proposal[side];
    if (add && id && !list.includes(id)) list.push(id);
    if (!add) proposal[side] = list.filter((item) => item !== id);
    result = null;
    render();
  }

  function render() {
    const { context, futureWeeks, playoffWeeks, futureProjectionSet, projectionIdentityMap } = contextInputs();
    const { state } = context;
    const roster = state.snapshot.rosters.find((item) => item.teamId === state.selectedTeamId);
    const rosterIds = new Set((roster?.entries || []).map((entry) => entry.playerId));
    const outgoingChoices = (roster?.entries || []).map((entry) => state.snapshot.players.find((player) => player.id === entry.playerId)).filter(Boolean).filter((player) => !proposal.outgoingPlayerIds.includes(player.id));
    const incomingChoices = state.snapshot.players.filter((player) => !rosterIds.has(player.id) && !proposal.incomingPlayerIds.includes(player.id));
    const directIds = [...(roster?.entries || []).map((entry) => entry.playerId).filter((id) => !proposal.outgoingPlayerIds.includes(id)), ...proposal.incomingPlayerIds];
    const dropChoices = [...new Set(directIds)].map((id) => state.snapshot.players.find((player) => player.id === id)).filter(Boolean).filter((player) => !proposal.plannedFollowUpDropIds.includes(player.id));
    const playerMap = new Map(state.snapshot.players.map((player) => [player.id, player]));
    const selectedChip = (id, side, label) => `<button type="button" class="button ghost" data-trade-remove="${escapeHtml(side)}" data-player-id-value="${escapeHtml(id)}" aria-label="Remove ${escapeHtml(playerName(playerMap, id))} from ${escapeHtml(label)}">${escapeHtml(playerName(playerMap, id))} ×</button>`;
    const showDrops = result?.analysisState === "ROSTER_ACTION_REQUIRED" || proposal.plannedFollowUpDropIds.length > 0;

    content.innerHTML = `<div class="page-head"><div><p class="eyebrow">READ-ONLY TEAM CONSEQUENCE ANALYSIS</p><h2>Trade Analyzer</h2><p>Build a hypothetical package and see what changes for your roster, legal lineup, depth, byes, and supported future windows. No trade is sent to ESPN.</p></div><span class="week-pill">ESPN snapshot · Week ${state.snapshot.currentWeek}</span></div>
      <article class="panel trade-proposal" aria-labelledby="trade-proposal-title"><div class="panel-head"><div><p class="eyebrow">PROPOSAL CONTROLS</p><h3 id="trade-proposal-title">Build the trade</h3></div><span class="quality fresh">Read-only</span></div>
      <div class="connection-form"><label>Send from my roster<select id="trade-outgoing-select" aria-label="Outgoing player">${optionRows(outgoingChoices, outgoingChoices[0]?.id, escapeHtml)}</select></label><button class="button secondary" id="trade-add-outgoing" type="button" ${outgoingChoices.length ? "" : "disabled"}>Add outgoing</button><label>Receive from ESPN snapshot<select id="trade-incoming-select" aria-label="Incoming player">${optionRows(incomingChoices, incomingChoices[0]?.id, escapeHtml)}</select></label><button class="button secondary" id="trade-add-incoming" type="button" ${incomingChoices.length ? "" : "disabled"}>Add incoming</button><label>Team objective<select id="trade-objective"><option value="BALANCED" ${proposal.teamObjective === "BALANCED" ? "selected" : ""}>Balanced</option><option value="CURRENT_WEEK_STABILITY" ${proposal.teamObjective === "CURRENT_WEEK_STABILITY" ? "selected" : ""}>Current-week stability</option><option value="FUTURE_UPSIDE" ${proposal.teamObjective === "FUTURE_UPSIDE" ? "selected" : ""}>Future upside</option></select></label></div>
      <div class="dashboard-grid"><div><p class="eyebrow">SEND</p><div class="sync-actions">${proposal.outgoingPlayerIds.length ? proposal.outgoingPlayerIds.map((id) => selectedChip(id, "outgoingPlayerIds", "outgoing players")).join("") : `<span class="data-note">No outgoing players selected.</span>`}</div></div><div><p class="eyebrow">RECEIVE</p><div class="sync-actions">${proposal.incomingPlayerIds.length ? proposal.incomingPlayerIds.map((id) => selectedChip(id, "incomingPlayerIds", "incoming players")).join("") : `<span class="data-note">No incoming players selected.</span>`}</div></div></div>
      ${showDrops ? `<div class="section-divider"><span>FOLLOW-UP ROSTER ACTION</span></div><p class="data-note">Choose an explicit follow-up drop only when the known roster rules require another removal. The analyzer never chooses one silently.</p><div class="connection-form"><label>Planned follow-up drop<select id="trade-drop-select" aria-label="Follow-up drop">${optionRows(dropChoices, dropChoices[0]?.id, escapeHtml)}</select></label><button class="button secondary" id="trade-add-drop" type="button" ${dropChoices.length ? "" : "disabled"}>Add follow-up drop</button></div><div class="sync-actions">${proposal.plannedFollowUpDropIds.map((id) => selectedChip(id, "plannedFollowUpDropIds", "follow-up drops")).join("")}</div>` : ""}
      <div class="sync-actions"><button class="button primary" id="trade-analyze" type="button">Analyze proposed trade</button><button class="button secondary" id="trade-reset" type="button">Reset proposal</button></div><p class="data-note">Future window: ${futureWeeks.length ? `Weeks ${futureWeeks.join(", ")}` : "no complete imported selection configured"}. Playoff window: ${playoffWeeks.length ? `Weeks ${playoffWeeks.join(", ")}` : "not configured"}.</p></article>
      ${result ? renderTradeAnalysisResult(result, state.snapshot, escapeHtml) : `<div class="section-divider"><span>ANALYSIS RESULTS</span></div><article class="panel"><h3>Run the proposal when ready</h3><p>No package total or hidden trade score is calculated. Results are based on your roster consequences and supported source evidence.</p></article>`}`;

    content.querySelector("#trade-add-outgoing")?.addEventListener("click", () => mutate("outgoingPlayerIds", content.querySelector("#trade-outgoing-select")?.value, true));
    content.querySelector("#trade-add-incoming")?.addEventListener("click", () => mutate("incomingPlayerIds", content.querySelector("#trade-incoming-select")?.value, true));
    content.querySelector("#trade-add-drop")?.addEventListener("click", () => mutate("plannedFollowUpDropIds", content.querySelector("#trade-drop-select")?.value, true));
    content.querySelectorAll("[data-trade-remove]").forEach((button) => button.addEventListener("click", () => mutate(button.dataset.tradeRemove, button.dataset.playerIdValue, false)));
    content.querySelector("#trade-objective")?.addEventListener("change", (event) => { proposal.teamObjective = event.target.value; result = null; render(); });
    content.querySelector("#trade-reset")?.addEventListener("click", () => { proposal.outgoingPlayerIds = []; proposal.incomingPlayerIds = []; proposal.plannedFollowUpDropIds = []; proposal.teamObjective = "BALANCED"; result = null; render(); });
    content.querySelector("#trade-analyze")?.addEventListener("click", () => {
      result = analyzeTrade(state.snapshot, state.selectedTeamId, proposal, { futureProjectionSet, identityMap: projectionIdentityMap, futureWeeks, playoffWeeks });
      render();
      content.querySelector("#trade-results-title")?.scrollIntoView?.({ block: "start" });
    });
  }

  return Object.freeze({ render, getProposal: () => structuredClone(proposal), getResult: () => result });
}
