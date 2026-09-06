import { escapeHtml as escape } from "./manual-projection-dialog.js";
import { evaluateFutureProjectionCompatibility, selectMappedFutureProjection } from "../providers/projections/future-projection-provider.js";
const confidence = (result) => {
if (!result.confidence) return "";
const completeness = result.confidence.completenessScore ?? result.confidence.score;
const freshness = result.confidence.freshness ? `Snapshot freshness: ${result.confidence.freshness}.` : "";
const nonFreshnessLimitations = result.confidence.limitations.filter((item) => !/^Snapshot (?:is |freshness )/i.test(item));
const detail = [freshness, ...nonFreshnessLimitations].filter(Boolean).join(" ");
return `<p class="comparison-confidence"><strong>${result.confidence.label} data confidence · ${completeness}% complete</strong>${detail ? `<span>${escape(detail)}</span>` : ""}<small>This measures source completeness and freshness, not the chance a player succeeds.</small></p>`;
};
function external(result, set, identityMap, snapshot) {
if (!set) return '<p class="external-comparison"><strong>External source</strong><span>Not imported</span></p>';
const compatibility = evaluateFutureProjectionCompatibility(set, snapshot); if (!compatibility.usable) return `<p class="external-comparison"><strong>${escape(set.provider)}</strong><span>Blocked: ${escape(compatibility.errors.join(" "))}</span></p>`;
const first = selectMappedFutureProjection(set, identityMap, result.first.id, snapshot.currentWeek); const second = selectMappedFutureProjection(set, identityMap, result.second.id, snapshot.currentWeek);
if (first.status !== "ready" || second.status !== "ready") return `<p class="external-comparison"><strong>${escape(set.provider)} · Week ${snapshot.currentWeek}</strong><span>Comparison withheld · ${first.status !== "ready" ? `${escape(result.first.name)} ${escape(first.status)}` : `${escape(result.second.name)} ${escape(second.status)}`}</span></p>`;
const difference = +(first.points - second.points).toFixed(1); const verdict = Math.abs(difference) < 1 ? "Near tie" : `Leans ${escape(difference > 0 ? result.first.name : result.second.name)}`;
return `<p class="external-comparison"><strong>${escape(set.provider)} · Week ${snapshot.currentWeek} · ${escape(set.scoringFormat)}</strong><span>${escape(result.first.name)} ${first.points.toFixed(1)} vs ${escape(result.second.name)} ${second.points.toFixed(1)} · ${verdict} (${Math.abs(difference).toFixed(1)} pts)</span></p>`;
}
export function renderStartSitComparison(result, set = null, identityMap = null, snapshot = null) {
if (result.status === "invalid") return `<div class="comparison-message neutral"><strong>Comparison unavailable</strong><span>${escape(result.reason)}</span></div>`;
if (result.status === "missing") return `<div class="comparison-message neutral"><strong>No ESPN projection preference</strong><span>${escape(result.reason)}</span>${confidence(result)}${external(result, set, identityMap, snapshot)}</div>`;
const first = result.first.projection.toFixed(1); const second = result.second.projection.toFixed(1); let body;
if (result.status === "tossup") body = `<div class="comparison-result-grid"><div><strong>${escape(result.first.name)}</strong><b>${first}</b></div><div class="verdict neutral"><small>NEAR TIE</small><strong>${Math.abs(result.difference).toFixed(1)} pt apart</strong><span>${escape(result.reason)}</span></div><div><strong>${escape(result.second.name)}</strong><b>${second}</b></div></div>`;
else body = `<div class="comparison-result-grid"><div class="${result.preferred.id === result.first.id ? "preferred" : ""}"><strong>${escape(result.first.name)}</strong><b>${first}</b></div><div class="verdict"><small>PROJECTION LEAN</small><strong>${escape(result.preferred.name)}</strong><span>${Math.abs(result.difference).toFixed(1)} projected points</span></div><div class="${result.preferred.id === result.second.id ? "preferred" : ""}"><strong>${escape(result.second.name)}</strong><b>${second}</b></div></div>`;
return body + confidence(result) + external(result, set, identityMap, snapshot);
}
