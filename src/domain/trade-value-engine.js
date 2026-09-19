import { inspectTradeValueSource, PRODUCTION_TRADE_VALUE_SOURCES } from "./trade-value-source.js";

const FAIRNESS_LOWER = 45;
const FAIRNESS_UPPER = 55;

function freezeList(items) { return Object.freeze(items); }
function round1(value) { return Number.isFinite(value) ? Math.round(value * 10) / 10 : null; }

export function classifyTradeValueShare(incomingSharePct) {
  if (!Number.isFinite(incomingSharePct)) return "WITHHELD";
  if (incomingSharePct > FAIRNESS_UPPER) return "YOU_WIN";
  if (incomingSharePct < FAIRNESS_LOWER) return "THEY_WIN";
  return "FAIR_TRADE";
}

export function withheldPackageValue(reason, sourceResults = []) {
  return Object.freeze({
    status: "WITHHELD",
    basis: "ABSTRACT_ASSET_VALUE",
    sourceId: null,
    sourceVersion: null,
    asOf: null,
    unit: null,
    incomingTotal: null,
    outgoingTotal: null,
    incomingShare: null,
    outgoingShare: null,
    displayedSplit: null,
    fairnessBand: Object.freeze({ inclusiveLower: FAIRNESS_LOWER, inclusiveUpper: FAIRNESS_UPPER }),
    winner: "WITHHELD",
    sourceResults: freezeList(sourceResults),
    reasons: freezeList([reason]),
    relativeValueIsProbability: false
  });
}

function evaluateReadySource(inspected, outgoingIds, incomingIds) {
  const outgoingTotal = outgoingIds.reduce((sum, id) => sum + inspected.values.get(id), 0);
  const incomingTotal = incomingIds.reduce((sum, id) => sum + inspected.values.get(id), 0);
  const total = outgoingTotal + incomingTotal;
  if (!Number.isFinite(total) || total <= 0) {
    return Object.freeze({
      status: "WITHHELD",
      sourceId: inspected.sourceId,
      sourceVersion: inspected.sourceVersion,
      asOf: inspected.asOf,
      unit: inspected.unit,
      incomingTotal: null,
      outgoingTotal: null,
      incomingShare: null,
      outgoingShare: null,
      displayedSplit: null,
      winner: "WITHHELD",
      primary: inspected.primary,
      reasons: freezeList(["TOTAL_VALUE_NOT_POSITIVE"])
    });
  }
  const incomingShare = 100 * incomingTotal / total;
  const outgoingShare = 100 - incomingShare;
  const winner = classifyTradeValueShare(incomingShare);
  const displayIncoming = Math.round(incomingShare);
  const displayOutgoing = 100 - displayIncoming;
  const roundedLooksFair = displayIncoming >= FAIRNESS_LOWER && displayIncoming <= FAIRNESS_UPPER;
  const exactLooksFair = winner === "FAIR_TRADE";
  return Object.freeze({
    status: "READY",
    sourceId: inspected.sourceId,
    sourceVersion: inspected.sourceVersion,
    asOf: inspected.asOf,
    unit: inspected.unit,
    incomingTotal,
    outgoingTotal,
    incomingShare,
    outgoingShare,
    displayedSplit: Object.freeze({
      incoming: displayIncoming,
      outgoing: displayOutgoing,
      label: `${displayIncoming}/${displayOutgoing}`,
      nearFairnessBoundary: roundedLooksFair !== exactLooksFair
    }),
    winner,
    primary: inspected.primary,
    reasons: freezeList([])
  });
}

export function evaluatePackageValue({
  snapshot,
  outgoingPlayerIds = [],
  incomingPlayerIds = [],
  sources = PRODUCTION_TRADE_VALUE_SOURCES,
  now = Date.now()
} = {}) {
  const normalizedSources = Array.isArray(sources) ? sources : [];
  if (!normalizedSources.length) {
    return withheldPackageValue("NO_APPROVED_COMPARABLE_VALUE_SOURCE");
  }

  const assetIds = [...new Set([...outgoingPlayerIds, ...incomingPlayerIds])];
  const sourceResults = normalizedSources
    .map((source) => {
      const inspected = inspectTradeValueSource(source, snapshot, assetIds, { now });
      if (inspected.status !== "READY") {
        return Object.freeze({
          status: "WITHHELD",
          sourceId: inspected.sourceId,
          sourceVersion: inspected.sourceVersion,
          asOf: inspected.asOf,
          unit: inspected.unit,
          incomingTotal: null,
          outgoingTotal: null,
          incomingShare: null,
          outgoingShare: null,
          displayedSplit: null,
          winner: "WITHHELD",
          primary: inspected.primary,
          freshness: inspected.freshness,
          compatibility: inspected.compatibility,
          authority: inspected.authority,
          provenance: inspected.provenance,
          missingPlayerIds: inspected.missingPlayerIds,
          ambiguousPlayerIds: inspected.ambiguousPlayerIds,
          errorPlayerIds: inspected.errorPlayerIds,
          invalidValuePlayerIds: inspected.invalidValuePlayerIds,
          mixedMetadataPlayerIds: inspected.mixedMetadataPlayerIds,
          reasons: inspected.reasons
        });
      }
      const evaluated = evaluateReadySource(inspected, outgoingPlayerIds, incomingPlayerIds);
      return Object.freeze({
        ...evaluated,
        freshness: inspected.freshness,
        compatibility: inspected.compatibility,
        authority: inspected.authority,
        provenance: inspected.provenance,
        missingPlayerIds: freezeList([]),
        ambiguousPlayerIds: freezeList([]),
        errorPlayerIds: freezeList([]),
        invalidValuePlayerIds: freezeList([]),
        mixedMetadataPlayerIds: freezeList([])
      });
    })
    .sort((a, b) => String(a.sourceId || "").localeCompare(String(b.sourceId || "")));

  const blocked = sourceResults.filter((result) => result.status !== "READY");
  if (blocked.length) {
    return Object.freeze({
      ...withheldPackageValue("PACKAGE_VALUE_SOURCE_GATE_FAILED", sourceResults),
      reasons: freezeList(["PACKAGE_VALUE_SOURCE_GATE_FAILED", ...new Set(blocked.flatMap((result) => result.reasons || []))])
    });
  }

  const winners = new Set(sourceResults.map((result) => result.winner));
  if (winners.size > 1) {
    return Object.freeze({
      status: "SOURCE_DISAGREEMENT",
      basis: "ABSTRACT_ASSET_VALUE",
      sourceId: null,
      sourceVersion: null,
      asOf: null,
      unit: null,
      incomingTotal: null,
      outgoingTotal: null,
      incomingShare: null,
      outgoingShare: null,
      displayedSplit: null,
      fairnessBand: Object.freeze({ inclusiveLower: FAIRNESS_LOWER, inclusiveUpper: FAIRNESS_UPPER }),
      winner: "WITHHELD",
      sourceResults: freezeList(sourceResults),
      reasons: freezeList(["APPROVED_VALUE_SOURCES_DISAGREE"]),
      relativeValueIsProbability: false
    });
  }

  let primary;
  if (sourceResults.length === 1) {
    primary = sourceResults[0];
  } else {
    const primaries = sourceResults.filter((result) => result.primary);
    if (primaries.length !== 1) {
      return Object.freeze({
        ...withheldPackageValue("DESIGNATED_PRIMARY_SOURCE_REQUIRED", sourceResults),
        reasons: freezeList(["DESIGNATED_PRIMARY_SOURCE_REQUIRED"])
      });
    }
    primary = primaries[0];
  }

  return Object.freeze({
    status: "READY",
    basis: "ABSTRACT_ASSET_VALUE",
    sourceId: primary.sourceId,
    sourceVersion: primary.sourceVersion,
    asOf: primary.asOf,
    unit: primary.unit,
    incomingTotal: primary.incomingTotal,
    outgoingTotal: primary.outgoingTotal,
    incomingShare: primary.incomingShare,
    outgoingShare: primary.outgoingShare,
    displayedSplit: primary.displayedSplit,
    fairnessBand: Object.freeze({ inclusiveLower: FAIRNESS_LOWER, inclusiveUpper: FAIRNESS_UPPER }),
    winner: primary.winner,
    sourceResults: freezeList(sourceResults),
    reasons: freezeList([]),
    relativeValueIsProbability: false
  });
}

function resolveIndependentPackageRoots(rows) {
  const sourceById = new Map();
  const duplicates = new Set();
  for (const row of rows) {
    const id = typeof row?.sourceId === "string" ? row.sourceId.trim() : "";
    if (!id) continue;
    if (sourceById.has(id)) duplicates.add(id);
    else sourceById.set(id, row);
  }
  let uncertain = duplicates.size > 0;
  let contradictory = false;
  const resolvedGroups = new Set();

  const resolve = (row, visiting = new Set()) => {
    const id = typeof row?.sourceId === "string" ? row.sourceId.trim() : "";
    const group = typeof row?.provenance?.independenceGroup === "string"
      ? row.provenance.independenceGroup.trim() : "";
    if (!id || !group || duplicates.has(id) || visiting.has(id)) {
      uncertain = true;
      return null;
    }
    const authorized = row?.authority?.managerApproved === true
      && row.authority.trustedConfiguration === true
      && row.authority.independentEvidenceApproved === true;
    if (!authorized) return null;
    const derivative = typeof row?.provenance?.derivativeOf === "string"
      ? row.provenance.derivativeOf.trim() : "";
    if (!derivative) return { sourceId: id, group };
    const parent = sourceById.get(derivative);
    if (!parent) {
      uncertain = true;
      return null;
    }
    const next = new Set(visiting);
    next.add(id);
    const root = resolve(parent, next);
    if (root && group !== root.group) contradictory = true;
    return root;
  };

  for (const row of rows) {
    const root = resolve(row);
    if (root) resolvedGroups.add(root.group);
  }
  return Object.freeze({
    independentEvidenceGroups: freezeList([...resolvedGroups].sort()),
    fullyVerified: !uncertain && !contradictory
  });
}

export function packageValueConfidence(packageValue) {
  if (!packageValue || packageValue.status !== "READY") {
    return Object.freeze({
      claimConfidence: "WITHHELD",
      evidenceState: packageValue?.status || "WITHHELD",
      coverage: "INCOMPLETE_OR_UNAVAILABLE",
      freshness: "UNVERIFIED",
      identity: "UNVERIFIED",
      comparability: "UNVERIFIED",
      independentEvidenceGroups: freezeList([]),
      limitations: freezeList(packageValue?.reasons || ["NO_APPROVED_COMPARABLE_VALUE_SOURCE"])
    });
  }

  const rows = Array.isArray(packageValue.sourceResults) ? packageValue.sourceResults : [];
  const units = new Set(rows.map((row) => row.unit));
  const comparableAgreement = rows.length > 0
    && units.size === 1
    && units.has(packageValue.unit)
    && rows.every((row) => row.status === "READY" && row.winner === packageValue.winner);
  const provenance = resolveIndependentPackageRoots(rows);
  const genuinelyIndependentAgreement = comparableAgreement
    && provenance.fullyVerified
    && provenance.independentEvidenceGroups.length >= 2;

  return Object.freeze({
    claimConfidence: genuinelyIndependentAgreement ? "HIGH" : "MODERATE",
    evidenceState: "COMPLETE",
    coverage: "COMPLETE_PACKAGE",
    freshness: "VERIFIED",
    identity: "EXACT_ESPN_PLAYER_ID",
    comparability: comparableAgreement ? "COMMON_ADDITIVE_ASSET_UNIT" : "UNVERIFIED",
    independentEvidenceGroups: provenance.independentEvidenceGroups,
    limitations: freezeList([
      genuinelyIndependentAgreement
        ? "At least two verified, Manager-authorized independent source roots agree on the same package claim and unit."
        : "Package confidence is capped at MODERATE: provenance may be dependent, contradictory or incomplete, or independent same-scale corroboration is insufficient.",
      "Relative package asset value is not win probability, future-performance probability, or acceptance probability."
    ])
  });
}

export const TRADE_VALUE_FAIRNESS = Object.freeze({
  inclusiveLower: FAIRNESS_LOWER,
  inclusiveUpper: FAIRNESS_UPPER
});
