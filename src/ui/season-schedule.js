const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
export function renderTeamScheduleCard(schedule, { hasImportedWeeks = false, hasSelectedWeeks = false } = {}) {
const { coverage } = schedule;
const rows = schedule.rows.length ? schedule.rows.map((item) => {
const opponent = item.opponentName ? escapeHtml(item.opponentName) : `ESPN team ${escapeHtml(item.opponentId)}`;
const score = item.teamScore == null || item.opponentScore == null ? "score unavailable" : `${escapeHtml(item.teamScore)}–${escapeHtml(item.opponentScore)}`;
return `<div class="plan-row"><strong>Week ${item.week} · ${opponent}</strong><span>${escapeHtml(item.homeAway)} · ${escapeHtml(item.status || "status unavailable")} · ${score}</span></div>`;
}).join("") : `<p class="plan-note">${hasImportedWeeks && !hasSelectedWeeks ? "Select at least one planning week to review its ESPN matchup." : "ESPN did not report a current or future matchup for this team."}</p>`;
const missing = coverage.missingWeeks.length ? `<p class="plan-note">Missing ESPN matchup records for Week${coverage.missingWeeks.length === 1 ? "" : "s"} ${coverage.missingWeeks.join(", ")}.</p>` : "";
const ambiguous = coverage.ambiguousWeeks.length ? `<p class="plan-note">Multiple ESPN matchup records were reported for Week${coverage.ambiguousWeeks.length === 1 ? "" : "s"} ${coverage.ambiguousWeeks.join(", ")}; all are shown.</p>` : "";
const repeats = coverage.repeatedOpponents?.length ? `<details class="coverage-details"><summary>${coverage.repeatedOpponents.length} repeated ESPN opponent${coverage.repeatedOpponents.length === 1 ? "" : "s"}</summary>${coverage.repeatedOpponents.map((item) => `<span>${escapeHtml(item.opponentName || `ESPN team ${item.opponentId}`)} · Weeks ${item.weeks.join(", ")}</span>`).join("")}</details>` : "";
const coverageLabel = ({ complete: "Complete", partial: "Partial", ambiguous: "Ambiguous", unavailable: "Unavailable" })[coverage.status] || "Unverified";
return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">FANTASY SCHEDULE</p><h3>ESPN-reported opponents</h3></div><span class="record">${coverage.reportedWeeks}/${coverage.requestedWeeks} weeks · ${coverageLabel}</span></div>${rows}${missing}${ambiguous}${repeats}<p class="data-note">${escapeHtml(schedule.methodology)}</p></article>`;
}
