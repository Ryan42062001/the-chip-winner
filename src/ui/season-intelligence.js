const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

function points(value) {
  return value == null || !Number.isFinite(Number(value)) ? "Unavailable" : `${Number(value).toFixed(1)} pts`;
}

function byeGapLabel(row) {
  if (!row.uncoveredSlotCount) return "Current roster can fill every configured starter slot";
  const count = `${row.uncoveredSlotCount} uncovered starter slot${row.uncoveredSlotCount === 1 ? "" : "s"}`;
  if (!row.uncoveredSlotCandidates?.length) return count;
  const candidates = row.uncoveredSlotCandidates.join(" or ");
  return row.uncoveredSlotCandidates.length === 1 ? `${count}: ${candidates}` : `${count} · could affect ${candidates} depending on legal slot assignment`;
}

function byeCoverageCard(intelligence, playerIndex) {
  const coverage = intelligence.byeCoverage;
  const rows = coverage.weeks?.length ? coverage.weeks.map((row) => {
    const names = row.byePlayerIds.map((id) => playerIndex.get(id)?.name || id).join(", ");
    const gap = byeGapLabel(row);
    const label = row.status === "gap" ? "Gap" : row.status === "partial" ? "Partial" : "Covered";
    return `<div class="plan-row"><strong>Week ${row.week} · ${label}</strong><span>${escapeHtml(names || "No active roster player on a known bye")} · ${escapeHtml(gap)}</span></div>`;
  }).join("") : `<p class="plan-note">No future known bye weeks were found on the current active roster.</p>`;
  const unknown = coverage.unknownByePlayerIds?.length ? `<p class="plan-note">${coverage.unknownByePlayerIds.length} active roster player${coverage.unknownByePlayerIds.length === 1 ? " has" : "s have"} no explicit bye week, so otherwise covered weeks remain partial.</p>` : "";
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">BYE COVERAGE</p><h3>Can the current roster fill every slot?</h3></div><span class="quality ${coverage.gapWeeks?.length ? "aging" : coverage.status === "ready" ? "fresh" : "unknown"}">${coverage.gapWeeks?.length ? `${coverage.gapWeeks.length} gap week${coverage.gapWeeks.length === 1 ? "" : "s"}` : coverage.status === "partial" ? "Partial" : "Covered"}</span></div>${rows}${unknown}<p class="data-note">${escapeHtml(coverage.methodology || "")}</p></article>`;
}

function fantasyPlayoffScheduleCard(intelligence) {
  const schedule = intelligence.fantasyPlayoffSchedule;
  if (!intelligence.playoffWeeks.length) return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">PLAYOFF OPPONENTS</p><h3>ESPN fantasy schedule</h3></div><span class="quality unknown">Not configured</span></div><p class="plan-note">Configure fantasy playoff weeks before the app evaluates your ESPN-reported playoff opponents.</p></article>`;
  const rows = schedule.rows?.length ? schedule.rows.map((row) => `<div class="plan-row"><strong>Week ${row.week} · ${escapeHtml(row.opponentName || `ESPN team ${row.opponentId}`)}</strong><span>${escapeHtml(row.homeAway)} · ${escapeHtml(row.status || "status unavailable")}</span></div>`).join("") : `<p class="plan-note">ESPN did not report a fantasy matchup for the configured playoff window.</p>`;
  const missing = schedule.coverage?.missingWeeks?.length ? `<p class="plan-note">Missing ESPN fantasy matchups for Weeks ${schedule.coverage.missingWeeks.join(", ")}.</p>` : "";
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">PLAYOFF OPPONENTS</p><h3>ESPN fantasy schedule</h3></div><span class="quality ${schedule.coverage?.status === "complete" ? "fresh" : "unknown"}">${schedule.coverage?.reportedWeeks || 0}/${schedule.coverage?.requestedWeeks || intelligence.playoffWeeks.length} weeks</span></div>${rows}${missing}<p class="data-note">Fantasy-league opponents are ESPN facts. They are not NFL defensive matchup grades or win probabilities.</p></article>`;
}

function playoffProjectionCard(intelligence) {
  const outlook = intelligence.playoffProjection;
  if (!intelligence.playoffWeeks.length) return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">PLAYOFF PROJECTION WINDOW</p><h3>Optimized weekly baseline</h3></div><span class="quality unknown">Not configured</span></div><p class="plan-note">Configure playoff weeks to evaluate a projection-gated playoff baseline.</p></article>`;
  const rows = outlook.rows?.length ? outlook.rows.map((row) => `<div class="plan-row"><strong>Week ${row.week} · ${row.completeCoverage ? "usable" : "blocked"}</strong><span>${row.completeCoverage ? `${points(row.projectedTotal)} optimized` : `${row.mappedProjectionCount || 0}/${row.rosterPlayerCount || 0} roster projections mapped · aggregate withheld`}</span></div>`).join("") : `<p class="plan-note">No compatible future projection set is available for these playoff weeks.</p>`;
  const aggregate = outlook.aggregate ? `<dl class="settings-list"><div><dt>Playoff total</dt><dd>${points(outlook.aggregate.horizonTotal)}</dd></div><div><dt>Average week</dt><dd>${points(outlook.aggregate.average)}</dd></div><div><dt>Lowest week</dt><dd>Week ${outlook.aggregate.lowestWeek.week} · ${points(outlook.aggregate.lowestWeek.projectedTotal)}</dd></div><div><dt>Highest week</dt><dd>Week ${outlook.aggregate.highestWeek.week} · ${points(outlook.aggregate.highestWeek.projectedTotal)}</dd></div><div><dt>Stable starters</dt><dd>${outlook.aggregate.stableStarterIds.length} across every selected week</dd></div><div><dt>Starter turnover</dt><dd>${outlook.aggregate.starterTurnover} entrant${outlook.aggregate.starterTurnover === 1 ? "" : "s"} across adjacent weeks</dd></div></dl>` : `<p class="plan-note"><strong>Playoff aggregate withheld.</strong> ${outlook.blockedWeeks?.length ? `Blocked Weeks ${outlook.blockedWeeks.join(", ")}.` : "Every selected week must have complete mapped roster coverage first."}</p>`;
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">PLAYOFF PROJECTION WINDOW</p><h3>Optimized weekly baseline</h3></div><span class="quality ${outlook.status === "ready" ? "fresh" : outlook.status === "partial" ? "aging" : "unknown"}">${outlook.completeWeeks || 0}/${intelligence.playoffWeeks.length} usable</span></div>${rows}${aggregate}<p class="data-note">${escapeHtml(outlook.methodology || "")}</p></article>`;
}

function sosCard(intelligence) {
  const outlook = intelligence.scheduleStrength;
  if (outlook.status === "unavailable") return `<article class="panel season-sos-card"><div class="panel-head"><div><p class="eyebrow">POSITION-SPECIFIC SOS</p><h3>Imported FantasyPros context</h3></div><span class="quality unknown">Unavailable</span></div><p class="plan-note">Import a compatible FantasyPros rest-of-season CSV containing explicit SOS SEASON or SOS PLAYOFFS fields to show this advisory layer.</p><p class="data-note">The Chip Winner does not scrape or invent strength-of-schedule ratings.</p></article>`;
  const rated = outlook.items.filter((item) => item.seasonStars != null || item.playoffStars != null);
  const rows = rated.map((item) => `<div class="plan-row"><strong>${escapeHtml(item.playerName)} · ${escapeHtml(item.position)}</strong><span>Season ${item.seasonStars == null ? "—" : `${item.seasonStars}/5 ${item.seasonBand}`} · FantasyPros playoffs ${item.playoffStars == null ? "—" : `${item.playoffStars}/5 ${item.playoffBand}`}</span></div>`).join("");
  const summary = outlook.starterSummary;
  return `<article class="panel season-sos-card"><div class="panel-head"><div><p class="eyebrow">POSITION-SPECIFIC SOS</p><h3>Imported FantasyPros context</h3></div><span class="quality ${outlook.status === "ready" ? "fresh" : "aging"}">${outlook.ratedRosterPlayers}/${outlook.totalRosterPlayers} rated</span></div><p class="plan-note"><strong>Rated starters:</strong> ${summary.favorable} favorable · ${summary.neutral} neutral · ${summary.difficult} difficult · ${summary.total - summary.rated} unavailable.</p><details class="plan-disclosure"><summary>Player-level FantasyPros SOS · ${rated.length} rated</summary><div class="plan-disclosure-body">${rows || `<p class="plan-note">No explicit SOS stars were present for rostered players.</p>`}</div></details><p class="data-note">${escapeHtml(outlook.methodology || "")}</p></article>`;
}

export function renderSeasonPlayoffIntelligence(intelligence, snapshot) {
  if (intelligence?.status !== "ready") return `<section class="season-intelligence-board"><div class="section-divider"><span>SEASON OUTLOOK</span></div><article class="panel"><p class="plan-note">Season intelligence is unavailable because the selected roster is missing.</p></article></section>`;
  const players = new Map((snapshot?.players || []).map((player) => [player.id, player]));
  const boundary = intelligence.playoffBoundarySource === "espn" ? "ESPN league setting" : intelligence.playoffBoundarySource === "local" ? "Local browser setting" : "Not configured";
  const weeks = intelligence.playoffWeeks.length ? `Weeks ${intelligence.playoffWeeks.join(", ")}` : "Not configured";
  const bye = intelligence.byeCoverage;
  const opponent = intelligence.fantasyPlayoffSchedule.coverage;
  const projection = intelligence.playoffProjection;
  const sos = intelligence.scheduleStrength;
  const byeLabel = bye.gapWeeks?.length ? `${bye.gapWeeks.length} gap week${bye.gapWeeks.length === 1 ? "" : "s"}` : bye.status === "partial" ? "Partial evidence" : bye.status === "ready" ? "Covered" : "Unavailable";
  const opponentLabel = intelligence.playoffWeeks.length ? `${opponent?.reportedWeeks || 0}/${opponent?.requestedWeeks || intelligence.playoffWeeks.length} weeks reported` : "Not configured";
  const projectionLabel = intelligence.playoffWeeks.length ? `${projection.completeWeeks || 0}/${intelligence.playoffWeeks.length} usable · ${projection.aggregate ? "aggregate available" : "aggregate withheld"}` : "Not configured";
  const sosLabel = sos.status === "unavailable" ? "Unavailable" : `${sos.ratedRosterPlayers}/${sos.totalRosterPlayers} roster players rated`;
  const sosSummary = sos.status === "unavailable" ? "Import a compatible FantasyPros ROS CSV for advisory SOS stars." : `Rated starters: ${sos.starterSummary.favorable} favorable · ${sos.starterSummary.neutral} neutral · ${sos.starterSummary.difficult} difficult · ${sos.starterSummary.total - sos.starterSummary.rated} unavailable.`;
  return `<section class="season-intelligence-board" aria-labelledby="season-intelligence-title"><article class="panel season-outlook"><div class="season-outlook-heading"><div><p class="eyebrow">SEASON PLAN · PRIMARY</p><h3 id="season-intelligence-title">Season Outlook</h3></div><span class="quality ${intelligence.playoffWeeks.length ? "fresh" : "unknown"}">${escapeHtml(weeks)}</span></div><div class="season-outlook-grid"><div class="season-outlook-item"><span>Playoff boundary</span><strong>${escapeHtml(weeks)}</strong><small>${escapeHtml(boundary)}${intelligence.playoffBoundarySource === "local" ? " · does not change ESPN" : ""}</small></div><div class="season-outlook-item"><span>Bye coverage</span><strong class="${bye.gapWeeks?.length ? "outlook-attention" : ""}">${escapeHtml(byeLabel)}</strong><small>Known ESPN bye facts and lineup eligibility</small></div><div class="season-outlook-item"><span>ESPN playoff opponents</span><strong>${escapeHtml(opponentLabel)}</strong><small>Missing fantasy matchups stay unavailable</small></div><div class="season-outlook-item"><span>Playoff projections</span><strong class="${projection.aggregate ? "" : "outlook-attention"}">${escapeHtml(projectionLabel)}</strong><small>Full mapped coverage required for totals</small></div><div class="season-outlook-item season-outlook-sos"><span>FantasyPros SOS · independent advisory</span><strong>${escapeHtml(sosLabel)}</strong><small>${escapeHtml(sosSummary)}</small></div></div><details class="plan-disclosure season-outlook-controls"><summary>Configure local playoff weeks</summary></details><details class="plan-disclosure season-evidence"><summary>Playoff, bye and FantasyPros evidence</summary><div class="season-evidence-grid">${byeCoverageCard(intelligence, players)}${fantasyPlayoffScheduleCard(intelligence)}${playoffProjectionCard(intelligence)}${sosCard(intelligence)}</div><p class="data-note">ESPN owns league state and fantasy opponents. Future points use compatible mapped projections. FantasyPros SOS is an imported advisory overlay only.</p></details></article></section>`;
}
