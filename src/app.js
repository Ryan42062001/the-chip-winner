import { EspnSnapshotProvider } from "./providers/espn/espn-provider.js";
import { isStarter } from "./domain/model.js";
import { buildLineupSuggestions, buildWarnings, compareRosterPlayers } from "./domain/recommendations.js?v=0.5.0";
import { selectDataCoverage, selectPlayerDetail, selectProjectedTotal, selectSnapshotFreshness, selectTeamContext } from "./domain/selectors.js?v=0.5.1";
import { appReducer, createStore, initialAppState } from "./application/store.js";
import { EspnCompanionClient } from "./providers/espn/companion-client.js";
import { normalizeEspnLeagueResponse } from "./providers/espn/espn-normalizer.js?v=0.5.2";
import { FantasyProsRankingProvider, reconcileFantasyProsRankings } from "./providers/rankings/ranking-provider.js";
import { buildRosWaiverIdeas, selectRosterRosCoverage } from "./domain/ros-analysis.js";
import { optimizeLineup } from "./domain/lineup-optimizer.js";
import { changesForTeam, diffSnapshots } from "./domain/snapshot-diff.js";
import { buildRosterAwareWaiverIdeas } from "./domain/waiver-engine.js";
import { buildRosterPlan } from "./domain/roster-planning.js";
import { buildScenarioPlan } from "./domain/scenario-planner.js";
import { FutureProjectionProvider } from "./providers/projections/future-projection-provider.js";
import { ProjectionIdentityMapProvider } from "./providers/projections/projection-identity-map.js";
import { buildModelContext } from "./domain/model-context.js";
import { createMobileSyncFragment, createSyncCredentials, parseMobileSyncFragment } from "./sync/crypto.js";
import { HttpSyncProvider } from "./sync/sync-provider.js?v=0.6.1";
import { publishSyncState, readSyncState } from "./sync/sync-session.js";

const provider = new EspnSnapshotProvider();
const companion = new EspnCompanionClient();
const rankingProvider = new FantasyProsRankingProvider();
const futureProjectionProvider = new FutureProjectionProvider();
let futureProjectionSet = futureProjectionProvider.readCache();
const projectionIdentityMapProvider = new ProjectionIdentityMapProvider();
let projectionIdentityMap = projectionIdentityMapProvider.readCache();
const syncProvider = new HttpSyncProvider({ baseUrl: "https://the-chip-winner-sync.yc6syr6bkd.workers.dev" });
const SYNC_CREDENTIALS_KEY = "the-chip-winner:sync-credentials:v1";
const ESPN_CONNECTION = Object.freeze({ leagueId: "118749183", seasonId: "2026", teamId: "2" });
const content = document.querySelector("#app-content");
const noticeRegion = document.querySelector("#notice-region");
const teamSelect = document.querySelector("#team-select");
const appSection = () => location.hash.startsWith("#mobile-sync=") ? "overview" : location.hash.slice(1) || "overview";
const store = createStore({ ...initialAppState, section: appSection() }, appReducer);
let state = store.getState();
store.subscribe((next) => { state = next; });

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const projection = (value) => value == null ? '<span class="missing">Not available</span>' : `${value.toFixed(1)} pts`;
const initials = (name) => name.split(" ").map((part) => part[0]).slice(0, 2).join("");
const gameTime = (value) => {
  if (!value) return "Time unavailable";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(parsed) : value;
};

function playerRow(entry, player) {
  const status = player.injury?.status && player.injury.status !== "ACTIVE" ? player.injury.status : null;
  const ros = state.rankingReconciliation?.byPlayerId?.[player.id];
  return `<div class="player-row interactive-row" data-player-id="${escapeHtml(player.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(player.name)} details">
    <span class="slot">${escapeHtml(entry.lineupSlot)}</span>
    <span class="avatar pos-${escapeHtml(player.position).replace("/", "")}">${initials(player.name)}</span>
    <span class="player-main"><strong>${escapeHtml(player.name)}${ros ? ` <span class="ros-rank">ROS #${ros.rank}</span>` : ""}</strong><small>${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "Team unavailable")} vs ${escapeHtml(player.opponent || "Opponent unavailable")}</small></span>
    ${status ? `<span class="tag danger">${escapeHtml(status)}</span>` : `<span class="game-time">${escapeHtml(gameTime(player.gameTime))}</span>`}
    <span class="player-proj"><strong>${player.projection == null ? "—" : player.projection.toFixed(1)}</strong><small>projected</small></span>
  </div>`;
}

function getViewModel() {
  return selectTeamContext(state.snapshot, state.selectedTeamId);
}

function renderOverview() {
  const { snapshot, selectedTeamId } = state;
  const { index, team, starters, bench, opponent } = getViewModel();
  if (!team) return emptyState("Team unavailable", "This snapshot does not contain the selected team.");
  const starterProjection = selectProjectedTotal(starters, index.players);
  const starterTotal = starterProjection.total;
  const opponentRoster = opponent ? index.rosters.get(opponent.id)?.entries || [] : [];
  const opponentProjection = selectProjectedTotal(opponentRoster.filter((e) => isStarter(e.lineupSlot)), index.players);
  const opponentTotal = opponentProjection.total;
  const matchupProjectionComplete = starterProjection.complete && opponentProjection.complete && starterProjection.totalCount === opponentProjection.totalCount;
  const suggestions = buildLineupSuggestions(snapshot, selectedTeamId);
  const warnings = buildWarnings(snapshot, selectedTeamId);
  const coverage = selectDataCoverage(snapshot, selectedTeamId);
  const freshness = selectSnapshotFreshness(snapshot);
  const rankingMatches = state.rankingReconciliation ? Object.keys(state.rankingReconciliation.byPlayerId).length : 0;
  const rosterRosCoverage = selectRosterRosCoverage(snapshot, selectedTeamId, state.rankingReconciliation);

  content.innerHTML = `<div class="page-head"><div><p class="eyebrow">WEEK ${snapshot.currentWeek}</p><h2>Good week to make a move.</h2><p>Your roster, matchup, and highest-confidence flags in one place.</p></div><span class="week-pill">Regular season · Week ${snapshot.currentWeek}</span></div>
    <div class="stat-grid">
      <article class="stat-card"><span>Projected points</span><strong>${starterProjection.knownCount ? starterTotal.toFixed(1) : "—"}</strong><small>${starterProjection.complete ? "Current starting lineup" : `${starterProjection.knownCount}/${starterProjection.totalCount} projections available`}</small></article>
      <article class="stat-card"><span>Matchup</span><strong>${opponent ? `vs ${escapeHtml(opponent.abbreviation)}` : "Unavailable"}</strong><small>${opponent ? `${escapeHtml(opponent.name)} · ${opponent.record.wins}-${opponent.record.losses}` : "No current-week matchup found"}</small></article>
      <article class="stat-card"><span>Lineup edge</span><strong class="${starterTotal >= opponentTotal ? "positive" : "negative"}">${matchupProjectionComplete ? `${starterTotal >= opponentTotal ? "+" : ""}${(starterTotal - opponentTotal).toFixed(1)}` : "—"}</strong><small>${matchupProjectionComplete ? "Complete starting projections" : "Incomplete matchup data"}</small></article>
      <article class="stat-card"><span>Needs attention</span><strong>${warnings.length}</strong><small>${warnings.filter((w) => w.kind === "injury").length} injury · ${warnings.filter((w) => w.kind === "bye").length} bye</small></article>
    </div>
    <div class="dashboard-grid">
      <article class="panel roster-panel"><div class="panel-head"><div><p class="eyebrow">MY TEAM</p><h3>${escapeHtml(team.name)}</h3></div><span class="record">${team.record.wins}-${team.record.losses}${team.record.ties ? `-${team.record.ties}` : ""}</span></div>
        <div class="list-heading"><span>STARTERS</span><span>WEEK ${snapshot.currentWeek}</span></div>${starters.length ? starters.map((e) => playerRow(e, index.players.get(e.playerId))).join("") : emptyInline("No starters in snapshot")}
        <div class="list-heading bench-heading"><span>BENCH</span><span>${bench.length} PLAYERS</span></div>${bench.length ? bench.map((e) => playerRow(e, index.players.get(e.playerId))).join("") : emptyInline("No bench players in snapshot")}
      </article>
      <div class="side-stack">
        <article class="panel matchup-card"><div class="panel-head"><div><p class="eyebrow">MATCHUP</p><h3>Week ${snapshot.currentWeek}</h3></div><span class="live-dot">UPCOMING</span></div>
          ${opponent ? `<div class="matchup-team"><span class="team-badge">${escapeHtml(team.abbreviation)}</span><div><strong>${escapeHtml(team.name)}</strong><small>${team.record.wins}-${team.record.losses}</small></div><b>${starterTotal ? starterTotal.toFixed(1) : "—"}</b></div><div class="versus"><span></span>VS<span></span></div><div class="matchup-team"><span class="team-badge opponent">${escapeHtml(opponent.abbreviation)}</span><div><strong>${escapeHtml(opponent.name)}</strong><small>${opponent.record.wins}-${opponent.record.losses}</small></div><b>${opponentTotal ? opponentTotal.toFixed(1) : "—"}</b></div>` : emptyInline("Current-week opponent unavailable")}
        </article>
        <article class="panel"><div class="panel-head"><div><p class="eyebrow">QUICK READ</p><h3>Lineup signals</h3></div><a href="#lineup">Open lab →</a></div>
          ${suggestions.length ? suggestions.slice(0, 2).map(s => `<div class="signal"><span class="signal-icon">↗</span><div><strong>Start ${escapeHtml(s.start.name)}</strong><small>Over ${escapeHtml(s.sit.name)} · +${s.gain} projected</small></div></div>`).join("") : emptyInline("No projection-based swaps found")}
          ${warnings.slice(0, 2).map(w => `<div class="signal warning"><span class="signal-icon">!</span><div><strong>${escapeHtml(w.player.name)} · ${escapeHtml(w.kind)}</strong><small>${escapeHtml(w.detail || `Week ${snapshot.currentWeek} attention needed`)}</small></div></div>`).join("")}
        </article>
        <article class="panel"><div class="panel-head"><div><p class="eyebrow">DATA QUALITY</p><h3>Snapshot coverage</h3></div><span class="quality ${freshness.status}">${freshness.status}</span></div>
          ${qualityBar("Roster projections", coverage.projections)}${qualityBar("Injury statuses", coverage.injuries)}${qualityBar("NFL opponents", coverage.opponents)}
          ${state.rankingSet ? `<div class="ranking-health"><strong>FantasyPros ROS · ${escapeHtml(state.rankingSet.scoringFormat)}</strong><span>${rosterRosCoverage.matched}/${rosterRosCoverage.total} roster players matched · ${rankingMatches} league-pool matches · ${state.rankingReconciliation.conflicts.length} conflicts</span></div>` : ""}
          <p class="data-note">Waiver availability: <strong>${coverage.availability ? "included" : "not provided"}</strong>. Recommendations only use reported fields.</p>
        </article>
      </div>
    </div>`;
}

function renderLineup() {
  const suggestions = buildLineupSuggestions(state.snapshot, state.selectedTeamId);
  const optimized = optimizeLineup(state.snapshot, state.selectedTeamId);
  const { index, roster } = getViewModel();
  const rosterPlayers = roster.map((entry) => index.players.get(entry.playerId)).filter(Boolean);
  content.innerHTML = sectionHeader("Lineup Lab", "Projection-based comparisons from the data in your snapshot. No confidence is implied when inputs are missing.") +
    `<article class="panel optimizer-summary"><div><p class="eyebrow">COMPLETE LINEUP SEARCH</p><h3>${optimized.status === "optimal" ? "Optimal known lineup" : optimized.status === "best-known" ? "Best known lineup" : "Optimization unavailable"}</h3><p>${escapeHtml(optimized.reason)}</p>${optimized.locks?.length ? `<p class="optimizer-locks">${optimized.locks.length} roster lock${optimized.locks.length === 1 ? "" : "s"} respected because ESPN reported a lock or kickoff passed.</p>` : ""}</div>${optimized.projectedTotal == null ? "" : `<div class="optimizer-score"><strong>${optimized.projectedTotal.toFixed(1)}</strong><span>${optimized.gain > 0 ? `+${optimized.gain.toFixed(1)} vs current` : "No projected gain"}</span></div>`}</article>
    ${optimized.recommendedChanges?.length ? `<div class="optimizer-grid">${optimized.recommendedChanges.map(item => `<article class="panel optimizer-change"><span>${escapeHtml(item.slot)}</span><strong>${escapeHtml(item.player.name)}</strong><small>Replaces ${escapeHtml(index.players.get(item.previousPlayerId)?.name || "current player")} · ${item.player.projection.toFixed(1)} projected</small></article>`).join("")}</div>` : ""}
    <article class="panel comparison-tool"><div class="panel-head"><div><p class="eyebrow">START / SIT</p><h3>Compare roster players</h3></div><span class="source-chip">${escapeHtml(state.snapshot.meta?.projectionsSource || "Source unavailable")}</span></div><div class="comparison-controls"><label>Player one<select id="compare-first">${comparisonOptions(rosterPlayers, rosterPlayers[0]?.id)}</select></label><span>VS</span><label>Player two<select id="compare-second">${comparisonOptions(rosterPlayers, rosterPlayers[1]?.id)}</select></label></div><div id="comparison-result"></div></article>
    <div class="section-divider"><span>OPTIMIZATION SIGNALS</span></div><div class="recommendation-grid">${suggestions.length ? suggestions.map(s => `<article class="panel recommendation"><span class="recommendation-kicker">${escapeHtml(s.slot)} SWAP</span><div class="compare"><div><small>START</small><strong>${escapeHtml(s.start.name)}</strong><span>${projection(s.start.projection)}</span></div><span class="swap-arrow">→</span><div><small>SIT</small><strong>${escapeHtml(s.sit.name)}</strong><span>${projection(s.sit.projection)}</span></div></div><div class="gain">+${s.gain} projected points</div><p>${escapeHtml(s.reason)}. Verify late news before making a move.</p></article>`).join("") : emptyState("No lineup changes identified", "Available projections do not show a higher-scoring eligible bench option. This is not a guarantee that your lineup is optimal.")}</div>`;
  const updateComparison = () => {
    const result = compareRosterPlayers(state.snapshot, state.selectedTeamId, document.querySelector("#compare-first").value, document.querySelector("#compare-second").value);
    document.querySelector("#comparison-result").innerHTML = comparisonResult(result);
  };
  document.querySelector("#compare-first").addEventListener("change", updateComparison);
  document.querySelector("#compare-second").addEventListener("change", updateComparison);
  updateComparison();
}

function renderWaivers() {
  const result = buildRosterAwareWaiverIdeas(state.snapshot, state.selectedTeamId);
  const body = result.status === "missing-availability" ? emptyState("Availability data missing", "This ESPN snapshot does not include free-agent availability. Refresh ESPN before evaluating waiver moves.") : result.status === "incomplete-lineup" ? emptyState("Lineup impact unavailable", result.limitations[0]) : result.items.length ? result.items.map(item => `<article class="panel waiver-row interactive-row" data-player-id="${escapeHtml(item.add.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.add.name)} details"><span class="avatar pos-${item.add.position.replace("/", "")}">${initials(item.add.name)}</span><div><small>CURRENT-WEEK ADD · ${escapeHtml(formatAvailability(item.add.availabilityStatus))}</small><strong>${escapeHtml(item.add.name)}</strong><span>${escapeHtml(item.add.position)} · ${projection(item.add.projection)}</span></div><span class="swap-arrow">for</span><div><small>UNLOCKED BENCH DROP</small><strong>${escapeHtml(item.drop.name)}</strong><span>${escapeHtml(item.drop.position)} · ${escapeHtml(item.reason)}</span></div><b class="positive">+${item.lineupGain}</b></article>`).join("") : emptyState("No clear lineup upgrades", "No ESPN-available player improves the strongest known legal lineup by at least 0.5 points after an unlocked bench drop.");
  const ros = buildRosWaiverIdeas(state.snapshot, state.selectedTeamId, state.rankingReconciliation);
  const rosBody = ros.status === "missing-rankings" ? emptyState("Import ROS rankings", "Add the FantasyPros ROS PPR CSV to compare season-long ranks without replacing ESPN weekly projections.") : ros.status === "missing-availability" ? emptyState("Availability data missing", "ESPN availability is required before an ROS add/drop comparison can be made.") : ros.items.length ? ros.items.map(item => `<article class="panel waiver-row interactive-row" data-player-id="${escapeHtml(item.add.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.add.name)} details"><span class="avatar pos-${item.add.position.replace("/", "")}">${initials(item.add.name)}</span><div><small>ROS ADD · ${escapeHtml(formatAvailability(item.add.availabilityStatus))}</small><strong>${escapeHtml(item.add.name)}</strong><span>${escapeHtml(item.add.position)} · FantasyPros #${item.addRanking.rank}</span></div><span class="swap-arrow">for</span><div><small>ROS DROP COMPARISON</small><strong>${escapeHtml(item.drop.name)}</strong><span>${escapeHtml(item.drop.position)} · FantasyPros #${item.dropRanking.rank}</span></div><b class="positive">↑${item.rankImprovement}</b></article>`).join("") : emptyState("No ROS rank upgrades found", "No available same-position player ranks ahead of a reconciled roster player in the imported FantasyPros file.");
  const limitations = result.limitations?.length ? `<article class="panel waiver-limitations"><strong>Before acting</strong>${result.limitations.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</article>` : "";
  content.innerHTML = sectionHeader("Waiver Wire", "Weekly lineup impact and rest-of-season rankings stay separate so each comparison says exactly what it measures.") + `<div class="section-divider"><span>THIS WEEK · FULL-LINEUP IMPACT</span></div><div class="waiver-list">${body}</div>${limitations}<div class="section-divider ros-divider"><span>REST OF SEASON · FANTASYPROS PPR</span></div><div class="waiver-list">${rosBody}</div>`;
}

function renderAlerts() {
  const warnings = buildWarnings(state.snapshot, state.selectedTeamId);
  content.innerHTML = sectionHeader("Player Alerts", "Injury and bye-week flags reported by the current source data.") + `<div class="alert-list">${warnings.length ? warnings.map(w => `<article class="panel alert-row interactive-row" data-player-id="${escapeHtml(w.player.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(w.player.name)} details"><span class="alert-symbol ${w.kind}">${w.kind === "injury" ? "!" : "B"}</span><div><small>${escapeHtml(w.kind.toUpperCase())} · ${escapeHtml(w.lineupSlot)}</small><strong>${escapeHtml(w.player.name)}</strong><p>${escapeHtml(w.detail || (w.kind === "bye" ? `Bye in Week ${state.snapshot.currentWeek}` : `Status: ${w.player.injury.status}`))}</p></div></article>`).join("") : emptyState("No alerts in this snapshot", "No injuries or current-week byes were reported for this roster.")}</div>`;
}

function renderChanges() {
  if (!state.previousSnapshot) {
    content.innerHTML = sectionHeader("What Changed", "A timeline appears after two valid ESPN captures from the same league.") + emptyState("One more refresh needed", "Refresh ESPN again after league data changes. The previous valid snapshot is kept separately and compared locally.");
    return;
  }
  const allChanges = diffSnapshots(state.previousSnapshot, state.snapshot);
  const changes = changesForTeam(allChanges, state.snapshot, state.selectedTeamId);
  const captured = state.snapshot.meta?.capturedAt ? new Date(state.snapshot.meta.capturedAt).toLocaleString() : "Capture time unavailable";
  content.innerHTML = sectionHeader("What Changed", "Derived locally by comparing the two most recent valid ESPN snapshots.") + `<article class="panel timeline-summary"><div><p class="eyebrow">LATEST REFRESH</p><h3>${changes.length} relevant change${changes.length === 1 ? "" : "s"}</h3><p>Observed ${escapeHtml(captured)} · ${allChanges.length} across the league</p></div><span class="quality ${changes.length ? "aging" : "fresh"}">${changes.length ? "Review" : "No changes"}</span></article><div class="timeline">${changes.length ? changes.map((change) => `<article class="panel timeline-item ${escapeHtml(change.kind)}" ${change.playerId ? `data-player-id="${escapeHtml(change.playerId)}" role="button" tabindex="0"` : ""}><span class="timeline-icon">${change.kind === "injury" ? "!" : change.kind === "lineup" ? "↕" : change.kind === "projection" ? "±" : change.kind === "matchup" ? "#" : "+"}</span><div><small>${escapeHtml(change.kind.replaceAll("-", " ").toUpperCase())}</small><strong>${escapeHtml(change.title)}</strong><p>${escapeHtml(change.detail)}</p></div></article>`).join("") : emptyState("Nothing meaningful changed", "The latest snapshot matches the previous one for this team. Identical refreshes do not create duplicate events.")}</div>`;
}

function renderSeasonPlan() {
  const plan = buildRosterPlan(state.snapshot, state.selectedTeamId, state.rankingReconciliation);
  if (plan.status === "missing-roster") {
    content.innerHTML = sectionHeader("Season Plan", "Roster depth, bye-week conflicts, and explicit playoff context from your current data.") + emptyState("Roster unavailable", "Refresh ESPN to build a season plan for this team.");
    return;
  }
  const depth = plan.positions.length ? plan.positions.map(group => `<article class="panel plan-group"><div class="panel-head"><div><p class="eyebrow">${escapeHtml(group.position)}</p><h3>${group.starterCount} starter${group.starterCount === 1 ? "" : "s"} · ${group.benchCount} bench</h3></div><span class="record">${group.knownProjectionCount}/${group.totalCount} projected</span></div><div class="plan-players">${group.players.map(item => `<div class="plan-player"><span class="avatar pos-${escapeHtml(item.player.position).replace("/", "")}">${initials(item.player.name)}</span><div><strong>${escapeHtml(item.player.name)}</strong><small>${item.starter ? "Starter" : "Bench"} · ${escapeHtml(item.player.proTeam || "Team unavailable")}</small></div><b>${item.player.projection == null ? "—" : item.player.projection.toFixed(1)}</b></div>`).join("")}</div></article>`).join("") : emptyState("No positional depth available", "The ESPN snapshot does not contain roster players with positions.");
  const bye = plan.byeConflicts.length ? plan.byeConflicts.map(item => `<div class="plan-alert"><strong>Week ${item.week}</strong><span>${escapeHtml(item.players.map((player) => player.name).join(", "))}</span></div>`).join("") : `<p class="plan-note">No starter bye conflicts were found in the current snapshot.</p>`;
  const playoff = plan.playoff.length ? plan.playoff.map(item => `<div class="plan-row"><strong>${escapeHtml(item.player.name)}</strong><span>${escapeHtml(item.player.position)} · schedule strength ${item.strength}</span></div>`).join("") : `<p class="plan-note">No explicit playoff schedule-strength fields are available in the imported rankings.</p>`;
  const futureWeeks = futureProjectionSet ? [...new Set(futureProjectionSet.projections.map((item) => item.week))].sort((a, b) => a - b) : [];
  const currentMoves = buildRosterAwareWaiverIdeas(state.snapshot, state.selectedTeamId);
  const futureMoveInputs = (currentMoves.items || []).slice(0, 3).map((item, index) => ({ id: `candidate-${index + 1}`, addPlayerId: item.add.id, dropPlayerId: item.drop.id }));
  const scenarios = buildScenarioPlan(state.snapshot, state.selectedTeamId, { weeks: futureWeeks, projectionSet: futureProjectionSet, identityMap: projectionIdentityMap, scenarios: futureMoveInputs });
  const horizon = scenarios.status === "ready" ? `${scenarios.weeklyBaseline.length} future week${scenarios.weeklyBaseline.length === 1 ? "" : "s"} calculated` : "Future-week projections unavailable";
  const moveBody = scenarios.currentWeekScenarios?.length ? scenarios.currentWeekScenarios.slice(0, 3).map(({ payload: item }) => `<div class="plan-row"><strong>${escapeHtml(item.add.name)} for ${escapeHtml(item.drop.name)}</strong><span>+${item.lineupGain} current-week lineup points · validated legal simulation</span></div>`).join("") : `<p class="plan-note">No validated current-week add/drop scenario clears the action threshold, or ESPN availability is missing.</p>`;
  const weeklyBody = scenarios.weeklyBaseline?.length ? scenarios.weeklyBaseline.map(item => `<div class="plan-row"><strong>Week ${item.week}</strong><span>${item.projectedTotal == null ? "No complete lineup" : `${item.projectedTotal.toFixed(1)} optimized known points`} · ${item.mappedProjectionCount}/${item.rosterPlayerCount} roster projections · ${item.completeCoverage ? "complete" : "partial"}</span></div>`).join("") : `<p class="plan-note">Future scenario comparisons need both weekly projections and the explicit ID mapping CSV.</p>`;
  const playerIndex = new Map(state.snapshot.players.map((player) => [player.id, player]));
  const futureMoves = scenarios.scenarios?.length ? scenarios.scenarios.map(item => `<div class="plan-scenario"><strong>Add ${escapeHtml(playerIndex.get(item.addPlayerId)?.name || item.addPlayerId)} · drop ${escapeHtml(playerIndex.get(item.dropPlayerId)?.name || item.dropPlayerId)}</strong>${item.weekly.map(week => `<span>Week ${week.week}: ${week.delta == null ? "incomplete" : `${week.delta >= 0 ? "+" : ""}${week.delta} points`}</span>`).join("")}</div>`).join("") : `<p class="plan-note">Mapped future projections will evaluate the top legal waiver candidates automatically.</p>`;
  content.innerHTML = sectionHeader("Season Plan", "A transparent planning layer built from ESPN roster state and only explicitly reported FantasyPros context.") + `<div class="plan-grid"><div><div class="section-divider"><span>ROSTER DEPTH</span></div><div class="plan-groups">${depth}</div></div><div class="side-stack"><article class="panel"><div class="panel-head"><div><p class="eyebrow">BYE WEEKS</p><h3>Starter conflicts</h3></div></div>${bye}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">PLAYOFF CONTEXT</p><h3>Explicit schedule strength</h3></div></div>${playoff}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">CURRENT-WEEK SCENARIOS</p><h3>Top legal moves</h3></div></div>${moveBody}<a class="text-link" href="#waivers">Review all waiver scenarios →</a></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">MULTIWEEK BASELINE</p><h3>${escapeHtml(horizon)}</h3></div></div>${weeklyBody}</article><article class="panel"><div class="panel-head"><div><p class="eyebrow">MULTIWEEK MOVES</p><h3>Add/drop impact</h3></div></div>${futureMoves}</article></div></div><article class="panel plan-limitations"><strong>Data boundaries</strong>${plan.limitations.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</article>`;
}

function renderLeague() {
  const league = state.snapshot.league;
  const slots = league.lineupSlots || [];
  const waiver = league.waiver || {};
  content.innerHTML = sectionHeader("League Setup", "Settings reported by ESPN for the connected league. Unavailable fields remain unlabeled rather than inferred.") + `<div class="league-grid">
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">LEAGUE</p><h3>${escapeHtml(league.name)}</h3></div><span class="record">${escapeHtml(league.season || "Season unavailable")}</span></div><dl class="settings-list"><div><dt>Platform</dt><dd>ESPN</dd></div><div><dt>Teams</dt><dd>${escapeHtml(league.teamCount ?? "Unavailable")}</dd></div><div><dt>Scoring</dt><dd>${escapeHtml(league.scoringType || "Unavailable")}</dd></div><div><dt>Current week</dt><dd>${escapeHtml(state.snapshot.currentWeek)}</dd></div></dl></article>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">ROSTER RULES</p><h3>Lineup slots</h3></div></div>${slots.length ? `<div class="slot-grid">${slots.map(item => `<div><strong>${escapeHtml(item.slot)}</strong><span>× ${item.count}</span></div>`).join("")}</div>` : emptyInline("Lineup-slot settings were not included in this snapshot.")}</article>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">ACQUISITIONS</p><h3>Waiver settings</h3></div></div><dl class="settings-list"><div><dt>Season acquisition limit</dt><dd>${formatLeagueLimit(waiver.acquisitionLimit)}</dd></div><div><dt>Processing days</dt><dd>${waiver.waiverProcessDays ?? "Unavailable"}</dd></div><div><dt>Budget</dt><dd>${waiver.budget ?? "Unavailable"}</dd></div></dl><p class="data-note">Player availability and transaction legality are rechecked from ESPN data on every refresh.</p></article>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">EXTERNAL RANKINGS</p><h3>FantasyPros ROS</h3></div>${state.rankingSet ? `<span class="record">${escapeHtml(state.rankingSet.scoringFormat)}</span>` : ""}</div>${state.rankingSet ? `<dl class="settings-list"><div><dt>Season</dt><dd>${escapeHtml(state.rankingSet.season)}</dd></div><div><dt>Expert filter</dt><dd>${escapeHtml(state.rankingSet.expertFilter)}</dd></div><div><dt>Records</dt><dd>${state.rankingSet.rankings.length}</dd></div><div><dt>Matched to ESPN</dt><dd>${Object.keys(state.rankingReconciliation.byPlayerId).length}</dd></div><div><dt>Unresolved</dt><dd>${state.rankingReconciliation.unresolved.length}</dd></div><div><dt>Conflicts</dt><dd>${state.rankingReconciliation.conflicts.length}</dd></div></dl><button class="button ghost" id="clear-rankings-button">Remove rankings</button><p class="data-note">Rankings remain separate from ESPN projections and are stored only in this browser.</p>` : `<p class="data-note">Import the FantasyPros ROS PPR CSV to add season-long context without replacing ESPN league data.</p>`}</article>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">WEEKLY PROJECTIONS</p><h3>Future scenario input</h3></div>${futureProjectionSet ? `<span class="record">${escapeHtml(futureProjectionSet.scoringFormat)}</span>` : ""}</div>${futureProjectionSet ? `<dl class="settings-list"><div><dt>Provider</dt><dd>${escapeHtml(futureProjectionSet.provider)}</dd></div><div><dt>Season</dt><dd>${futureProjectionSet.season}</dd></div><div><dt>Records</dt><dd>${futureProjectionSet.projections.length}</dd></div><div><dt>Weeks</dt><dd>${[...new Set(futureProjectionSet.projections.map(item => item.week))].sort((a,b) => a-b).join(", ")}</dd></div><div><dt>Explicit ID mappings</dt><dd>${projectionIdentityMap?.size || 0}</dd></div></dl><button class="button ghost" id="future-projections-button">Replace projections</button> <button class="button ghost" id="projection-identity-button">${projectionIdentityMap ? "Replace ID map" : "Import ID map"}</button> <button class="button ghost" id="clear-future-projections-button">Remove all</button>` : `<p class="data-note">Import a strict CSV with provider_player_id, week, and points columns. Player-ID mapping is still required before scenarios can use it.</p><button class="button ghost" id="future-projections-button">Import weekly CSV</button> <button class="button ghost" id="projection-identity-button">Import ID map</button>`}<div class="sync-actions"><button class="button secondary" id="download-projection-template">Download projection template</button><button class="button secondary" id="download-identity-template">Download ESPN ID template</button></div></article>
    ${mobileSyncCard()}
    <article class="panel privacy-card"><div class="panel-head"><div><p class="eyebrow">PRIVACY</p><h3>Your league stays local</h3></div></div><p>The Chrome companion reads ESPN through your existing session. Cookies never enter this website, and the latest normalized snapshot is cached only in this browser.</p><a href="https://github.com/Ryan42062001/the-chip-winner/blob/master/docs/privacy.md" target="_blank" rel="noreferrer">Read the data policy →</a></article>
    <article class="panel"><div class="panel-head"><div><p class="eyebrow">ADVANCED MODELS</p><h3>Privacy-safe context packet</h3></div></div><p class="data-note">Export the selected team’s normalized context without browser credentials or unrelated league data. Invalid recommendations are excluded by the offline evaluator.</p><button class="button ghost" id="download-model-context">Download model context</button></article>
  </div>`;
}

function readStoredSyncCredentials() {
  try { return JSON.parse(localStorage.getItem(SYNC_CREDENTIALS_KEY)); } catch { return null; }
}

function mobileSyncCard() {
  const credentials = readStoredSyncCredentials();
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">MOBILE ACCESS</p><h3>Encrypted device sync</h3></div><span class="quality fresh">Live</span></div><dl class="settings-list"><div><dt>Client-side encryption</dt><dd>AES-256-GCM</dd></div><div><dt>ESPN cookies uploaded</dt><dd>Never</dd></div><div><dt>Hosted sync service</dt><dd>Cloudflare · connected</dd></div></dl>${credentials ? `<p class="data-note">Your private mobile link is active. Refresh it after ESPN or rankings change.</p><div class="sync-actions"><button class="button primary" id="refresh-sync-button">Refresh mobile data</button><button class="button ghost" id="copy-sync-button">Copy mobile link</button><button class="button ghost" id="revoke-sync-button">Revoke</button></div>` : `<p class="data-note">Create a private link containing the decryption key. Anyone with that exact link can view the synced snapshot, so keep it private.</p><button class="button primary" id="create-sync-button">Create mobile link</button>`}<p class="data-note">Encrypted snapshots expire from Cloudflare after 30 days.</p></article>`;
}

function mobileUrl(credentials) {
  return `${location.origin}${location.pathname}${createMobileSyncFragment(credentials)}`;
}

async function publishCurrentSync(credentials) {
  await publishSyncState(syncProvider, credentials, state.snapshot, state.rankingSet);
  return mobileUrl(credentials);
}

async function createMobileSync() {
  const credentials = await createSyncCredentials();
  await publishCurrentSync(credentials);
  localStorage.setItem(SYNC_CREDENTIALS_KEY, JSON.stringify(credentials));
  render(); showNotice("Private mobile link created. Choose Copy mobile link, then open it on your phone.");
}

async function loadMobileSyncFromUrl() {
  const credentials = parseMobileSyncFragment(location.hash);
  if (!credentials) return false;
  const synced = await readSyncState(syncProvider, credentials);
  if (!synced) throw new Error("This mobile sync link has expired or was revoked.");
  store.dispatch({ type: "load/success", snapshot: synced.payload.snapshot, source: "sync" });
  if (synced.payload.rankingSet) loadRankingSet(synced.payload.rankingSet);
  return true;
}

function sectionHeader(title, subtitle) { return `<div class="page-head"><div><p class="eyebrow">WEEK ${state.snapshot.currentWeek}</p><h2>${title}</h2><p>${subtitle}</p></div><span class="week-pill">Source: ${escapeHtml(state.snapshot.meta?.projectionsSource || "not provided")}</span></div>`; }
function emptyState(title, text) { return `<div class="empty-state"><span>◇</span><h3>${title}</h3><p>${text}</p></div>`; }
function emptyInline(text) { return `<p class="empty-inline">${text}</p>`; }
function formatAvailability(status) { return status === "FREEAGENT" ? "FREE AGENT" : status === "WAIVERS" ? "WAIVERS" : "AVAILABLE"; }
function formatLeagueLimit(value) { return value === -1 ? "Unlimited" : value ?? "Unavailable"; }
function comparisonOptions(players, selectedId) { return players.map((player) => `<option value="${escapeHtml(player.id)}" ${player.id === selectedId ? "selected" : ""}>${escapeHtml(player.name)} · ${escapeHtml(player.position)}</option>`).join(""); }
function comparisonResult(result) {
  if (result.status === "invalid") return `<div class="comparison-message neutral"><strong>Comparison unavailable</strong><span>${escapeHtml(result.reason)}</span></div>`;
  if (result.status === "missing") return `<div class="comparison-message neutral"><strong>No data-based preference</strong><span>${escapeHtml(result.reason)}</span></div>`;
  const firstValue = result.first.projection.toFixed(1); const secondValue = result.second.projection.toFixed(1);
  if (result.status === "tossup") return `<div class="comparison-result-grid"><div><strong>${escapeHtml(result.first.name)}</strong><b>${firstValue}</b></div><div class="verdict neutral"><small>NEAR TIE</small><strong>${Math.abs(result.difference).toFixed(1)} pt apart</strong><span>${escapeHtml(result.reason)}</span></div><div><strong>${escapeHtml(result.second.name)}</strong><b>${secondValue}</b></div></div>`;
  return `<div class="comparison-result-grid"><div class="${result.preferred.id === result.first.id ? "preferred" : ""}"><strong>${escapeHtml(result.first.name)}</strong><b>${firstValue}</b></div><div class="verdict"><small>PROJECTION LEAN</small><strong>${escapeHtml(result.preferred.name)}</strong><span>${Math.abs(result.difference).toFixed(1)} projected points</span></div><div class="${result.preferred.id === result.second.id ? "preferred" : ""}"><strong>${escapeHtml(result.second.name)}</strong><b>${secondValue}</b></div></div>`;
}
function qualityBar(label, value) { const percent = Math.round(value * 100); return `<div class="quality-row"><span>${label}</span><strong>${percent}%</strong><i><b style="width:${percent}%"></b></i></div>`; }
function detailValue(value, formatter = String) { return value == null || value === "" ? '<span class="missing">Unavailable</span>' : escapeHtml(formatter(value)); }

function openPlayerDetail(playerId) {
  const detail = selectPlayerDetail(state.snapshot, state.selectedTeamId, playerId);
  if (!detail) return;
  const { player, rosterEntry, source } = detail;
  const ros = state.rankingReconciliation?.byPlayerId?.[player.id];
  const dialog = document.querySelector("#player-dialog");
  document.querySelector("#player-dialog-content").innerHTML = `<div class="detail-head"><div><p class="eyebrow">${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "NFL team unavailable")}</p><h2 id="player-dialog-title">${escapeHtml(player.name)}</h2><p>${rosterEntry ? `Rostered · ${escapeHtml(rosterEntry.lineupSlot)}` : detail.isAvailable === true ? `${escapeHtml(formatAvailability(player.availabilityStatus))} in ECOG` : "Roster status unavailable"}</p></div><form method="dialog"><button class="dialog-close" aria-label="Close player details">×</button></form></div>
    <div class="detail-projection"><span>Week ${state.snapshot.currentWeek} projection</span><strong>${player.projection == null ? "—" : player.projection.toFixed(1)}</strong><small>Source: ${escapeHtml(source.projections || "Unavailable")}</small></div>
    <dl class="detail-grid"><div><dt>Opponent</dt><dd>${detailValue(player.opponent)}</dd></div><div><dt>Kickoff</dt><dd>${detailValue(player.gameTime, gameTime)}</dd></div><div><dt>Injury</dt><dd>${detailValue(player.injury?.status)}</dd></div><div><dt>Bye week</dt><dd>${detailValue(player.byeWeek)}</dd></div><div><dt>Season average</dt><dd>${detailValue(player.seasonAverage, value => `${Number(value).toFixed(1)} pts`)}</dd></div><div><dt>Availability</dt><dd>${detail.isRostered ? "On roster" : detail.isAvailable === true ? escapeHtml(formatAvailability(player.availabilityStatus)) : detail.isAvailable === false ? "Not available" : "Unavailable"}</dd></div>${ros ? `<div><dt>FantasyPros ROS</dt><dd>#${ros.rank} overall · ${escapeHtml(ros.position)}${ros.positionRank}</dd></div><div><dt>Playoff SOS</dt><dd>${ros.playoffScheduleStrength == null ? '<span class="missing">Unavailable</span>' : `${ros.playoffScheduleStrength}/5`}</dd></div>` : ""}</dl>
    <div class="detail-source"><strong>Data provenance</strong><span>League: ${escapeHtml(String(source.leagueProvider || "Unavailable").toUpperCase())}</span><span>Snapshot: ${source.capturedAt ? escapeHtml(new Date(source.capturedAt).toLocaleString()) : "Unavailable"}</span>${ros ? `<span>ROS rank: FantasyPros · PPR · top-10 expert filter</span>` : ""}<p>Missing fields are not inferred. Verify late injury news before making a move.</p></div>`;
  dialog.showModal();
}

function render() {
  if (!state.snapshot) return;
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.section === state.section));
  const titles = { overview: "Weekly command center", lineup: "Lineup Lab", waivers: "Waiver Wire", alerts: "Player Alerts", changes: "What Changed", season: "Season Plan", league: "League Setup" };
  document.querySelector("#page-title").textContent = titles[state.section] || titles.overview;
  ({ overview: renderOverview, lineup: renderLineup, waivers: renderWaivers, alerts: renderAlerts, changes: renderChanges, season: renderSeasonPlan, league: renderLeague }[state.section] || renderOverview)();
}

function hydrateControls() {
  const { snapshot } = state;
  teamSelect.innerHTML = snapshot.teams.map((team) => `<option value="${escapeHtml(team.id)}" ${team.id === state.selectedTeamId ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("");
  document.querySelector("#league-label").textContent = `ESPN · ${snapshot.league.name}`;
  document.querySelector("#source-label").textContent = state.source === "sync" ? "Encrypted mobile snapshot" : snapshot.meta?.kind === "live-companion" ? "Live ESPN snapshot" : state.source === "cache" ? "Imported snapshot" : "Sample snapshot";
  document.querySelector("#source-time").textContent = snapshot.meta?.capturedAt ? `Captured ${new Date(snapshot.meta.capturedAt).toLocaleDateString()}` : "Capture time unavailable";
  document.querySelector("#reset-button").hidden = state.source !== "cache";
  const connected = snapshot.meta?.kind === "live-companion";
  const connectButton = document.querySelector("#connect-button");
  connectButton.textContent = state.source === "sync" ? "Mobile snapshot" : connected ? "Refresh ESPN" : "Connect ESPN";
  connectButton.disabled = state.source === "sync";
}

function loadRankingSet(rankingSet) {
  if (!rankingSet || !state.snapshot) return;
  store.dispatch({ type: "rankings/load", rankingSet, reconciliation: reconcileFantasyProsRankings(state.snapshot.players, rankingSet) });
}

function showNotice(message, kind = "success") {
  noticeRegion.innerHTML = `<div class="notice ${kind}">${escapeHtml(message)}<button aria-label="Dismiss">×</button></div>`;
  noticeRegion.querySelector("button").onclick = () => { noticeRegion.innerHTML = ""; };
}

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
function downloadCsv(filename, rows) {
  const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

function downloadIdentityTemplate() {
  downloadCsv("the-chip-winner-player-id-map.csv", [["provider_player_id", "espn_player_id", "player_name", "team", "position"], ...state.snapshot.players.map((player) => ["", player.id, player.name, player.proTeam || "", player.position])]);
}

function downloadProjectionTemplate() {
  const start = Math.max(1, Number(state.snapshot.currentWeek) || 1); const weeks = Array.from({ length: Math.min(6, 19 - start) }, (_, index) => start + index);
  const providerIds = projectionIdentityMap ? [...projectionIdentityMap.keys()] : [];
  downloadCsv("the-chip-winner-weekly-projections.csv", [["provider_player_id", "week", "points"], ...providerIds.flatMap((id) => weeks.map((week) => [id, week, ""]))]);
}

function downloadModelContext() {
  const result = buildModelContext(state.snapshot, state.selectedTeamId);
  if (!result.packet) throw new Error(result.errors.join(" "));
  const blob = new Blob([JSON.stringify(result.packet, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `the-chip-winner-model-context-week-${state.snapshot.currentWeek}.json`; link.click(); URL.revokeObjectURL(url);
}

async function init() {
  store.dispatch({ type: "load/start" });
  try {
    if (await loadMobileSyncFromUrl()) {
      hydrateControls(); render(); showNotice("Encrypted ESPN snapshot loaded from your private mobile link."); return;
    }
    const loaded = await provider.load();
    store.dispatch({ type: "load/success", ...loaded });
    if (loaded.snapshot.teams.some((team) => team.id === ESPN_CONNECTION.teamId)) store.dispatch({ type: "team/select", teamId: ESPN_CONNECTION.teamId });
    loadRankingSet(rankingProvider.readCache());
    hydrateControls(); render();
  } catch (error) { store.dispatch({ type: "load/error", error: error.message }); content.innerHTML = emptyState("Unable to load league data", error.message); }
}

teamSelect.addEventListener("change", () => { store.dispatch({ type: "team/select", teamId: teamSelect.value }); render(); });
document.querySelector("#import-button").addEventListener("click", () => document.querySelector("#snapshot-input").click());
document.querySelector("#rankings-button").addEventListener("click", () => document.querySelector("#rankings-input").click());
document.querySelector("#connect-button").addEventListener("click", async () => {
  const button = document.querySelector("#connect-button");
  button.disabled = true; button.textContent = "Connecting…";
  try {
    await companion.ping();
    const response = await companion.fetchLeague(ESPN_CONNECTION);
    const snapshot = normalizeEspnLeagueResponse(response.data.league, response.data.meta, { availablePlayers: response.data.availablePlayers, nflScoreboard: response.data.nflScoreboard });
    const previousSnapshot = provider.readCache();
    provider.saveSnapshot(snapshot);
    store.dispatch({ type: "load/success", snapshot, previousSnapshot, source: "cache" });
    loadRankingSet(state.rankingSet || rankingProvider.readCache());
    if (snapshot.teams.some((team) => team.id === ESPN_CONNECTION.teamId)) store.dispatch({ type: "team/select", teamId: ESPN_CONNECTION.teamId });
    hydrateControls(); render(); showNotice(`Connected ${snapshot.league.name}. ESPN data refreshed successfully.`);
  } catch (error) {
    showNotice(error.message.includes("not detected") ? `${error.message} See the setup guide in the repository.` : `${error.message} Make sure ESPN is signed in within this Chrome profile.`, "error");
  } finally {
    button.disabled = false;
    if (state.snapshot) hydrateControls();
  }
});
document.querySelector("#snapshot-input").addEventListener("change", async (event) => {
  try {
    const file = event.target.files[0]; if (!file) return;
    const previousSnapshot = provider.readCache();
    const snapshot = provider.importSnapshot(await file.text()); store.dispatch({ type: "load/success", snapshot, previousSnapshot, source: "cache" });
    loadRankingSet(state.rankingSet || rankingProvider.readCache());
    hydrateControls(); render(); showNotice(`Imported ${file.name}. Data is cached in this browser.`);
  } catch (error) { showNotice(error.message, "error"); }
  event.target.value = "";
});
document.querySelector("#rankings-input").addEventListener("change", async (event) => {
  try {
    const file = event.target.files[0]; if (!file) return;
    const rankingSet = rankingProvider.importCsv(await file.text(), { kind: "rest-of-season", season: 2026, scoringFormat: "PPR", expertFilter: "FantasyPros top-10 experts" });
    loadRankingSet(rankingSet); render();
    const reconciliation = state.rankingReconciliation;
    showNotice(`Imported ${rankingSet.rankings.length} FantasyPros ROS rankings. ${Object.keys(reconciliation.byPlayerId).length} matched ESPN players; ${reconciliation.unresolved.length} remain unresolved.`);
  } catch (error) { showNotice(error.message, "error"); }
  event.target.value = "";
});
document.querySelector("#future-projections-input").addEventListener("change", async (event) => {
  try {
    const file = event.target.files[0]; if (!file) return;
    futureProjectionSet = futureProjectionProvider.importCsv(await file.text(), { provider: "user-import", scoringFormat: state.snapshot.league.scoringType || "Unknown", season: Number(state.snapshot.league.season) || 2026, capturedAt: new Date().toISOString() });
    render();
    const weeks = [...new Set(futureProjectionSet.projections.map((item) => item.week))];
    showNotice(`Imported ${futureProjectionSet.projections.length} weekly projections across ${weeks.length} week${weeks.length === 1 ? "" : "s"}.`);
  } catch (error) { showNotice(error.message, "error"); }
  event.target.value = "";
});
document.querySelector("#projection-identity-input").addEventListener("change", async (event) => {
  try {
    const file = event.target.files[0]; if (!file) return;
    projectionIdentityMap = projectionIdentityMapProvider.importCsv(await file.text()); render();
    const knownEspnIds = new Set(state.snapshot.players.map((player) => player.id));
    const matched = [...projectionIdentityMap.values()].filter((id) => knownEspnIds.has(id)).length;
    showNotice(`Imported ${projectionIdentityMap.size} explicit player-ID mappings; ${matched} match this ESPN snapshot.`);
  } catch (error) { showNotice(error.message, "error"); }
  event.target.value = "";
});
document.querySelector("#reset-button").addEventListener("click", () => { provider.clearCache(); showNotice("Imported snapshot cleared. Loading sample data…"); setTimeout(() => location.reload(), 250); });
window.addEventListener("hashchange", () => { store.dispatch({ type: "section/select", section: appSection() }); render(); });
document.querySelector(".mobile-menu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => document.querySelector(".sidebar").classList.remove("open")));
content.addEventListener("click", (event) => { const row = event.target.closest("[data-player-id]"); if (row) openPlayerDetail(row.dataset.playerId); });
content.addEventListener("click", (event) => { if (event.target.closest("#clear-rankings-button")) { rankingProvider.clearCache(); store.dispatch({ type: "rankings/clear" }); render(); showNotice("FantasyPros rankings removed from this browser."); } });
content.addEventListener("click", (event) => {
  if (event.target.closest("#future-projections-button")) document.querySelector("#future-projections-input").click();
  if (event.target.closest("#projection-identity-button")) document.querySelector("#projection-identity-input").click();
  if (event.target.closest("#clear-future-projections-button")) { futureProjectionProvider.clearCache(); projectionIdentityMapProvider.clearCache(); futureProjectionSet = null; projectionIdentityMap = null; render(); showNotice("Weekly projections and ID mappings removed from this browser."); }
  if (event.target.closest("#download-projection-template")) downloadProjectionTemplate();
  if (event.target.closest("#download-identity-template")) downloadIdentityTemplate();
  if (event.target.closest("#download-model-context")) downloadModelContext();
});
content.addEventListener("click", async (event) => {
  const action = event.target.closest("#create-sync-button, #refresh-sync-button, #copy-sync-button, #revoke-sync-button");
  if (!action) return;
  action.disabled = true;
  try {
    if (action.id === "create-sync-button") await createMobileSync();
    if (action.id === "refresh-sync-button") { await publishCurrentSync(readStoredSyncCredentials()); showNotice("Mobile data refreshed."); }
    if (action.id === "copy-sync-button") { await navigator.clipboard.writeText(mobileUrl(readStoredSyncCredentials())); showNotice("Private mobile link copied."); }
    if (action.id === "revoke-sync-button") { const credentials = readStoredSyncCredentials(); await syncProvider.remove(credentials.channelId, credentials.writeToken); localStorage.removeItem(SYNC_CREDENTIALS_KEY); render(); showNotice("Mobile link revoked."); }
  } catch (error) { showNotice(error.message, "error"); action.disabled = false; }
});
content.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-player-id]")) { event.preventDefault(); openPlayerDetail(event.target.dataset.playerId); } });

init();
