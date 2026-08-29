import { evaluateFutureProjectionCompatibility, selectMappedFutureProjection } from "../providers/projections/future-projection-provider.js";
import { escapeHtml as escape } from "./manual-projection-dialog.js";

export function renderExternalProjectionDetail(set, identityMap, snapshot, playerId) {
  const unavailable = (label, source = "") => ({ grid: `<div><dt>External projection</dt><dd><span class="missing">${label}</span></dd></div>`, source });
  if (!set) return unavailable("Not imported");
  const compatibility = evaluateFutureProjectionCompatibility(set, snapshot);
  if (!compatibility.usable) return unavailable("Blocked", `<span>Blocked: ${escape(compatibility.errors.join(" "))}</span>`);
  const weeks = [...new Set(set.projections.map((item) => item.week))].sort((a, b) => a - b); if (!weeks.length) return unavailable("No weekly values"); const first = selectMappedFutureProjection(set, identityMap, playerId, weeks[0]);
  if (["missing-mapping", "identity-conflict"].includes(first.status)) return unavailable(first.status === "identity-conflict" ? "Mapping conflict" : "Unmapped");
  const values = weeks.map((week) => ({ week, ...selectMappedFutureProjection(set, identityMap, playerId, week) })); const known = values.filter((item) => item.status === "ready").length;
  const grid = values.map((item) => `<div><dt>${escape(set.provider)} Week ${item.week}</dt><dd>${item.status === "ready" ? `${item.points.toFixed(1)} pts` : '<span class="missing">Unavailable</span>'}</dd></div>`).join("");
  return { grid, source: `<span>External: ${escape(set.provider)} · ${escape(set.scoringFormat)} · ${known}/${weeks.length} imported weeks · oldest retained capture ${escape(new Date(set.capturedAt).toLocaleString())}</span>` };
}
