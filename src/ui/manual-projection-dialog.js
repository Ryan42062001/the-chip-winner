export const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

export function renderManualProjectionDialog(session, snapshot, selectedTeamId) {
  if (!session) return;
  const usedRows = new Set(session.approvals.map((item) => item.sourceKey)); const usedEspn = new Set(session.approvals.map((item) => item.espnPlayerId));
  const rosterIds = new Set(snapshot.rosters.find((roster) => roster.teamId === selectedTeamId)?.entries?.map((item) => item.playerId) || []);
  const players = [...snapshot.players].sort((a, b) => Number(rosterIds.has(b.id)) - Number(rosterIds.has(a.id)) || a.name.localeCompare(b.name));
  document.querySelector("#manual-source-row").innerHTML = session.records.filter((item) => !usedRows.has(item.sourceKey)).map((item) => `<option value="${escapeHtml(item.sourceKey)}">${escapeHtml(item.playerName)} · ${escapeHtml(item.team || "team unavailable")} · ${escapeHtml(item.position)} · ${item.points.toFixed(1)} pts</option>`).join("");
  document.querySelector("#manual-espn-player").innerHTML = players.filter((item) => !usedEspn.has(item.id)).map((item) => `<option value="${escapeHtml(item.id)}">${rosterIds.has(item.id) ? "My roster · " : ""}${escapeHtml(item.name)} · ${escapeHtml(item.proTeam || "team unavailable")} · ${escapeHtml(item.position)}</option>`).join("");
  document.querySelector("#manual-approved-list").innerHTML = session.approvals.length ? `<strong>${session.approvals.length} approved mapping${session.approvals.length === 1 ? "" : "s"}</strong>${session.approvals.map((approval, index) => { const source = session.records.find((item) => item.sourceKey === approval.sourceKey); const player = snapshot.players.find((item) => item.id === approval.espnPlayerId); return `<div><span>${escapeHtml(source?.playerName)} → ${escapeHtml(player?.name || approval.espnPlayerId)}</span><button type="button" data-remove-manual-approval="${index}" aria-label="Remove ${escapeHtml(source?.playerName)} mapping">×</button></div>`; }).join("")}` : "<p>No mappings approved yet. Start with players on your roster.</p>";
}
