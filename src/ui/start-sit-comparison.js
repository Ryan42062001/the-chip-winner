import { escapeHtml as escape } from "./manual-projection-dialog.js";
const confidence = (result) => result.confidence ? `<p class="comparison-confidence"><strong>${result.confidence.label} data confidence · ${result.confidence.score}% complete</strong>${result.confidence.limitations.length ? `<span>${escape(result.confidence.limitations.join(" "))}</span>` : ""}<small>This measures source completeness and freshness, not the chance a player succeeds.</small></p>` : "";

export function renderStartSitComparison(result) {
  if (result.status === "invalid") return `<div class="comparison-message neutral"><strong>Comparison unavailable</strong><span>${escape(result.reason)}</span></div>`;
  if (result.status === "missing") return `<div class="comparison-message neutral"><strong>No data-based preference</strong><span>${escape(result.reason)}</span>${confidence(result)}</div>`;
  const first = result.first.projection.toFixed(1); const second = result.second.projection.toFixed(1); let body;
  if (result.status === "tossup") body = `<div class="comparison-result-grid"><div><strong>${escape(result.first.name)}</strong><b>${first}</b></div><div class="verdict neutral"><small>NEAR TIE</small><strong>${Math.abs(result.difference).toFixed(1)} pt apart</strong><span>${escape(result.reason)}</span></div><div><strong>${escape(result.second.name)}</strong><b>${second}</b></div></div>`;
  else body = `<div class="comparison-result-grid"><div class="${result.preferred.id === result.first.id ? "preferred" : ""}"><strong>${escape(result.first.name)}</strong><b>${first}</b></div><div class="verdict"><small>PROJECTION LEAN</small><strong>${escape(result.preferred.name)}</strong><span>${Math.abs(result.difference).toFixed(1)} projected points</span></div><div class="${result.preferred.id === result.second.id ? "preferred" : ""}"><strong>${escape(result.second.name)}</strong><b>${second}</b></div></div>`;
  return body + confidence(result);
}
