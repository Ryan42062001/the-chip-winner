function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function formatAvailability(status) {
  return status === "FREEAGENT" ? "FREE AGENT" : status === "WAIVERS" ? "WAIVERS" : "AVAILABLE";
}

function signalCopy(item) {
  if (item.signal === "better") return { symbol: "+", label: "Better", className: "positive" };
  if (item.signal === "below") return { symbol: "−", label: "Below", className: "negative" };
  if (item.signal === "similar") return { symbol: "≈", label: "Similar", className: "similar" };
  return { symbol: "?", label: "No baseline", className: "unknown" };
}

function deltaCopy(item) {
  if (item.delta == null || item.baseline?.status !== "ready") return "No projected same-position roster baseline";
  const sign = item.delta > 0 ? "+" : "";
  return `${sign}${item.delta.toFixed(1)} vs ${item.baseline.name}`;
}

function playerRow(item, strictAddIds) {
  const signal = signalCopy(item);
  const strict = strictAddIds.has(item.player.id);
  return `<div class="waiver-board-player interactive-row" data-player-id="${escapeHtml(item.player.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.player.name)} details">
    <span class="waiver-board-rank">${item.rank}</span>
    <div class="waiver-board-copy">
      <strong>${escapeHtml(item.player.name)}${strict ? ' <span class="waiver-action-chip">Act now</span>' : ""}</strong>
      <small>${escapeHtml(formatAvailability(item.player.availabilityStatus))} · ${item.player.projection.toFixed(1)} pts ESPN</small>
    </div>
    <div class="waiver-board-signal ${signal.className}" aria-label="${escapeHtml(signal.label)} roster comparison">
      <strong>${signal.symbol} ${signal.label}</strong>
      <small>${escapeHtml(deltaCopy(item))}</small>
    </div>
  </div>`;
}

function positionCard(position, strictAddIds) {
  const countLabel = `${position.items.length} of ${position.projectedAvailable} projected`;
  const rows = position.items.length
    ? position.items.map((item) => playerRow(item, strictAddIds)).join("")
    : '<p class="empty-inline">No projected ESPN-available players at this position.</p>';
  return `<article class="panel waiver-position-card">
    <div class="panel-head"><div><p class="eyebrow">AVAILABLE</p><h3>${escapeHtml(position.position)}</h3></div><span class="waiver-board-count">${escapeHtml(countLabel)}</span></div>
    ${rows}
  </article>`;
}

export function renderWaiverPositionBoard(board, strictAddIds = new Set()) {
  if (board?.status === "missing-availability") {
    return `<div class="section-divider waiver-board-divider"><span>AVAILABLE PLAYER BOARD · ESPN CURRENT WEEK</span></div><div class="empty-state waiver-board-empty"><span>◇</span><h3>Availability data missing</h3><p>Refresh ESPN before ranking available players by position.</p></div>`;
  }
  if (board?.status !== "ready") return "";

  return `<div class="section-divider waiver-board-divider"><span>AVAILABLE PLAYER BOARD · ESPN CURRENT WEEK</span></div>
    <div class="waiver-board-summary">
      <strong>Top ${board.displayLimit} by position</strong>
      <span>${board.totalProjected} of ${board.totalAvailable} ESPN-available players have a current-week projection.</span>
      <small><b>+</b> projects at least ${board.signalThreshold.toFixed(1)} above your lowest projected non-IR rostered player at the same position; <b>≈</b> is within ${board.signalThreshold.toFixed(1)}; <b>−</b> is at least ${board.signalThreshold.toFixed(1)} below. This is browsing context, not a transaction recommendation. The full-lineup legal engine below remains authoritative.</small>
    </div>
    <div class="waiver-position-grid">${board.positions.map((position) => positionCard(position, strictAddIds)).join("")}</div>`;
}
