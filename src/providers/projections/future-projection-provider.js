export function normalizeFutureProjectionSet(input) {
  const errors = [];
  if (!input || typeof input !== "object") return { valid: false, errors: ["Projection set must be an object."] };
  if (typeof input.provider !== "string" || !input.provider.trim()) errors.push("provider is required.");
  if (typeof input.scoringFormat !== "string" || !input.scoringFormat.trim()) errors.push("scoringFormat is required.");
  if (!Number.isInteger(input.season)) errors.push("season must be an integer.");
  if (!input.capturedAt || !Number.isFinite(Date.parse(input.capturedAt))) errors.push("capturedAt must be an ISO date-time.");
  if (!Array.isArray(input.projections)) errors.push("projections must be an array.");
  const records = [];
  for (const [index, item] of (input.projections || []).entries()) {
    if (typeof item?.providerPlayerId !== "string" || !item.providerPlayerId.trim()) { errors.push(`Projection ${index} requires providerPlayerId.`); continue; }
    if (!Number.isInteger(item.week) || item.week < 1 || item.week > 18) { errors.push(`Projection ${index} has an invalid week.`); continue; }
    if (!Number.isFinite(item.points) || item.points < 0) { errors.push(`Projection ${index} has invalid points.`); continue; }
    records.push(Object.freeze({ providerPlayerId: item.providerPlayerId, week: item.week, points: item.points }));
  }
  if (errors.length) return { valid: false, errors, value: null };
  return { valid: true, errors: [], value: Object.freeze({ provider: input.provider, scoringFormat: input.scoringFormat, season: input.season, capturedAt: input.capturedAt, projections: Object.freeze(records) }) };
}

export function indexFutureProjections(set) {
  const index = new Map();
  for (const item of set.projections) index.set(`${item.providerPlayerId}:${item.week}`, item.points);
  return index;
}
