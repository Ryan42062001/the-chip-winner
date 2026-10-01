export const FANTASYCALC_SOURCE_ID = "fantasycalc-manual-redraft";
export const FANTASYCALC_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const PPR_VALUES = Object.freeze({ STANDARD: 0, HALF_PPR: 0.5, PPR: 1 });
const SUPPORTED_ASSETS = new Set(["QB", "RB", "WR", "TE"]);

function espnPpr(league) {
  const value = league?.receptionScoring?.pointsPerReception;
  if (Number.isFinite(value) && [0, 0.5, 1].includes(value)) return value;
  return null;
}

function espnQbFormat(league) {
  if (!Array.isArray(league?.lineupSlots) || !league.lineupSlots.length) return null;
  const qb = league.lineupSlots.find((slot) => slot.slot === "QB")?.count;
  const op = league.lineupSlots.find((slot) => slot.slot === "OP")?.count || 0;
  if (!Number.isInteger(qb) || qb < 1 || !Number.isInteger(op) || op < 0) return null;
  if (league.lineupSlots.some((slot) => !Number.isInteger(slot.count) || slot.count < 0 || String(slot.slot).startsWith("ESPN_SLOT_"))) return null;
  return qb > 1 || op > 0 ? "SUPERFLEX" : "1QB";
}

export function fantasyCalcProfileReasons(source, snapshot, assetIds) {
  const profile = source?.profile || {};
  const league = snapshot?.league || {};
  const reasons = [];
  if (source?.sourceId !== FANTASYCALC_SOURCE_ID || source?.acquisitionMode !== "MANUAL_LOCAL"
    || profile.provider !== "FantasyCalc" || profile.mode !== "REDRAFT") reasons.push("FANTASYCALC_MANUAL_PROFILE_INVALID");
  const ppr = espnPpr(league);
  if (ppr === null) reasons.push("ESPN_PPR_PROFILE_UNRESOLVED");
  if (!Object.hasOwn(PPR_VALUES, profile.ppr) || (ppr !== null && PPR_VALUES[profile.ppr] !== ppr)) reasons.push("PPR_PROFILE_INCOMPATIBLE");
  const qb = espnQbFormat(league);
  if (!qb) reasons.push("ESPN_QB_PROFILE_UNRESOLVED");
  if (!["1QB", "SUPERFLEX"].includes(profile.qbFormat) || (qb && profile.qbFormat !== qb)) reasons.push("QB_PROFILE_INCOMPATIBLE");
  if (typeof league.tePremium !== "boolean") reasons.push("ESPN_TE_PREMIUM_UNRESOLVED");
  if (typeof profile.tePremium !== "boolean" || (typeof league.tePremium === "boolean" && profile.tePremium !== league.tePremium)) reasons.push("TE_PREMIUM_INCOMPATIBLE");
  const teamCount = Array.isArray(snapshot?.teams) ? snapshot.teams.length : null;
  if (!Number.isInteger(teamCount) || teamCount < 2 || !Number.isInteger(profile.teamCount) || profile.teamCount !== teamCount) reasons.push("TEAM_COUNT_INCOMPATIBLE");
  if (!Number.isInteger(league.season) || source?.league?.season !== league.season || source?.league?.scoringType !== league.scoringType) reasons.push("LEAGUE_PROFILE_INCOMPATIBLE");
  if (!Array.isArray(assetIds) || assetIds.some((id) => {
    const player = snapshot?.players?.find((item) => item.id === id);
    return !player || !SUPPORTED_ASSETS.has(player.position);
  })) reasons.push("UNSUPPORTED_FANTASYCALC_ASSET");
  if (!source?.version || !source?.asOf || !source?.values || typeof source.values !== "object") reasons.push("CAPTURE_INCOMPLETE");
  return [...new Set(reasons)];
}

export function createFantasyCalcManualSource(snapshot, capture) {
  const profile = capture?.profile || {};
  const profileKey = JSON.stringify([profile.teamCount, profile.ppr, profile.qbFormat, profile.tePremium]);
  const values = Object.create(null);
  for (const [id, record] of Object.entries(capture?.values || {})) {
    values[id] = {
      status: "READY", value: record?.value,
      sourceId: FANTASYCALC_SOURCE_ID,
      sourceVersion: record?.sessionId,
      asOf: record?.asOf,
      unit: "fantasycalc-market-value",
      profileKey: record?.profileKey
    };
  }
  return {
    sourceId: FANTASYCALC_SOURCE_ID,
    version: capture?.sessionId || "",
    asOf: capture?.asOf || "",
    unit: "fantasycalc-market-value",
    acquisitionMode: "MANUAL_LOCAL",
    mode: "REDRAFT",
    profile: { provider: "FantasyCalc", mode: "REDRAFT", ...profile },
    profileKey,
    league: {
      season: snapshot?.league?.season,
      scoringType: snapshot?.league?.scoringType,
      teamCount: profile.teamCount
    },
    authority: { managerApproved: true, trustedConfiguration: true, independentEvidenceApproved: false },
    provenance: { independenceGroup: "fantasycalc-market", derivativeOf: null },
    additive: true,
    maxAgeMs: FANTASYCALC_MAX_AGE_MS,
    values,
    primary: true
  };
}
