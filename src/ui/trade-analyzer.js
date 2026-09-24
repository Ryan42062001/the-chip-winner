import { analyzeTrade, buildTradeOwnershipIndex, isUniquelyOwnedByTeam } from "../domain/trade-analyzer.js";

function signed(value) {
  if (!Number.isFinite(value)) return "Unavailable";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)} pts`;
}

function playerName(playerMap, id) { return playerMap.get(id)?.name || id || "Unavailable"; }
function playerList(items) { return items.length ? items.map((item) => item.name).join(", ") : "None"; }
function freshnessText(item) {
  const status = item?.freshness?.status || "unknown";
  return `${status}${item?.capturedAt ? ` · captured ${item.capturedAt}` : " · capture time unavailable"}`;
}

function packageValueReason(result) {
  const reason = result.packageValue?.reasons?.[0];
  if (reason === "NO_APPROVED_COMPARABLE_VALUE_SOURCE") return "No approved package-value source is configured. The analyzer will not invent a market-value winner or split.";
  if (result.packageValue?.status === "SOURCE_DISAGREEMENT") return "Approved package-value sources disagree on the winner classification, so the generic winner is withheld.";
  if (reason === "INVALID_PROPOSAL") return "Package value is withheld until the proposal identities and ownership are valid.";
  if (reason === "PACKAGE_VALUE_SOURCE_GATE_FAILED") return "Package value is withheld because the configured source did not pass authority, freshness, compatibility, or complete-coverage checks.";
  return "Package value is withheld because no complete approved comparable value result is available.";
}

function winnerAndRosterCards(result, escapeHtml) {
  const value = result.packageValue;
  const ready = value?.status === "READY";
  const valueTitle = ready ? value.winner.replaceAll("_", " ") : "Package value unavailable";
  const split = ready && value.displayedSplit ? `<p class="data-note"><strong>${escapeHtml(value.displayedSplit.label)} received/sent</strong> · relative package asset value, not win probability, future-performance probability, or acceptance probability.</p>` : "";
  const source = ready ? `<p class="data-note">Source: ${escapeHtml(value.sourceId)} · ${escapeHtml(value.sourceVersion)} · as of ${escapeHtml(value.asOf)} · ${escapeHtml(value.unit)}</p>` : "";
  const packageCard = `<article class="panel trade-package-value"><div class="panel-head"><div><p class="eyebrow">PACKAGE VALUE · INDEPENDENT</p><h3>${escapeHtml(valueTitle)}</h3></div><span class="quality ${ready ? "fresh" : "aging"}">${escapeHtml(value?.status || "WITHHELD")}</span></div><p>${escapeHtml(ready ? "Comparable approved additive asset-value evidence is complete." : packageValueReason(result))}</p>${split}${source}</article>`;

  const decision = result.doNothing;
  const decisionTitle = decision?.userDecision || "WITHHELD";
  const benefits = decision?.materialBenefits?.length ? decision.materialBenefits.join(", ") : "None supported";
  const costs = decision?.materialCosts?.length ? decision.materialCosts.join(", ") : "None supported";
  const rosterCard = `<article class="panel trade-roster-decision"><div class="panel-head"><div><p class="eyebrow">YOUR ROSTER IMPACT · VS DO NOTHING</p><h3>${escapeHtml(decisionTitle)}</h3></div><span class="quality ${decisionTitle === "WORSENS" ? "aging" : decisionTitle === "WITHHELD" ? "aging" : "fresh"}">${escapeHtml(decision?.recommendation || "NOT_ENOUGH_EVIDENCE")}</span></div><dl class="settings-list"><div><dt>Supported benefits</dt><dd>${escapeHtml(benefits)}</dd></div><div><dt>Supported costs</dt><dd>${escapeHtml(costs)}</dd></div><div><dt>Severe supported gap</dt><dd>${decision?.severeGap ? "Yes" : "No"}</dd></div><div><dt>Decision confidence</dt><dd>${escapeHtml(result.confidence?.userDecision?.claimConfidence || "WITHHELD")}</dd></div></dl></article>`;
  return `<div class="dashboard-grid trade-decision-grid">${packageCard}${rosterCard}</div>`;
}

function sourceRows(result, escapeHtml) {
  return (result.currentWeek?.sources || []).map((source) => `<tr><td><strong>${escapeHtml(source.source)}</strong><small>${escapeHtml(freshnessText(source))}</small></td><td>${escapeHtml(source.status)}</td><td>${source.preTotal == null ? "—" : source.preTotal.toFixed(1)}</td><td>${source.postTotal == null ? "—" : source.postTotal.toFixed(1)}</td><td>${source.delta == null ? "—" : signed(source.delta)}</td><td>${escapeHtml(source.direction)}</td></tr>`).join("");
}

function horizonCard(title, horizon, escapeHtml) {
  if (!horizon) return "";
  const rows = (horizon.rows || []).map((row) => `<tr><td>Week ${row.week}</td><td>${row.preTotal == null ? "—" : row.preTotal.toFixed(1)}</td><td>${row.postTotal == null ? "—" : row.postTotal.toFixed(1)}</td><td>${row.delta == null ? "—" : signed(row.delta)}</td><td>${escapeHtml(row.direction || row.status)}</td></tr>`).join("");
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">${escapeHtml(title)}</p><h3>${escapeHtml(horizon.direction)}</h3></div><span class="quality ${horizon.status === "READY" ? "fresh" : "aging"}">${escapeHtml(horizon.status)}</span></div>
    <dl class="settings-list"><div><dt>Window</dt><dd>${escapeHtml(horizon.label)}</dd></div><div><dt>Aggregate delta</dt><dd>${horizon.horizonDelta == null ? "Unavailable" : signed(horizon.horizonDelta)}</dd></div><div><dt>Mean weekly delta</dt><dd>${horizon.meanWeeklyDelta == null ? "Unavailable" : signed(horizon.meanWeeklyDelta)}</dd></div><div><dt>Projection source</dt><dd>${escapeHtml(horizon.source || "Unavailable")}</dd></div><div><dt>Source freshness</dt><dd>${escapeHtml(freshnessText(horizon))}</dd></div></dl>
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
  const parties = `<article class="panel"><p class="eyebrow">EVALUATED PARTIES · READ ONLY</p><dl class="settings-list"><div><dt>My team</dt><dd>${escapeHtml(result.proposal.userTeam?.name || "Unavailable")}</dd></div><div><dt>Trade partner</dt><dd>${escapeHtml(result.proposal.partnerTeam?.name || "Not selected")}</dd></div><div><dt>Send</dt><dd>${escapeHtml(playerList(result.proposal.outgoing || []))}</dd></div><div><dt>Receive</dt><dd>${escapeHtml(playerList(result.proposal.incoming || []))}</dd></div><div><dt>Explicit follow-up drops</dt><dd>${escapeHtml(playerList(result.proposal.plannedFollowUpDrops || []))}</dd></div></dl></article>`;
  const decisionCards = winnerAndRosterCards(result, escapeHtml);
  if (result.analysisState === "INVALID_PROPOSAL") return `<section class="trade-results" aria-labelledby="trade-results-title"><div class="section-divider"><span id="trade-results-title">ANALYSIS RESULTS</span></div>${parties}${decisionCards}<article class="panel"><div class="panel-head"><div><p class="eyebrow">INVALID PROPOSAL</p><h3>Trade cannot be analyzed yet</h3></div></div><ul>${reasons}</ul></article></section>`;

  const rosterCard = result.roster ? `<article class="panel"><div class="panel-head"><div><p class="eyebrow">ROSTER CONSEQUENCES</p><h3>${escapeHtml(result.roster.resolved?.status || result.roster.direct?.status || "Unknown")}</h3></div><span class="quality ${result.analysisState === "ROSTER_ACTION_REQUIRED" ? "aging" : "fresh"}">${escapeHtml(result.analysisState)}</span></div><dl class="settings-list"><div><dt>Net roster count</dt><dd>${result.roster.netRosterCount >= 0 ? "+" : ""}${result.roster.netRosterCount}</dd></div><div><dt>Open active spots after resolution</dt><dd>${result.roster.openRosterSpots == null ? "Unknown" : result.roster.openRosterSpots}</dd></div><div><dt>Known follow-up removals required</dt><dd>${result.roster.requiredFollowUpRemovals}</dd></div><div><dt>Incoming auto-placed on IR</dt><dd>${result.roster.incomingPlacedOnIr ? "Yes" : "No — never automatic"}</dd></div>${violations ? `<div><dt>Known violations</dt><dd>${escapeHtml(violations)}</dd></div>` : ""}</dl></article>` : "";

  if (result.analysisState === "ROSTER_ACTION_REQUIRED") return `<section class="trade-results" aria-labelledby="trade-results-title"><div class="section-divider"><span id="trade-results-title">ANALYSIS RESULTS</span></div>${parties}${decisionCards}${rosterCard}<article class="panel"><h3>Another explicit roster action is required</h3><ul>${reasons}</ul><p class="data-note">The analyzer does not silently choose a drop, add a free agent, or present the expanded roster as a legal final lineup.</p></article></section>`;

  const depthRows = (result.depth?.listedPositionChanges || []).map((item) => `<tr><td>${escapeHtml(item.position)}</td><td>${item.before}</td><td>${item.after}</td><td>${item.delta >= 0 ? "+" : ""}${item.delta}</td></tr>`).join("");
  const byeRows = (result.bye?.rows || []).map((row) => `<tr><td>Week ${row.week}</td><td>${row.preUncovered}</td><td>${row.postUncovered}</td><td>${row.gapDelta >= 0 ? "+" : ""}${row.gapDelta}</td></tr>`).join("");
  const replacement = result.replacement;
  const replacementNames = replacement?.status === "READY" ? replacement.candidates.slice(0, 5).map((item) => `${item.name} (${item.position}${item.projection == null ? "" : ` ${item.projection.toFixed(1)}`})`).join(", ") : replacement?.reason || "Unavailable";

  return `<section class="trade-results" aria-labelledby="trade-results-title"><div class="section-divider"><span id="trade-results-title">ANALYSIS RESULTS</span></div>${parties}${decisionCards}
    <article class="panel optimizer-summary"><div><p class="eyebrow">${escapeHtml(result.analysisState)} · ${escapeHtml(result.evidenceState || "STRUCTURAL_ONLY")}</p><h3>${escapeHtml(result.conclusion)}</h3><p>${escapeHtml(result.currentWeek?.actionability || "Read-only hypothetical")}</p></div><div class="optimizer-score"><strong>${result.readOnly ? "READ ONLY" : "—"}</strong><span>No ESPN trade mutation</span></div></article>
    <div class="dashboard-grid"><article class="panel"><div class="panel-head"><div><p class="eyebrow">PROPOSAL</p><h3>${escapeHtml(result.proposal.teamObjective)}</h3></div></div><dl class="settings-list"><div><dt>Send</dt><dd>${escapeHtml(playerList(result.proposal.outgoing))}</dd></div><div><dt>Receive</dt><dd>${escapeHtml(playerList(result.proposal.incoming))}</dd></div><div><dt>Follow-up drops</dt><dd>${escapeHtml(playerList(result.proposal.plannedFollowUpDrops))}</dd></div><div><dt>Snapshot source</dt><dd>${escapeHtml(`${result.snapshot.provider || "ESPN"}${result.snapshot.projectionsSource ? ` · ${result.snapshot.projectionsSource}` : ""}`)}</dd></div><div><dt>Snapshot freshness</dt><dd>${escapeHtml(`${result.snapshot.freshness?.status || "unknown"}${result.snapshot.capturedAt ? ` · captured ${result.snapshot.capturedAt}` : " · capture time unavailable"}`)}</dd></div></dl></article>${rosterCard}</div>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">CURRENT WEEK · SOURCES KEPT SEPARATE</p><h3>${escapeHtml(result.currentWeek?.direction || "UNKNOWN")}</h3></div><span class="quality ${result.currentWeek?.sourceDisagreement ? "aging" : "fresh"}">${escapeHtml(result.sourceAgreement?.currentWeek || "UNKNOWN")}</span></div><div class="table-wrap"><table><thead><tr><th>Source</th><th>Coverage</th><th>Before</th><th>After</th><th>Delta</th><th>Direction</th></tr></thead><tbody>${sourceRows(result, escapeHtml)}</tbody></table></div>${result.currentWeek?.locks?.length ? `<p class="data-note"><strong>Locked/current-game limitation:</strong> ${escapeHtml(result.currentWeek.locks.map((item) => `${item.playerName}: ${item.reason}`).join(" "))} This is informational only and does not claim whether ESPN would process the trade.</p>` : ""}${lineupChanges(result, playerMap, escapeHtml)}</article>
    <div class="dashboard-grid"><article class="panel"><div class="panel-head"><div><p class="eyebrow">DEPTH & CONTINGENCY</p><h3>${escapeHtml(result.depth?.fragility?.state || "UNKNOWN")}</h3></div></div><p>${escapeHtml(result.depth?.fragility?.reason || "Unavailable")}</p><div class="table-wrap"><table><thead><tr><th>Position</th><th>Before</th><th>After</th><th>Delta</th></tr></thead><tbody>${depthRows}</tbody></table></div><p class="data-note">Listed-position depth and legal contingency coverage are separate. Post-trade maximum uncovered starter slots after losing one optimized starter: ${result.depth?.contingency?.post?.maxUncoveredAfterLoss ?? "Unknown"}.</p></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">REPLACEMENT CONTEXT</p><h3>${escapeHtml(replacement?.status || "UNKNOWN")}</h3></div></div><p>${escapeHtml(replacementNames)}</p><p class="data-note">${escapeHtml(replacement ? freshnessText(replacement) : "Source freshness unknown")}. Latest ESPN availability only. Any add is a separate conditional follow-up action and is never included automatically in this trade.</p></article></div>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">KNOWN BYE EFFECTS</p><h3>${escapeHtml(result.bye?.status || "UNKNOWN")}</h3></div></div>${byeRows ? `<div class="table-wrap"><table><thead><tr><th>Week</th><th>Before gaps</th><th>After gaps</th><th>Gap delta</th></tr></thead><tbody>${byeRows}</tbody></table></div>` : `<p class="data-note">No supported bye-gap change is available.</p>`}</article>
    <div class="recommendation-grid">${horizonCard("FUTURE WINDOW", result.future, escapeHtml)}${horizonCard("REST OF SEASON", result.restOfSeason, escapeHtml)}${horizonCard("PLAYOFF WINDOW", result.playoffs, escapeHtml)}</div>
    <div class="dashboard-grid"><article class="panel"><p class="eyebrow">ORDERED REASONS</p><h3>Why this conclusion</h3><ol>${reasons}</ol></article><article class="panel"><p class="eyebrow">LIMITATIONS</p><h3>What this does not know</h3>${limitations ? `<ul>${limitations}</ul>` : `<p>No additional limitations were recorded for the selected evidence.</p>`}<p class="data-note">Package value and roster impact are separate. No displayed package split is a probability, and there is no acceptance probability or ESPN transaction action.</p></article></div>
  </section>`;
}

function optionRows(players, selected, escapeHtml) {
  return players.map((player) => `<option value="${escapeHtml(player.id)}" ${player.id === selected ? "selected" : ""}>${escapeHtml(player.name)} · ${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "NFL team unavailable")}</option>`).join("");
}

export function createTradeAnalyzerView({ content, getContext, escapeHtml }) {
  const emptyProposal = () => ({ partnerTeamId: "", outgoingPlayerIds: [], incomingPlayerIds: [], plannedFollowUpDropIds: [], teamObjective: "BALANCED" });
  let proposal = emptyProposal();
  let result = null;
  let viewError = null;
  let boundSnapshot = null;
  let boundTeamId = null;

  function contextInputs() {
    const context = getContext();
    const { state, futureProjectionSet, projectionIdentityMap, selectedFutureWeeks, selectedPlayoffWeeks } = context;
    const importedWeeks = futureProjectionSet ? [...new Set(futureProjectionSet.projections.map((item) => item.week))].sort((a, b) => a - b) : [];
    const futureWeeks = selectedFutureWeeks === null ? importedWeeks.filter((week) => week > state.snapshot.currentWeek && !(state.snapshot.league?.playoffWeeks || []).includes(week)) : importedWeeks.filter((week) => selectedFutureWeeks.includes(week));
    return { context, futureWeeks, playoffWeeks: Array.isArray(state.snapshot.league?.playoffWeeks) && state.snapshot.league.playoffWeeks.length ? state.snapshot.league.playoffWeeks : (selectedPlayoffWeeks || []), futureProjectionSet, projectionIdentityMap };
  }

  function mutate(side, id, add) {
    const list = proposal[side];
    if (add && id && !list.includes(id)) {
      // The domain independently enforces ownership; the UI also rejects stale/tampered control values.
      const state = getContext().state;
      const roster = state.snapshot.rosters.find((item) => item.teamId === state.selectedTeamId);
      const partner = state.snapshot.rosters.find((item) => String(item.teamId) === String(proposal.partnerTeamId));
      const owners = buildTradeOwnershipIndex(state.snapshot);
      const outgoingIds = new Set((roster?.entries || []).map((entry) => entry.playerId));
      const incomingIds = new Set((partner?.entries || []).map((entry) => entry.playerId));
      const directIds = new Set([...(roster?.entries || []).map((entry) => entry.playerId).filter((item) => !proposal.outgoingPlayerIds.includes(item)), ...proposal.incomingPlayerIds]);
      const permitted = side === "outgoingPlayerIds" ? outgoingIds.has(id) && isUniquelyOwnedByTeam(owners, id, state.selectedTeamId)
        : side === "incomingPlayerIds" ? Boolean(proposal.partnerTeamId) && incomingIds.has(id) && !outgoingIds.has(id) && isUniquelyOwnedByTeam(owners, id, proposal.partnerTeamId)
          : side === "plannedFollowUpDropIds" && directIds.has(id);
      if (!permitted) {
        result = null;
        viewError = "That player is not eligible for the currently selected trade side and team. Review the current ESPN roster and try again.";
        render();
        return;
      }
      list.push(id);
    }
    if (!add) proposal[side] = list.filter((item) => item !== id);
    const direct = new Set([...(getContext().state.snapshot.rosters.find((item) => item.teamId === getContext().state.selectedTeamId)?.entries || []).map((entry) => entry.playerId).filter((item) => !proposal.outgoingPlayerIds.includes(item)), ...proposal.incomingPlayerIds]);
    proposal.plannedFollowUpDropIds = proposal.plannedFollowUpDropIds.filter((item) => direct.has(item));
    result = null;
    viewError = null;
    render();
  }

  function render() {
    const { context, futureWeeks, playoffWeeks, futureProjectionSet, projectionIdentityMap } = contextInputs();
    const { state } = context;
    if (boundSnapshot !== state.snapshot || boundTeamId !== state.selectedTeamId) {
      proposal = emptyProposal();
      result = null;
      viewError = null;
      boundSnapshot = state.snapshot;
      boundTeamId = state.selectedTeamId;
    }
    const teams = state.snapshot.teams || [];
    const myTeam = teams.find((team) => team.id === state.selectedTeamId);
    const roster = state.snapshot.rosters.find((item) => item.teamId === state.selectedTeamId);
    const rosterIds = new Set((roster?.entries || []).map((entry) => entry.playerId));
    const ownerTeams = buildTradeOwnershipIndex(state.snapshot);
    const opponents = teams.filter((team) => team.id !== state.selectedTeamId && (state.snapshot.rosters || []).filter((item) => item.teamId === team.id && Array.isArray(item.entries)).length === 1);
    if (proposal.partnerTeamId && !opponents.some((team) => String(team.id) === String(proposal.partnerTeamId))) {
      proposal.partnerTeamId = "";
      proposal.incomingPlayerIds = [];
      proposal.plannedFollowUpDropIds = [];
      result = null;
      viewError = "The previous trade partner is no longer available in this ESPN snapshot. Choose an opposing team.";
    }
    const partnerTeam = opponents.find((team) => String(team.id) === String(proposal.partnerTeamId));
    const partnerRoster = state.snapshot.rosters.find((item) => item.teamId === partnerTeam?.id);
    const outgoingChoices = (roster?.entries || [])
      .map((entry) => state.snapshot.players.find((player) => player.id === entry.playerId))
      .filter(Boolean)
      .filter((player) => isUniquelyOwnedByTeam(ownerTeams, player.id, state.selectedTeamId))
      .filter((player) => !proposal.outgoingPlayerIds.includes(player.id));
    const incomingChoices = (partnerRoster?.entries || [])
      .map((entry) => state.snapshot.players.find((player) => player.id === entry.playerId))
      .filter(Boolean)
      .filter((player) => isUniquelyOwnedByTeam(ownerTeams, player.id, partnerTeam?.id))
      .filter((player) => !rosterIds.has(player.id) && !proposal.incomingPlayerIds.includes(player.id));
    const directIds = [...(roster?.entries || []).map((entry) => entry.playerId).filter((id) => !proposal.outgoingPlayerIds.includes(id)), ...proposal.incomingPlayerIds];
    const dropChoices = [...new Set(directIds)].map((id) => state.snapshot.players.find((player) => player.id === id)).filter(Boolean).filter((player) => !proposal.plannedFollowUpDropIds.includes(player.id));
    const playerMap = new Map(state.snapshot.players.map((player) => [player.id, player]));
    const selectedChip = (id, side, label) => `<button type="button" class="button ghost" data-trade-remove="${escapeHtml(side)}" data-player-id-value="${escapeHtml(id)}" aria-label="Remove ${escapeHtml(playerName(playerMap, id))} from ${escapeHtml(label)}">${escapeHtml(playerName(playerMap, id))} ×</button>`;
    const showDrops = result?.analysisState === "ROSTER_ACTION_REQUIRED" || proposal.plannedFollowUpDropIds.length > 0;

    content.innerHTML = `<div class="page-head"><div><p class="eyebrow">READ-ONLY TEAM CONSEQUENCE ANALYSIS</p><h2>Trade Analyzer</h2><p>Select one real opposing ESPN team and build a hypothetical player-for-player package. No trade is sent to ESPN.</p></div><span class="week-pill">ESPN snapshot · Week ${escapeHtml(String(state.snapshot.currentWeek ?? "unknown"))}</span></div>
      <article class="panel trade-proposal" aria-labelledby="trade-proposal-title"><div class="panel-head"><div><p class="eyebrow">PROPOSAL CONTROLS</p><h3 id="trade-proposal-title">Build the trade</h3></div><span class="quality fresh">Read-only</span></div>
      <div class="trade-partner-control"><label>Trade partner<select id="trade-partner-select" aria-label="Trade partner"><option value="">Select opposing team</option>${opponents.map((team) => `<option value="${escapeHtml(String(team.id))}" ${String(team.id) === String(proposal.partnerTeamId) ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("")}</select></label><p class="data-note">Choose one opposing ESPN team before selecting players to receive.</p></div>
      <div class="trade-sides" aria-label="Trade player entry">
        <section class="trade-side" data-trade-side="send" aria-labelledby="trade-send-title">
          <div class="trade-side-head"><p class="eyebrow">SEND</p><h4 id="trade-send-title">${escapeHtml(myTeam?.name || "Selected user team")}</h4></div>
          <div class="trade-player-entry"><label>Player<select id="trade-outgoing-select" aria-label="Outgoing player">${optionRows(outgoingChoices, outgoingChoices[0]?.id, escapeHtml)}</select></label><button class="button secondary trade-add-button" id="trade-add-outgoing" type="button" aria-label="Add outgoing" ${outgoingChoices.length ? "" : "disabled"}>Add</button></div>
          <div class="trade-selected" data-trade-selected="send">${proposal.outgoingPlayerIds.length ? proposal.outgoingPlayerIds.map((id) => selectedChip(id, "outgoingPlayerIds", "outgoing players")).join("") : `<span class="data-note">No outgoing players selected.</span>`}</div>
        </section>
        <section class="trade-side" data-trade-side="receive" aria-labelledby="trade-receive-title">
          <div class="trade-side-head"><p class="eyebrow">RECEIVE</p><h4 id="trade-receive-title">${escapeHtml(partnerTeam?.name || "Select opposing team")}</h4></div>
          <div class="trade-player-entry"><label>Player<select id="trade-incoming-select" aria-label="Incoming player">${optionRows(incomingChoices, incomingChoices[0]?.id, escapeHtml)}</select></label><button class="button secondary trade-add-button" id="trade-add-incoming" type="button" aria-label="Add incoming" ${incomingChoices.length ? "" : "disabled"}>Add</button></div>
          <div class="trade-selected" data-trade-selected="receive">${proposal.incomingPlayerIds.length ? proposal.incomingPlayerIds.map((id) => selectedChip(id, "incomingPlayerIds", "incoming players")).join("") : `<span class="data-note">No incoming players selected.</span>`}</div>
        </section>
      </div>
      <div class="trade-objective-control"><label>Team objective<select id="trade-objective"><option value="BALANCED" ${proposal.teamObjective === "BALANCED" ? "selected" : ""}>Balanced</option><option value="CURRENT_WEEK_STABILITY" ${proposal.teamObjective === "CURRENT_WEEK_STABILITY" ? "selected" : ""}>Current-week stability</option><option value="FUTURE_UPSIDE" ${proposal.teamObjective === "FUTURE_UPSIDE" ? "selected" : ""}>Future upside</option></select></label></div>
      ${showDrops ? `<div class="section-divider"><span>FOLLOW-UP ROSTER ACTION</span></div><p class="data-note">Choose an explicit follow-up drop only when the known roster rules require another removal. The analyzer never chooses one silently.</p><div class="connection-form"><label>Planned follow-up drop<select id="trade-drop-select" aria-label="Follow-up drop">${optionRows(dropChoices, dropChoices[0]?.id, escapeHtml)}</select></label><button class="button secondary" id="trade-add-drop" type="button" ${dropChoices.length ? "" : "disabled"}>Add follow-up drop</button></div><div class="sync-actions">${proposal.plannedFollowUpDropIds.map((id) => selectedChip(id, "plannedFollowUpDropIds", "follow-up drops")).join("")}</div>` : ""}
      <div class="sync-actions"><button class="button primary" id="trade-analyze" type="button">Analyze proposed trade</button><button class="button secondary" id="trade-reset" type="button">Reset proposal</button></div><p class="data-note">Future window: ${futureWeeks.length ? `Weeks ${futureWeeks.join(", ")}` : "no complete imported selection configured"}. Playoff window: ${playoffWeeks.length ? `Weeks ${playoffWeeks.join(", ")}` : "not configured"}.</p></article>
      ${viewError ? `<article class="panel" role="alert"><h3>Trade analysis unavailable</h3><p>${escapeHtml(viewError)}</p></article>` : ""}
      ${result ? renderTradeAnalysisResult(result, state.snapshot, escapeHtml) : `<div class="section-divider"><span>ANALYSIS RESULTS</span></div><article class="panel"><h3>Run the proposal when ready</h3><p>${partnerTeam ? "Select players and analyze the proposal." : "Select one opposing team before choosing incoming players."} Results use your roster consequences and supported source evidence.</p></article>`}`;

    content.querySelector("#trade-partner-select")?.addEventListener("change", (event) => {
      const next = opponents.find((team) => String(team.id) === event.target.value);
      proposal.partnerTeamId = next?.id ?? "";
      proposal.incomingPlayerIds = [];
      proposal.plannedFollowUpDropIds = [];
      result = null;
      viewError = null;
      render();
    });
    content.querySelector("#trade-add-outgoing")?.addEventListener("click", () => mutate("outgoingPlayerIds", content.querySelector("#trade-outgoing-select")?.value, true));
    content.querySelector("#trade-add-incoming")?.addEventListener("click", () => mutate("incomingPlayerIds", content.querySelector("#trade-incoming-select")?.value, true));
    content.querySelector("#trade-add-drop")?.addEventListener("click", () => mutate("plannedFollowUpDropIds", content.querySelector("#trade-drop-select")?.value, true));
    content.querySelectorAll("[data-trade-remove]").forEach((button) => button.addEventListener("click", () => mutate(button.dataset.tradeRemove, button.dataset.playerIdValue, false)));
    content.querySelector("#trade-objective")?.addEventListener("change", (event) => { proposal.teamObjective = event.target.value; result = null; viewError = null; render(); });
    content.querySelector("#trade-reset")?.addEventListener("click", () => { proposal = emptyProposal(); result = null; viewError = null; render(); });
    content.querySelector("#trade-analyze")?.addEventListener("click", () => {
      try {
        // Re-read the latest context before invoking the engine; a refreshed snapshot cannot inherit an earlier result.
        const latest = contextInputs();
        if (latest.context.state.snapshot !== state.snapshot || latest.context.state.selectedTeamId !== state.selectedTeamId) {
          render();
          return;
        }
        result = analyzeTrade(state.snapshot, state.selectedTeamId, proposal, { futureProjectionSet, identityMap: projectionIdentityMap, futureWeeks, playoffWeeks });
        viewError = null;
      } catch {
        result = null;
        viewError = "Trade analysis could not complete with the current snapshot. No ESPN action was attempted; refresh the league data or revise the proposal.";
      }
      render();
      content.querySelector("#trade-results-title")?.scrollIntoView?.({ block: "start" });
    });
  }

  return Object.freeze({ render, getProposal: () => structuredClone(proposal), getResult: () => result });
}
