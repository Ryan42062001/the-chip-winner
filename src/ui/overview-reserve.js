export function renderOverviewReserveSection({ reserve = [], playerIndex, escapeHtml }) {
  if (!reserve.length) return "";

  const initials = (name) => String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const rows = reserve.map((entry) => {
    const player = playerIndex?.get?.(entry.playerId);
    if (!player) return "";
    const status = player.injury?.status && player.injury.status !== "ACTIVE" ? player.injury.status : null;
    return `<div class="player-row interactive-row" data-player-id="${escapeHtml(player.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(player.name)} details">
<span class="slot">${escapeHtml(entry.lineupSlot)}</span>
<span class="avatar pos-${escapeHtml(player.position).replace("/", "")}">${escapeHtml(initials(player.name))}</span>
<span class="player-main"><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.position)} · ${escapeHtml(player.proTeam || "Team unavailable")} vs ${escapeHtml(player.opponent || "Opponent unavailable")}</small></span>
${status ? `<span class="tag danger">${escapeHtml(status)}</span>` : `<span class="game-time">Time unavailable</span>`}
<span class="player-proj"><strong>${player.projection == null ? "—" : Number(player.projection).toFixed(1)}</strong><small>projected</small></span>
</div>`;
  }).join("");

  return `<div class="list-heading bench-heading reserve-heading"><span>IR</span><span>${reserve.length} PLAYER${reserve.length === 1 ? "" : "S"}</span></div>${rows}`;
}

export function decorateOverviewReserve({ content, state, selectTeamContext, escapeHtml }) {
  if (state?.section !== "overview" || !state?.snapshot || !state?.selectedTeamId) return;
  const panel = content?.querySelector?.(".roster-panel");
  if (!panel || panel.querySelector(".reserve-heading")) return;
  const { reserve, index } = selectTeamContext(state.snapshot, state.selectedTeamId);
  const html = renderOverviewReserveSection({ reserve, playerIndex: index.players, escapeHtml });
  if (html) panel.insertAdjacentHTML("beforeend", html);
}
