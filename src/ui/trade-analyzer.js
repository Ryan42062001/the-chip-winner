import { analyzeTrade, buildTradeOwnershipIndex, isUniquelyOwnedByTeam } from "../domain/trade-analyzer.js";
import { createFantasyCalcManualSource } from "../domain/fantasycalc-manual-source.js";

const LOCAL_VALUE_KEY = "chip-winner:fantasycalc-manual:v1";
function readLocalCapture(leagueId, season, teamId) {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_VALUE_KEY) || "null");
    return stored?.leagueId === leagueId && stored?.season === season && stored?.teamId === teamId ? stored.capture : null;
  } catch { return null; }
}
function saveLocalCapture(leagueId, season, teamId, capture) {
  try {
    if (capture) localStorage.setItem(LOCAL_VALUE_KEY, JSON.stringify({ leagueId, season, teamId, capture }));
    else localStorage.removeItem(LOCAL_VALUE_KEY);
  } catch { /* Private storage may be unavailable; analysis still uses this page's in-memory capture. */ }
}
function defaultManualProfile(snapshot) {
  const ppr = snapshot.league?.receptionScoring?.pointsPerReception;
  const slots = snapshot.league?.lineupSlots || [];
  const qb = slots.find((item) => item.slot === "QB")?.count;
  const op = slots.find((item) => item.slot === "OP")?.count || 0;
  return {
    teamCount: Array.isArray(snapshot.teams) ? snapshot.teams.length : "",
    ppr: ppr === 0 ? "STANDARD" : ppr === 0.5 ? "HALF_PPR" : ppr === 1 ? "PPR" : "",
    qbFormat: Number.isInteger(qb) && qb > 0 ? qb > 1 || op > 0 ? "SUPERFLEX" : "1QB" : "",
    tePremium: typeof snapshot.league?.tePremium === "boolean" ? snapshot.league.tePremium : ""
  };
}
function profileOptions(selected, options, escapeHtml) {
  return options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${String(selected) === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function signed(value) {
  if (!Number.isFinite(value)) return "Unavailable";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)} pts`;
}

function playerName(playerMap, id) { return playerMap.get(id)?.name || id || "Unavailable"; }
function playerList(items) { return items.length ? items.map((item) => item.name).join(", ") : "None"; }
function decisionLabel(value) { return value === "INSUFFICIENT_EVIDENCE" ? "Insufficient evidence" : value; }
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

export function renderTradeAdvantage(value, escapeHtml) {
  const ready = value?.status === "READY" && ["YOU_WIN", "THEY_WIN", "FAIR_TRADE"].includes(value.winner)
    && Number.isFinite(value.incomingShare) && Number.isFinite(value.outgoingShare);
  if (!ready) return `<div class="trade-advantage is-withheld" role="img" aria-label="Package asset value unavailable"><div class="trade-advantage-heading"><strong>Trade Advantage · package asset value</strong><span>Value unavailable</span></div><div class="trade-advantage-track" aria-hidden="true"></div><p>${escapeHtml(value?.status === "SOURCE_DISAGREEMENT" ? "Source disagreement; no generic package winner." : (value?.reasons || []).join(" · ") || "Complete comparable values are unavailable.")}</p></div>`;
  const label = value.winner === "YOU_WIN" ? "Package value favors you" : value.winner === "THEY_WIN" ? "Package value favors them" : "Package value is fair";
  const receive = Math.max(0, Math.min(100, value.incomingShare));
  const send = Math.max(0, Math.min(100, value.outgoingShare));
  return `<div class="trade-advantage is-${escapeHtml(value.winner.toLowerCase().replaceAll("_", "-"))}" role="img" aria-label="${escapeHtml(`${label}. You receive ${receive.toFixed(2)} percent of package asset value; you send ${send.toFixed(2)} percent.`)}"><div class="trade-advantage-heading"><strong>Trade Advantage · package asset value</strong><span>${escapeHtml(label)}</span></div><div class="trade-advantage-track" aria-hidden="true"><span style="width:${receive}%"></span><i style="left:${receive}%"></i></div><div class="trade-advantage-sides"><span>You receive <strong>${escapeHtml(value.displayedSplit?.incoming ?? Math.round(receive))}%</strong></span><span>You send <strong>${escapeHtml(value.displayedSplit?.outgoing ?? Math.round(send))}%</strong></span></div><p>Raw FantasyCalc asset sums; roster consequences are evaluated separately. This is not FantasyCalc's full Trade Calculator verdict.</p></div>`;
}

function decisionSummary(result, escapeHtml, manualCapture = null) {
  const value = result.packageValue;
  const ready = value?.status === "READY";
  const decision = result.doNothing;
  const decisionTitle = decision?.userDecision || "WITHHELD";
  return `<article class="panel trade-decision"><div class="trade-decision-head"><div><p class="eyebrow">DECISION SUMMARY</p><h3>${escapeHtml(decisionLabel(result.conclusion || "Analysis withheld"))}</h3></div><span class="quality ${result.analysisState === "READY" ? "fresh" : "aging"}">${escapeHtml(decisionLabel(result.analysisState))}</span></div>
    <p class="trade-status">${escapeHtml(result.evidenceState || "STRUCTURAL_ONLY")} · ${escapeHtml(result.currentWeek?.actionability || "Read-only hypothetical")}</p>
    <div class="trade-decision-facts"><div><small>PACKAGE VALUE · INDEPENDENT</small><strong>${escapeHtml(ready ? value.winner.replaceAll("_", " ") : "Package value unavailable")}</strong><span>${escapeHtml(value?.status || "WITHHELD")}</span></div><div><small>YOUR ROSTER IMPACT · VS DO NOTHING</small><strong>${escapeHtml(decisionTitle)}</strong><span>${escapeHtml(decision?.recommendation || "NOT_ENOUGH_EVIDENCE")}</span></div><div><small>CONFIDENCE / EVIDENCE</small><strong>${escapeHtml(result.confidence?.userDecision?.claimConfidence || "WITHHELD")}</strong><span>${escapeHtml(result.evidenceState || "STRUCTURAL_ONLY")}</span></div><div><small>ESPN ACTION</small><strong>${result.readOnly ? "READ ONLY" : "—"}</strong><span>No ESPN trade mutation</span></div></div>
    ${renderTradeAdvantage(value, escapeHtml)}
    <p class="data-note trade-package-note">${escapeHtml(ready ? "Comparable approved additive asset-value evidence is complete." : packageValueReason(result))}</p>
    ${ready && value.displayedSplit ? `<p class="data-note"><strong>${escapeHtml(value.displayedSplit.label)} received/sent</strong> · relative package asset value.</p>` : ""}
    ${ready ? `<p class="data-note trade-package-source">Package source: ${escapeHtml(value.sourceId)} · ${escapeHtml(value.sourceVersion)} · as of ${escapeHtml(value.asOf)} · ${escapeHtml(value.unit)}</p>` : ""}
    <details class="trade-subdetail trade-value-provenance"><summary>Package source &amp; limitations</summary><p>FantasyCalc manual Redraft · fantasycalc-market-value · captured ${escapeHtml(manualCapture?.asOf || value?.asOf || "unavailable")} · freshness ${escapeHtml(value?.sourceResults?.[0]?.freshness?.status || "unavailable")}</p><p>Profile: ${escapeHtml(manualCapture ? `${manualCapture.profile.teamCount} teams · ${manualCapture.profile.ppr} · ${manualCapture.profile.qbFormat} · TE premium ${manualCapture.profile.tePremium}` : "unavailable")}</p><p>Source gate: ${escapeHtml(value?.reasons?.join(" · ") || value?.sourceResults?.flatMap((row) => row.reasons || []).join(" · ") || "complete")}</p><p>Package values are source asset values. No FantasyCalc waiver/bench adjustment is imported.</p></details>
    <details class="trade-subdetail"><summary>Roster decision factors</summary><dl class="settings-list"><div><dt>Supported benefits</dt><dd>${escapeHtml(decision?.materialBenefits?.join(", ") || "None supported")}</dd></div><div><dt>Supported costs</dt><dd>${escapeHtml(decision?.materialCosts?.join(", ") || "None supported")}</dd></div><div><dt>Severe supported gap</dt><dd>${decision?.severeGap ? "Yes" : "No"}</dd></div></dl></details>
  </article>`;
}

function impactDetail(title, summary, body, escapeHtml) {
  return `<details class="trade-impact-item" ${title === "Current week" ? "data-trade-current-week" : ""}><summary><strong>${escapeHtml(title)}</strong><span>${escapeHtml(summary)}</span></summary><div class="trade-impact-body">${body}</div></details>`;
}

function sourceRows(result, escapeHtml) {
  return (result.currentWeek?.sources || []).map((source) => `<tr><td data-label="Source"><strong>${escapeHtml(source.source)}</strong><small>${escapeHtml(freshnessText(source))}</small></td><td data-label="Coverage">${escapeHtml(source.status)}</td><td data-label="Before">${source.preTotal == null ? "—" : source.preTotal.toFixed(1)}</td><td data-label="After">${source.postTotal == null ? "—" : source.postTotal.toFixed(1)}</td><td data-label="Delta">${source.delta == null ? "—" : signed(source.delta)}</td><td data-label="Direction">${escapeHtml(source.direction)}</td></tr>`).join("");
}

function horizonCard(title, horizon, escapeHtml) {
  if (!horizon) return "";
  const rows = (horizon.rows || []).map((row) => `<tr><td data-label="Week">Week ${row.week}</td><td data-label="Before">${row.preTotal == null ? "—" : row.preTotal.toFixed(1)}</td><td data-label="After">${row.postTotal == null ? "—" : row.postTotal.toFixed(1)}</td><td data-label="Delta">${row.delta == null ? "—" : signed(row.delta)}</td><td data-label="Direction">${escapeHtml(row.direction || row.status)}</td></tr>`).join("");
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

export function renderTradeAnalysisResult(result, snapshot, escapeHtml, manualCapture = null) {
  const playerMap = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const reasons = (result.reasons || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const limitations = (result.limitations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const violations = (result.roster?.resolved?.violations || result.roster?.direct?.violations || []).map((item) => item.kind === "ROSTER_SIZE" ? `Roster size: ${item.count}/${item.limit} (${item.excess} over)` : `${item.position}: ${item.count}/${item.limit} (${item.excess} over)`).join(" · ");
  const proposal = result.proposal;
  const summary = `<article class="panel trade-summary"><div class="panel-head"><div><p class="eyebrow">EVALUATED PARTIES · READ ONLY</p><h3>Trade Summary</h3></div><span class="trade-objective-label">Objective: ${escapeHtml((proposal.teamObjective || "BALANCED").replaceAll("_", " ").toLowerCase())}</span></div><div class="trade-summary-teams"><span><small>MY TEAM</small><strong>${escapeHtml(proposal.userTeam?.name || "Unavailable")}</strong></span><span><small>TRADE PARTNER</small><strong>${escapeHtml(proposal.partnerTeam?.name || "Not selected")}</strong></span></div><dl class="settings-list"><div><dt>Send</dt><dd>${escapeHtml(playerList(proposal.outgoing || []))}</dd></div><div><dt>Receive</dt><dd>${escapeHtml(playerList(proposal.incoming || []))}</dd></div>${proposal.plannedFollowUpDrops?.length ? `<div><dt>Explicit follow-up drops</dt><dd>${escapeHtml(playerList(proposal.plannedFollowUpDrops))}</dd></div>` : ""}</dl><p class="data-note">Snapshot: ${escapeHtml(`${result.snapshot?.provider || "ESPN"}${result.snapshot?.projectionsSource ? ` · ${result.snapshot.projectionsSource}` : ""}`)} · ${escapeHtml(freshnessText(result.snapshot))}</p></article>`;
  const decision = decisionSummary(result, escapeHtml, manualCapture);
  const mobileTechnical = `<div class="trade-mobile-technical"><p><strong>Snapshot:</strong> ${escapeHtml(`${result.snapshot?.provider || "ESPN"}${result.snapshot?.projectionsSource ? ` · ${result.snapshot.projectionsSource}` : ""}`)} · ${escapeHtml(freshnessText(result.snapshot))}</p><p><strong>Package value:</strong> ${escapeHtml(result.packageValue?.status === "READY" ? "Comparable approved additive asset-value evidence is complete." : packageValueReason(result))}</p>${result.packageValue?.status === "READY" ? `<p><strong>Package source:</strong> ${escapeHtml(result.packageValue.sourceId)} · ${escapeHtml(result.packageValue.sourceVersion)} · as of ${escapeHtml(result.packageValue.asOf)} · ${escapeHtml(result.packageValue.unit)}</p>` : ""}<p>${escapeHtml(result.evidenceState || "STRUCTURAL_ONLY")} · ${escapeHtml(result.currentWeek?.actionability || "Read-only hypothetical")}</p></div>`;
  const header = `<section class="trade-results" aria-labelledby="trade-results-title"><div class="section-divider"><span id="trade-results-title">ANALYSIS RESULTS</span></div><div class="trade-primary">${summary}${decision}</div>`;
  const roster = result.roster;
  const rosterBody = roster ? `<dl class="settings-list"><div><dt>Resolution</dt><dd>${escapeHtml(roster.resolved?.status || roster.direct?.status || "Unknown")}</dd></div><div><dt>Net roster count</dt><dd>${roster.netRosterCount >= 0 ? "+" : ""}${roster.netRosterCount}</dd></div><div><dt>Open active spots after resolution</dt><dd>${roster.openRosterSpots == null ? "Unknown" : roster.openRosterSpots}</dd></div><div><dt>Known follow-up removals required</dt><dd>${roster.requiredFollowUpRemovals}</dd></div><div><dt>Incoming auto-placed on IR</dt><dd>${roster.incomingPlacedOnIr ? "Yes" : "No — never automatic"}</dd></div>${violations ? `<div><dt>Known violations</dt><dd>${escapeHtml(violations)}</dd></div>` : ""}</dl>` : "";
  const evidence = `<details class="panel trade-evidence"><summary>Evidence &amp; Limitations</summary><div class="trade-evidence-body"><div><h4>Why this conclusion</h4>${reasons ? `<ol>${reasons}</ol>` : `<p>No supported reasons were recorded.</p>`}</div><div><h4>What this does not know</h4>${limitations ? `<ul>${limitations}</ul>` : `<p>No additional limitations were recorded for the selected evidence.</p>`}</div><p class="data-note">Package value and roster impact are separate. No displayed package split is a probability, and there is no acceptance probability or ESPN transaction action.</p>${mobileTechnical}</div></details>`;
  if (result.analysisState === "INVALID_PROPOSAL") return `${header}<article class="panel trade-blocker"><h3>Trade cannot be analyzed yet</h3>${renderTradeAdvantage(result.packageValue, escapeHtml)}<ul>${reasons}</ul></article>${evidence}</section>`;
  if (result.analysisState === "ROSTER_ACTION_REQUIRED") return `${header}<article class="panel trade-blocker"><h3>Another explicit roster action is required</h3>${renderTradeAdvantage(result.packageValue, escapeHtml)}${rosterBody}<ul>${reasons}</ul><p class="data-note">The analyzer does not silently choose a drop, add a free agent, or present the expanded roster as a legal final lineup.</p></article>${evidence}</section>`;

  const depthRows = (result.depth?.listedPositionChanges || []).map((item) => `<tr><td data-label="Position">${escapeHtml(item.position)}</td><td data-label="Before">${item.before}</td><td data-label="After">${item.after}</td><td data-label="Delta">${item.delta >= 0 ? "+" : ""}${item.delta}</td></tr>`).join("");
  const byeRows = (result.bye?.rows || []).map((row) => `<tr><td data-label="Week">Week ${row.week}</td><td data-label="Before gaps">${row.preUncovered}</td><td data-label="After gaps">${row.postUncovered}</td><td data-label="Gap delta">${row.gapDelta >= 0 ? "+" : ""}${row.gapDelta}</td></tr>`).join("");
  const replacement = result.replacement;
  const replacementNames = replacement?.status === "READY" ? replacement.candidates.slice(0, 5).map((item) => `${item.name} (${item.position}${item.projection == null ? "" : ` ${item.projection.toFixed(1)}`})`).join(", ") : replacement?.reason || "Unavailable";
  const week = result.currentWeek;
  const current = `<p class="data-note">Source agreement: ${escapeHtml(result.sourceAgreement?.currentWeek || "UNKNOWN")}</p><div class="table-wrap"><table><thead><tr><th>Source</th><th>Coverage</th><th>Before</th><th>After</th><th>Delta</th><th>Direction</th></tr></thead><tbody>${sourceRows(result, escapeHtml)}</tbody></table></div>${week?.locks?.length ? `<p class="data-note"><strong>Locked/current-game limitation:</strong> ${escapeHtml(week.locks.map((item) => `${item.playerName}: ${item.reason}`).join(" "))} This is informational only and does not claim whether ESPN would process the trade.</p>` : ""}${lineupChanges(result, playerMap, escapeHtml)}`;
  const depth = `<p>${escapeHtml(result.depth?.fragility?.reason || "Unavailable")}</p>${depthRows ? `<div class="table-wrap"><table><thead><tr><th>Position</th><th>Before</th><th>After</th><th>Delta</th></tr></thead><tbody>${depthRows}</tbody></table></div>` : ""}<p class="data-note">Listed-position depth and legal contingency coverage are separate. Post-trade maximum uncovered starter slots after losing one optimized starter: ${result.depth?.contingency?.post?.maxUncoveredAfterLoss ?? "Unknown"}.</p>`;
  const replacementBody = `<p>${escapeHtml(replacementNames)}</p><p class="data-note">${escapeHtml(replacement ? freshnessText(replacement) : "Source freshness unknown")}. Latest ESPN availability only. Any add is a separate conditional follow-up action and is never included automatically in this trade.</p>`;
  const bye = byeRows ? `<div class="table-wrap"><table><thead><tr><th>Week</th><th>Before gaps</th><th>After gaps</th><th>Gap delta</th></tr></thead><tbody>${byeRows}</tbody></table></div>` : `<p class="data-note">No supported bye-gap change is available.</p>`;
  const horizons = [["Future window", result.future], ["Rest of season", result.restOfSeason], ["Playoff window", result.playoffs]];
  const unavailable = horizons.filter(([, horizon]) => !horizon || (horizon.status !== "READY" && !(horizon.rows || []).length));
  const available = horizons.filter(([, horizon]) => horizon && !unavailable.some(([, missing]) => missing === horizon));
  const horizonDetails = available.map(([title, horizon]) => impactDetail(title, `${horizon.direction} · ${horizon.status}`, horizonCard(title, horizon, escapeHtml), escapeHtml)).join("");
  const unavailableDetail = unavailable.map(([title, horizon]) => impactDetail(title, horizon?.status || "UNAVAILABLE", `<p>Complete comparable evidence is unavailable.</p><div class="trade-missing-horizon"><strong>${escapeHtml(title)} · ${escapeHtml(horizon?.status || "UNAVAILABLE")}</strong><p>${escapeHtml(horizon?.reason || "No complete horizon evidence is available.")}</p><small>${escapeHtml(horizon?.label || "Window unavailable")} · ${escapeHtml(horizon?.source || "Projection source unavailable")} · ${escapeHtml(freshnessText(horizon))}</small></div>`, escapeHtml)).join("");
  return `${header}<article class="panel trade-impact"><div class="panel-head"><div><p class="eyebrow">SUPPORTING EVIDENCE</p><h3>Impact Details</h3></div></div>${roster ? impactDetail("Roster consequences", roster.resolved?.status || roster.direct?.status || "Unknown", rosterBody, escapeHtml) : ""}${impactDetail("Current week", `${week?.direction || "UNKNOWN"} · ${result.sourceAgreement?.currentWeek || "UNKNOWN"}`, current, escapeHtml)}${impactDetail("Depth & Contingency", result.depth?.fragility?.state || "UNKNOWN", depth, escapeHtml)}${impactDetail("Replacement Context", replacement?.status || "UNKNOWN", replacementBody, escapeHtml)}${impactDetail("Bye Effects", result.bye?.status || "UNKNOWN", bye, escapeHtml)}${horizonDetails}${unavailableDetail}</article>${evidence}</section>`;
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
  let manualCapture = null;
  let draftProfile = null;

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
      manualCapture = readLocalCapture(state.snapshot.league?.id, state.snapshot.league?.season, state.selectedTeamId);
      draftProfile = manualCapture?.profile || defaultManualProfile(state.snapshot);
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
    const manualValues = [
      ...proposal.outgoingPlayerIds.map((id) => [id, "You send"]),
      ...proposal.incomingPlayerIds.map((id) => [id, "You receive"])
    ].map(([id, side]) => `<label class="trade-value-player"><span>${escapeHtml(side)} · ${escapeHtml(playerName(playerMap, id))} <small>ESPN ID ${escapeHtml(id)}</small></span><input type="number" min="0" step="any" inputmode="decimal" data-manual-player-id="${escapeHtml(id)}" aria-label="FantasyCalc value for ${escapeHtml(playerName(playerMap, id))}" value="${escapeHtml(manualCapture?.values?.[id]?.value ?? "")}" ${manualCapture ? "" : "disabled"}></label>`).join("");
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
      <section class="trade-value-entry" aria-labelledby="trade-value-entry-title"><div class="trade-value-entry-head"><div><p class="eyebrow">LOCAL PACKAGE ASSET VALUES</p><h4 id="trade-value-entry-title">FantasyCalc · Redraft</h4></div><span class="quality ${manualCapture ? "fresh" : "unknown"}">${manualCapture ? "Captured locally" : "No capture"}</span></div><p class="data-note">Copy values for the selected ESPN players from the same FantasyCalc Redraft view. A new capture clears prior values. Values stay in this browser and are never sent to ESPN.</p><div class="trade-value-profile"><label>Teams<input data-manual-profile="teamCount" type="number" min="2" max="32" step="1" value="${escapeHtml(draftProfile.teamCount)}"></label><label>Reception scoring<select data-manual-profile="ppr">${profileOptions(draftProfile.ppr, [["", "Select"], ["STANDARD", "Standard"], ["HALF_PPR", "Half-PPR"], ["PPR", "PPR"]], escapeHtml)}</select></label><label>QB format<select data-manual-profile="qbFormat">${profileOptions(draftProfile.qbFormat, [["", "Select"], ["1QB", "1QB"], ["SUPERFLEX", "Superflex"]], escapeHtml)}</select></label><label>TE premium<select data-manual-profile="tePremium">${profileOptions(draftProfile.tePremium, [["", "Select"], ["false", "Off"], ["true", "On"]], escapeHtml)}</select></label></div><div class="trade-value-capture"><button class="button secondary" type="button" id="trade-new-value-capture">Start new capture</button><span>${manualCapture ? `Captured ${escapeHtml(manualCapture.asOf)} · one session` : "Start a capture before entering values."}</span></div><div class="trade-value-players">${manualValues || '<p class="data-note">Select send and receive players to enter their values.</p>'}</div><p class="data-note">ESPN PPR: ${escapeHtml(state.snapshot.league?.receptionScoring?.family || "unavailable")} · QB slots: ${escapeHtml(JSON.stringify(state.snapshot.league?.lineupSlots?.filter((item) => ["QB", "OP"].includes(item.slot)) || []))} · ESPN TE premium: ${typeof state.snapshot.league?.tePremium === "boolean" ? state.snapshot.league.tePremium ? "On" : "Off" : "unverified; value withheld"}. The source profile must match every setting.</p></section>
      ${showDrops ? `<div class="section-divider"><span>FOLLOW-UP ROSTER ACTION</span></div><p class="data-note">Choose an explicit follow-up drop only when the known roster rules require another removal. The analyzer never chooses one silently.</p><div class="connection-form"><label>Planned follow-up drop<select id="trade-drop-select" aria-label="Follow-up drop">${optionRows(dropChoices, dropChoices[0]?.id, escapeHtml)}</select></label><button class="button secondary" id="trade-add-drop" type="button" ${dropChoices.length ? "" : "disabled"}>Add follow-up drop</button></div><div class="sync-actions">${proposal.plannedFollowUpDropIds.map((id) => selectedChip(id, "plannedFollowUpDropIds", "follow-up drops")).join("")}</div>` : ""}
      <div class="sync-actions"><button class="button primary" id="trade-analyze" type="button">Analyze proposed trade</button><button class="button secondary" id="trade-reset" type="button">Reset proposal</button></div><p class="data-note">Future window: ${futureWeeks.length ? `Weeks ${futureWeeks.join(", ")}` : "no complete imported selection configured"}. Playoff window: ${playoffWeeks.length ? `Weeks ${playoffWeeks.join(", ")}` : "not configured"}.</p></article>
      ${viewError ? `<article class="panel" role="alert"><h3>Trade analysis unavailable</h3><p>${escapeHtml(viewError)}</p></article>` : ""}
      ${result ? renderTradeAnalysisResult(result, state.snapshot, escapeHtml, manualCapture) : `<div class="section-divider"><span>ANALYSIS RESULTS</span></div><article class="panel"><h3>Run the proposal when ready</h3><p>${partnerTeam ? "Select players and analyze the proposal." : "Select one opposing team before choosing incoming players."} Results use your roster consequences and supported source evidence.</p></article>`}`;

    const currentWeekDetail = content.querySelector("[data-trade-current-week]");
    if (currentWeekDetail && typeof window !== "undefined") {
      currentWeekDetail.open = window.matchMedia("(min-width: 601px)").matches;
    }

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
    content.querySelectorAll("[data-manual-profile]").forEach((control) => control.addEventListener("change", () => {
      const selected = Object.fromEntries([...content.querySelectorAll("[data-manual-profile]")].map((item) => [item.dataset.manualProfile, item.value]));
      draftProfile = {
        teamCount: selected.teamCount === "" ? "" : Number(selected.teamCount),
        ppr: selected.ppr, qbFormat: selected.qbFormat,
        tePremium: selected.tePremium === "" ? "" : selected.tePremium === "true"
      };
      manualCapture = null;
      saveLocalCapture(state.snapshot.league?.id, state.snapshot.league?.season, state.selectedTeamId, null);
      result = null;
      render();
    }));
    content.querySelector("#trade-new-value-capture")?.addEventListener("click", () => {
      manualCapture = { sessionId: crypto.randomUUID(), asOf: new Date().toISOString(), profile: { ...draftProfile }, values: Object.create(null) };
      saveLocalCapture(state.snapshot.league?.id, state.snapshot.league?.season, state.selectedTeamId, manualCapture);
      result = null;
      render();
    });
    content.querySelectorAll("[data-manual-player-id]").forEach((control) => control.addEventListener("change", (event) => {
      if (!manualCapture) return;
      const id = event.target.dataset.manualPlayerId;
      if (![...proposal.outgoingPlayerIds, ...proposal.incomingPlayerIds].includes(id)) return;
      const raw = event.target.value.trim();
      if (raw === "") delete manualCapture.values[id];
      else manualCapture.values[id] = { value: Number(raw), sessionId: manualCapture.sessionId, asOf: manualCapture.asOf,
        profileKey: JSON.stringify([manualCapture.profile.teamCount, manualCapture.profile.ppr, manualCapture.profile.qbFormat, manualCapture.profile.tePremium]) };
      saveLocalCapture(state.snapshot.league?.id, state.snapshot.league?.season, state.selectedTeamId, manualCapture);
      result = null;
      render();
    }));
    content.querySelector("#trade-reset")?.addEventListener("click", () => { proposal = emptyProposal(); result = null; viewError = null; render(); });
    content.querySelector("#trade-analyze")?.addEventListener("click", () => {
      try {
        // Re-read the latest context before invoking the engine; a refreshed snapshot cannot inherit an earlier result.
        const latest = contextInputs();
        if (latest.context.state.snapshot !== state.snapshot || latest.context.state.selectedTeamId !== state.selectedTeamId) {
          render();
          return;
        }
        const tradeValueSources = manualCapture ? [createFantasyCalcManualSource(state.snapshot, manualCapture)] : [];
        result = analyzeTrade(state.snapshot, state.selectedTeamId, proposal, { futureProjectionSet, identityMap: projectionIdentityMap, futureWeeks, playoffWeeks, tradeValueSources });
        viewError = null;
      } catch {
        result = null;
        viewError = "Trade analysis could not complete with the current snapshot. No ESPN action was attempted; refresh the league data or revise the proposal.";
      }
      render();
      content.querySelector("#trade-results-title")?.scrollIntoView?.({ block: "start" });
    });
  }

  if (typeof window !== "undefined") {
    window.matchMedia("(min-width: 601px)").addEventListener("change", (event) => {
      const currentWeekDetail = content.querySelector("[data-trade-current-week]");
      if (currentWeekDetail) currentWeekDetail.open = event.matches;
    });
  }
  return Object.freeze({ render, getProposal: () => structuredClone(proposal), getResult: () => result });
}
