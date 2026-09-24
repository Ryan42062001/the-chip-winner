export const PRODUCTION_TRADE_VALUE_SOURCES = Object.freeze([]);

function freezeList(items) { return Object.freeze(items); }
function normalizedText(value) { return typeof value === "string" ? value.trim() : ""; }

function assetRecord(raw) {
  if (typeof raw === "number") return { status: "READY", value: raw };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { status: "MISSING", value: null };
  return {
    status: normalizedText(raw.status || "READY").toUpperCase(),
    value: raw.value,
    sourceId: raw.sourceId ?? null,
    sourceVersion: raw.sourceVersion ?? null,
    asOf: raw.asOf ?? null,
    unit: raw.unit ?? null
  };
}

function sourceMetadataMismatch(record, source) {
  return (record.sourceId != null && record.sourceId !== source.sourceId)
    || (record.sourceVersion != null && record.sourceVersion !== source.version)
    || (record.asOf != null && record.asOf !== source.asOf)
    || (record.unit != null && record.unit !== source.unit);
}

export function inspectTradeValueSource(source, snapshot, assetIds, { now = Date.now() } = {}) {
  const reasons = [];
  const sourceId = normalizedText(source?.sourceId);
  const version = normalizedText(source?.version);
  const unit = normalizedText(source?.unit);
  const asOf = normalizedText(source?.asOf);
  const mode = normalizedText(source?.mode).toUpperCase();
  const league = source?.league && typeof source.league === "object" ? source.league : {};
  const authority = source?.authority && typeof source.authority === "object" ? source.authority : {};
  const provenance = source?.provenance && typeof source.provenance === "object" ? source.provenance : {};
  const managerApproved = authority.managerApproved === true && authority.trustedConfiguration === true;
  const independenceGroup = normalizedText(provenance.independenceGroup);
  const independentEvidenceApproved = authority.independentEvidenceApproved === true;
  const additive = source?.additive === true;

  if (!sourceId) reasons.push("SOURCE_ID_MISSING");
  if (!version) reasons.push("SOURCE_VERSION_MISSING");
  if (!unit) reasons.push("UNIT_MISSING");
  if (!asOf) reasons.push("AS_OF_MISSING");
  if (!managerApproved) reasons.push("SOURCE_NOT_MANAGER_APPROVED");
  if (!additive) reasons.push("SOURCE_NOT_ADDITIVE");
  if (mode !== "REDRAFT") reasons.push("MODE_INCOMPATIBLE");

  const snapshotSeason = snapshot?.league?.season;
  const sourceSeason = league.season;
  if (snapshotSeason != null && sourceSeason !== snapshotSeason) reasons.push("SEASON_INCOMPATIBLE");

  const snapshotScoring = normalizedText(snapshot?.league?.scoringType).toUpperCase();
  const sourceScoring = normalizedText(league.scoringType).toUpperCase();
  if (!snapshotScoring || !sourceScoring || snapshotScoring !== sourceScoring) reasons.push("SCORING_INCOMPATIBLE");

  const teamCount = Array.isArray(snapshot?.teams) ? snapshot.teams.length : null;
  if (league.teamCount != null && teamCount != null && Number(league.teamCount) !== teamCount) reasons.push("LEAGUE_SIZE_INCOMPATIBLE");

  const asOfMs = Date.parse(asOf);
  const maxAgeMs = Number(source?.maxAgeMs);
  let freshness = { status: "INVALID", ageMs: null, maxAgeMs: Number.isFinite(maxAgeMs) ? maxAgeMs : null };
  if (!Number.isFinite(asOfMs) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) {
    reasons.push("FRESHNESS_POLICY_INVALID");
  } else {
    const ageMs = Math.max(0, Number(now) - asOfMs);
    freshness = { status: ageMs <= maxAgeMs ? "FRESH" : "STALE", ageMs, maxAgeMs };
    if (ageMs > maxAgeMs) reasons.push("SOURCE_STALE");
  }

  const values = new Map();
  const missingPlayerIds = [];
  const ambiguousPlayerIds = [];
  const errorPlayerIds = [];
  const invalidValuePlayerIds = [];
  const mixedMetadataPlayerIds = [];

  for (const playerId of [...new Set(Array.isArray(assetIds) ? assetIds : [])].sort()) {
    const record = assetRecord(source?.values?.[playerId]);
    if (record.status === "MISSING") {
      missingPlayerIds.push(playerId);
      continue;
    }
    if (record.status === "AMBIGUOUS") {
      ambiguousPlayerIds.push(playerId);
      continue;
    }
    if (record.status !== "READY") {
      errorPlayerIds.push(playerId);
      continue;
    }
    if (sourceMetadataMismatch(record, { sourceId, version, asOf, unit })) {
      mixedMetadataPlayerIds.push(playerId);
      continue;
    }
    if (!Number.isFinite(record.value) || record.value < 0) {
      invalidValuePlayerIds.push(playerId);
      continue;
    }
    values.set(playerId, record.value);
  }

  if (missingPlayerIds.length) reasons.push("ASSET_VALUE_MISSING");
  if (ambiguousPlayerIds.length) reasons.push("ASSET_MAPPING_AMBIGUOUS");
  if (errorPlayerIds.length) reasons.push("ASSET_VALUE_ERROR");
  if (invalidValuePlayerIds.length) reasons.push("ASSET_VALUE_INVALID");
  if (mixedMetadataPlayerIds.length) reasons.push("MIXED_SOURCE_SETTINGS_OR_VINTAGE");

  const compatibility = {
    status: reasons.some((reason) => reason.endsWith("INCOMPATIBLE")) ? "INCOMPATIBLE" : "COMPATIBLE",
    mode: mode || null,
    leagueSeason: sourceSeason ?? null,
    scoringType: sourceScoring || null,
    teamCount: league.teamCount ?? null
  };

  return Object.freeze({
    status: reasons.length ? "WITHHELD" : "READY",
    sourceId: sourceId || null,
    sourceVersion: version || null,
    asOf: asOf || null,
    unit: unit || null,
    primary: source?.primary === true,
    additive,
    authority: Object.freeze({
      managerApproved,
      trustedConfiguration: authority.trustedConfiguration === true,
      independentEvidenceApproved
    }),
    provenance: Object.freeze({
      independenceGroup: independenceGroup || null,
      derivativeOf: normalizedText(provenance.derivativeOf) || null
    }),
    freshness: Object.freeze(freshness),
    compatibility: Object.freeze(compatibility),
    values,
    missingPlayerIds: freezeList(missingPlayerIds),
    ambiguousPlayerIds: freezeList(ambiguousPlayerIds),
    errorPlayerIds: freezeList(errorPlayerIds),
    invalidValuePlayerIds: freezeList(invalidValuePlayerIds),
    mixedMetadataPlayerIds: freezeList(mixedMetadataPlayerIds),
    reasons: freezeList([...new Set(reasons)])
  });
}

export function createSyntheticApprovedTradeValueSource({
  sourceId = "synthetic-approved-fixture",
  version = "test-v1",
  asOf = "2026-09-19T12:00:00Z",
  unit = "synthetic-trade-units",
  season = 2026,
  scoringType = "PPR",
  teamCount = null,
  maxAgeMs = 7 * 24 * 60 * 60 * 1000,
  values = {},
  primary = true,
  independenceGroup = sourceId,
  independentEvidenceApproved = true,
  provenance = {},
  ...overrides
} = {}) {
  return Object.freeze({
    sourceId,
    version,
    asOf,
    unit,
    mode: "REDRAFT",
    league: Object.freeze({ season, scoringType, ...(teamCount == null ? {} : { teamCount }) }),
    authority: Object.freeze({ managerApproved: true, trustedConfiguration: true, independentEvidenceApproved }),
    provenance: Object.freeze({
      independenceGroup,
      derivativeOf: provenance.derivativeOf || null,
      ...provenance
    }),
    additive: true,
    maxAgeMs,
    values: Object.freeze({ ...values }),
    primary,
    ...overrides
  });
}
