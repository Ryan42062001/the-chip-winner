import { evaluateFutureProjectionCompatibility, selectMappedFutureProjection } from "../providers/projections/future-projection-provider.js";
import { escapeHtml as escape } from "./manual-projection-dialog.js";

export function renderExternalProjectionDetail(set, identityMap, snapshot, playerId) {
  const unavailable = (label, source = "") => ({ grid: `<div><dt>External projection</dt><dd><span class="missing">${label}</span></dd></div>`, source });
  if (!set) return unavailable("Not imported");
  const compatibility = evaluateFutureProjectionCompatibility(set, snapshot);
  if (!compatibility.usable) return unavailable("Blocked", `<span>Blocked: ${escape(compatibility.errors.join(" "))}</span>`);
  const value = selectMappedFutureProjection(set, identityMap, playerId, snapshot.currentWeek);
  const labels = { "missing-mapping": "Unmapped", "missing-week": `Week ${snapshot.currentWeek} unavailable`, "identity-conflict": "Mapping conflict" };
  const shown = value.status === "ready" ? `${value.points.toFixed(1)} pts` : `<span class="missing">${labels[value.status] || "Unavailable"}</span>`;
  return { grid: `<div><dt>${escape(set.provider)} Week ${snapshot.currentWeek}</dt><dd>${shown}</dd></div>`, source: `<span>External: ${escape(set.provider)} · ${escape(set.scoringFormat)} · captured ${escape(new Date(set.capturedAt).toLocaleString())}</span>` };
}
