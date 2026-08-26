import { EspnSnapshotProvider } from "./providers/espn/espn-provider.js";
import { isStarter } from "./domain/model.js";
import { buildLineupSuggestions, buildWaiverIdeas, buildWarnings } from "./domain/recommendations.js";
import { selectDataCoverage, selectProjectedTotal, selectSnapshotFreshness, selectTeamContext } from "./domain/selectors.js";
import { appReducer, createStore, initialAppState } from "./application/store.js";
import { EspnCompanionClient } from "./providers/espn/companion-client.js";
import { normalizeEspnLeagueResponse } from "./providers/espn/espn-normalizer.js";

const provider = new EspnSnapshotProvider();
const companion = new EspnCompanionClient();
const ESPN_CONNECTION = Object.freeze({ leagueId: "118749183", seasonId: "2026", teamId: "2" });
const content = document.querySelector("#app-content");
const noticeRegion = document.querySelector("#notice-region");
const teamSelect = document.querySelector("#team-select");
const store = createStore({ ...initialAppState, section: location.hash.slice(1) || "overview" }, appReducer);
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
  return `<div class="player-row">
    <span class="slot">${escapeHtml(entry.lineupSlot)}</span>
    <span class="avatar pos-${escapeHtml(player.position).replace("/", "")}">${initials(player.name)}</span>
    <span class="player-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "Team unavailable")} vs ${escapeHtml(player.opponent || "Opponent unavailable")}</small></span>
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
          <p class="data-note">Waiver availability: <strong>${coverage.availability ? "included" : "not provided"}</strong>. Recommendations only use reported fields.</p>
        </article>
      </div>
    </div>`;
}

function renderLineup() {
  const suggestions = buildLineupSuggestions(state.snapshot, state.selectedTeamId);
  content.innerHTML = sectionHeader("Lineup Lab", "Projection-based comparisons from the data in your snapshot. No confidence is implied when inputs are missing.") +
    `<div class="recommendation-grid">${suggestions.length ? suggestions.map(s => `<article class="panel recommendation"><span class="recommendation-kicker">${escapeHtml(s.slot)} SWAP</span><div class="compare"><div><small>START</small><strong>${escapeHtml(s.start.name)}</strong><span>${projection(s.start.projection)}</span></div><span class="swap-arrow">→</span><div><small>SIT</small><strong>${escapeHtml(s.sit.name)}</strong><span>${projection(s.sit.projection)}</span></div></div><div class="gain">+${s.gain} projected points</div><p>${escapeHtml(s.reason)}. Verify late news before making a move.</p></article>`).join("") : emptyState("No lineup changes identified", "Available projections do not show a higher-scoring eligible bench option. This is not a guarantee that your lineup is optimal.")}</div>`;
}

function renderWaivers() {
  const result = buildWaiverIdeas(state.snapshot, state.selectedTeamId);
  const body = result.status === "missing" ? emptyState("Availability data missing", "This ESPN snapshot does not include free-agent availability. Import a snapshot containing availablePlayers to compare adds and drops.") : result.items.length ? result.items.map(item => `<article class="panel waiver-row"><span class="avatar pos-${item.add.position.replace("/", "")}">${initials(item.add.name)}</span><div><small>CONSIDER ADDING</small><strong>${escapeHtml(item.add.name)}</strong><span>${escapeHtml(item.add.position)} · ${projection(item.add.projection)}</span></div><span class="swap-arrow">for</span><div><small>POSSIBLE DROP</small><strong>${escapeHtml(item.drop.name)}</strong><span>${escapeHtml(item.drop.position)} · ${projection(item.drop.projection)}</span></div><b class="positive">+${item.gain}</b></article>`).join("") : emptyState("No clear waiver upgrades", "No same-position available player has a higher projection than a rostered player in this snapshot.");
  content.innerHTML = sectionHeader("Waiver Wire", "Conservative add/drop comparisons using only explicitly available players and projections.") + `<div class="waiver-list">${body}</div>`;
}

function renderAlerts() {
  const warnings = buildWarnings(state.snapshot, state.selectedTeamId);
  content.innerHTML = sectionHeader("Player Alerts", "Injury and bye-week flags reported by the imported source data.") + `<div class="alert-list">${warnings.length ? warnings.map(w => `<article class="panel alert-row"><span class="alert-symbol ${w.kind}">${w.kind === "injury" ? "!" : "B"}</span><div><small>${escapeHtml(w.kind.toUpperCase())} · ${escapeHtml(w.lineupSlot)}</small><strong>${escapeHtml(w.player.name)}</strong><p>${escapeHtml(w.detail || (w.kind === "bye" ? `Bye in Week ${state.snapshot.currentWeek}` : `Status: ${w.player.injury.status}`))}</p></div></article>`).join("") : emptyState("No alerts in this snapshot", "No injuries or current-week byes were reported for this roster.")}</div>`;
}

function sectionHeader(title, subtitle) { return `<div class="page-head"><div><p class="eyebrow">WEEK ${state.snapshot.currentWeek}</p><h2>${title}</h2><p>${subtitle}</p></div><span class="week-pill">Source: ${escapeHtml(state.snapshot.meta?.projectionsSource || "not provided")}</span></div>`; }
function emptyState(title, text) { return `<div class="empty-state"><span>◇</span><h3>${title}</h3><p>${text}</p></div>`; }
function emptyInline(text) { return `<p class="empty-inline">${text}</p>`; }
function qualityBar(label, value) { const percent = Math.round(value * 100); return `<div class="quality-row"><span>${label}</span><strong>${percent}%</strong><i><b style="width:${percent}%"></b></i></div>`; }

function render() {
  if (!state.snapshot) return;
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.section === state.section));
  const titles = { overview: "Weekly command center", lineup: "Lineup Lab", waivers: "Waiver Wire", alerts: "Player Alerts" };
  document.querySelector("#page-title").textContent = titles[state.section] || titles.overview;
  ({ overview: renderOverview, lineup: renderLineup, waivers: renderWaivers, alerts: renderAlerts }[state.section] || renderOverview)();
}

function hydrateControls() {
  const { snapshot } = state;
  teamSelect.innerHTML = snapshot.teams.map((team) => `<option value="${escapeHtml(team.id)}" ${team.id === state.selectedTeamId ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("");
  document.querySelector("#league-label").textContent = `ESPN · ${snapshot.league.name}`;
  document.querySelector("#source-label").textContent = snapshot.meta?.kind === "live-companion" ? "Live ESPN snapshot" : state.source === "cache" ? "Imported snapshot" : "Sample snapshot";
  document.querySelector("#source-time").textContent = snapshot.meta?.capturedAt ? `Captured ${new Date(snapshot.meta.capturedAt).toLocaleDateString()}` : "Capture time unavailable";
  document.querySelector("#reset-button").hidden = state.source !== "cache";
  const connected = snapshot.meta?.kind === "live-companion";
  const connectButton = document.querySelector("#connect-button");
  connectButton.textContent = connected ? "Refresh ESPN" : "Connect ESPN";
}

function showNotice(message, kind = "success") {
  noticeRegion.innerHTML = `<div class="notice ${kind}">${escapeHtml(message)}<button aria-label="Dismiss">×</button></div>`;
  noticeRegion.querySelector("button").onclick = () => { noticeRegion.innerHTML = ""; };
}

async function init() {
  store.dispatch({ type: "load/start" });
  try {
    const loaded = await provider.load();
    store.dispatch({ type: "load/success", ...loaded });
    hydrateControls(); render();
  } catch (error) { store.dispatch({ type: "load/error", error: error.message }); content.innerHTML = emptyState("Unable to load league data", error.message); }
}

teamSelect.addEventListener("change", () => { store.dispatch({ type: "team/select", teamId: teamSelect.value }); render(); });
document.querySelector("#import-button").addEventListener("click", () => document.querySelector("#snapshot-input").click());
document.querySelector("#connect-button").addEventListener("click", async () => {
  const button = document.querySelector("#connect-button");
  button.disabled = true; button.textContent = "Connecting…";
  try {
    await companion.ping();
    const response = await companion.fetchLeague(ESPN_CONNECTION);
    const snapshot = normalizeEspnLeagueResponse(response.data.league, response.data.meta, { availablePlayers: response.data.availablePlayers, nflScoreboard: response.data.nflScoreboard });
    provider.saveSnapshot(snapshot);
    store.dispatch({ type: "load/success", snapshot, source: "cache" });
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
    const snapshot = provider.importSnapshot(await file.text()); store.dispatch({ type: "load/success", snapshot, source: "cache" });
    hydrateControls(); render(); showNotice(`Imported ${file.name}. Data is cached in this browser.`);
  } catch (error) { showNotice(error.message, "error"); }
  event.target.value = "";
});
document.querySelector("#reset-button").addEventListener("click", () => { provider.clearCache(); showNotice("Imported snapshot cleared. Loading sample data…"); setTimeout(() => location.reload(), 250); });
window.addEventListener("hashchange", () => { store.dispatch({ type: "section/select", section: location.hash.slice(1) || "overview" }); render(); });
document.querySelector(".mobile-menu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => document.querySelector(".sidebar").classList.remove("open")));

init();
