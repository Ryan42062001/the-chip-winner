function projectionKey(record) { return `${record.providerPlayerId}:${record.week}`; }
export function summarizeProjectionImport(current, incoming) {
const existing = new Map((current?.projections || []).map((record) => [projectionKey(record), record]));
const counts = { added: 0, updated: 0, retained: 0, ignoredOlder: 0, conflicting: 0 };
const byWeek = new Map();
for (const record of incoming.projections) {
const prior = existing.get(projectionKey(record));
const incomingTime = Date.parse(record.capturedAt); const priorTime = prior ? Date.parse(prior.capturedAt) : null;
let outcome = "added";
if (prior && incomingTime > priorTime) outcome = "updated";
else if (prior && incomingTime < priorTime) outcome = "ignoredOlder";
else if (prior && record.points === prior.points) outcome = "retained";
else if (prior) outcome = "conflicting";
counts[outcome] += 1;
const week = byWeek.get(record.week) || { week: record.week, added: 0, updated: 0, retained: 0, ignoredOlder: 0, conflicting: 0, captures: [] };
week[outcome] += 1; week.captures.push(record.capturedAt); byWeek.set(record.week, week);
}
const captures = incoming.projections.map((record) => record.capturedAt).sort((a, b) => Date.parse(a) - Date.parse(b));
const weeks = [...byWeek.values()].sort((a, b) => a.week - b.week).map((week) => {
const sorted = week.captures.sort((a, b) => Date.parse(a) - Date.parse(b));
return Object.freeze({ week: week.week, added: week.added, updated: week.updated, retained: week.retained, ignoredOlder: week.ignoredOlder, conflicting: week.conflicting, captureStart: sorted[0], captureEnd: sorted.at(-1) });
});
return Object.freeze({ ...counts, captureStart: captures[0] || null, captureEnd: captures.at(-1) || null, weeks: Object.freeze(weeks) });
}
export function preflightProjectionImport({ projectionProvider, identityProvider, projectionsCsv, identityMapCsv }) {
const current = projectionProvider.readCache(); const incoming = parseFutureProjectionCsv(projectionsCsv);
const summary = summarizeProjectionImport(current, incoming);
if (summary.conflicting) { const error = new Error(`${summary.conflicting} projection record conflict at an equal capture time.`); error.summary = summary; throw error; }
const projection = projectionProvider.preflightMergeCsv(projectionsCsv);
const identity = identityProvider.preflightMergeCsv(identityMapCsv);
return Object.freeze({ projection, identity, summary });
}
export function commitProjectionImport({ projectionProvider, identityProvider }, prepared) {
try {
const projectionSet = projectionProvider.saveCache(prepared.projection.merged);
const identityMap = identityProvider.saveCache(prepared.identity.merged);
return Object.freeze({ projectionSet, identityMap, summary: prepared.summary });
} catch (error) {
if (prepared.projection.current) projectionProvider.saveCache(prepared.projection.current); else projectionProvider.clearCache();
if (prepared.identity.current) identityProvider.saveCache(prepared.identity.current); else identityProvider.clearCache();
throw error;
}
}
export function importProjectionBundle(options) { return commitProjectionImport(options, preflightProjectionImport(options)); }
import { parseFutureProjectionCsv } from "../providers/projections/future-projection-provider.js";
