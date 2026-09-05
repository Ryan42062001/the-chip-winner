import { parseCsvRows } from "./fantasypros-manual-csv.js";
import { parseDynastyProcessWeeklyCsv } from "./dynastyprocess-weekly.js";

const ESPN_POSITION_ID = Object.freeze({ QB: 1, RB: 2, WR: 3, TE: 4, K: 5 });
const ESPN_PRO_TEAM_ID_BY_CODE = Object.freeze({
  ATL: 1, BUF: 2, CHI: 3, CIN: 4, CLE: 5, DAL: 6, DEN: 7, DET: 8,
  GB: 9, TEN: 10, IND: 11, KC: 12, LV: 13, LAR: 14, MIA: 15,
  MIN: 16, NE: 17, NO: 18, NYG: 19, NYJ: 20, PHI: 21, ARI: 22,
  PIT: 23, LAC: 24, SF: 25, SEA: 26, TB: 27, WSH: 28, WAS: 28,
  CAR: 29, JAX: 30, JAC: 30, BAL: 33, HOU: 34
});

// Reviewed 2026-09-05. These entries are classification-only exclusions; they
// never create an ESPN identity mapping. Add a row only after the source row is
// independently verified as stale/bad for the active season.
const REVIEWED_STALE_WEEKLY_PROVIDER_IDS = Object.freeze({
  "9019": "Historical Andrew Wellock record is not a current 2026 fantasy player."
});

const clean = (value) => String(value ?? "").replaceAll("\u00a0", " ").trim();
const normalizeName = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function increment(counts, key) {
  counts[key] = (counts[key] || 0) + 1;
}

function unwrapEspnPlayer(entry) {
  return entry?.player || entry?.playerPoolEntry?.player || entry || null;
}

function parseWeeklyDisplayRows(text) {
  const parsed = parseDynastyProcessWeeklyCsv(text);
  const csvRows = parseCsvRows(text);
  const headers = csvRows[0].map((value) => clean(value).toLowerCase());
  const idIndex = headers.indexOf("fantasypros_id");
  const nameIndex = headers.indexOf("player_name");
  const byProvider = new Map();
  for (let index = 1; index < csvRows.length; index += 1) {
    const providerPlayerId = clean(csvRows[index][idIndex]);
    if (providerPlayerId && !byProvider.has(providerPlayerId)) byProvider.set(providerPlayerId, clean(csvRows[index][nameIndex]));
  }
  return parsed.records.map((record) => Object.freeze({
    ...record,
    playerName: byProvider.get(record.providerPlayerId) || ""
  }));
}

export function parseEspnFantasyPlayerPool(payload) {
  const entries = Array.isArray(payload?.players) ? payload.players : Array.isArray(payload) ? payload : [];
  return Object.freeze(entries.map(unwrapEspnPlayer).filter((player) => player?.id != null && player?.fullName).map((player) => Object.freeze({
    id: String(player.id),
    fullName: clean(player.fullName),
    defaultPositionId: Number(player.defaultPositionId),
    proTeamId: Number(player.proTeamId),
    active: player.active === true
  })));
}

function classifyWithEspnPool(record, espnFantasyPlayers) {
  const expectedPositionId = ESPN_POSITION_ID[record.position];
  if (!Number.isInteger(expectedPositionId)) return { status: "stable-crosswalk-missing", candidateCount: 0 };

  // Composite display data is used only to explain why an already-unresolved
  // row remains excluded. It never creates, proposes, or persists an identity.
  const normalizedName = normalizeName(record.playerName);
  const candidates = espnFantasyPlayers.filter((player) =>
    player.defaultPositionId === expectedPositionId && normalizeName(player.fullName) === normalizedName
  );

  if (candidates.length === 0) return { status: "espn-fantasy-missing", candidateCount: 0 };
  if (candidates.length > 1) return { status: "espn-fantasy-ambiguous", candidateCount: candidates.length };

  const candidate = candidates[0];
  if (record.teamCode === "FA") {
    return candidate.proTeamId === 0
      ? { status: "espn-fantasy-free-agent-crosswalk-missing", candidateCount: 1, observedProTeamId: 0 }
      : { status: "weekly-source-team-stale", candidateCount: 1, observedProTeamId: candidate.proTeamId };
  }

  const expectedProTeamId = ESPN_PRO_TEAM_ID_BY_CODE[record.teamCode];
  if (!Number.isInteger(expectedProTeamId)) return { status: "weekly-source-team-unknown", candidateCount: 1, observedProTeamId: candidate.proTeamId };
  if (candidate.proTeamId === 0) return { status: "espn-fantasy-team-unassigned", candidateCount: 1, observedProTeamId: 0, expectedProTeamId };
  if (candidate.proTeamId === expectedProTeamId) return { status: "espn-fantasy-present-crosswalk-missing", candidateCount: 1, observedProTeamId: candidate.proTeamId, expectedProTeamId };
  return { status: "espn-fantasy-team-mismatch", candidateCount: 1, observedProTeamId: candidate.proTeamId, expectedProTeamId };
}

export function classifyDynastyProcessWeeklyGaps({ weeklyCsv, unresolvedProviderIds, espnFantasyPlayers = null }) {
  if (!Array.isArray(unresolvedProviderIds)) throw new TypeError("unresolvedProviderIds must be an array.");
  if (espnFantasyPlayers != null && !Array.isArray(espnFantasyPlayers)) throw new TypeError("espnFantasyPlayers must be an array when supplied.");

  const unresolved = new Set(unresolvedProviderIds.map((value) => clean(value)).filter(Boolean));
  const weeklyRecords = parseWeeklyDisplayRows(weeklyCsv);
  const rows = [];
  const counts = {};

  for (const record of weeklyRecords) {
    if (!unresolved.has(record.providerPlayerId)) continue;
    const staleReason = REVIEWED_STALE_WEEKLY_PROVIDER_IDS[record.providerPlayerId] || null;
    const classification = staleReason
      ? { status: "reviewed-stale-source-row", candidateCount: 0, reason: staleReason }
      : espnFantasyPlayers
        ? classifyWithEspnPool(record, espnFantasyPlayers)
        : { status: "stable-crosswalk-missing", candidateCount: 0 };

    increment(counts, classification.status);
    rows.push(Object.freeze({
      providerPlayerId: record.providerPlayerId,
      playerName: record.playerName,
      position: record.position,
      teamCode: record.teamCode,
      points: record.points,
      ...classification
    }));
  }

  const missingFromWeekly = [...unresolved].filter((providerPlayerId) => !rows.some((row) => row.providerPlayerId === providerPlayerId));
  if (missingFromWeekly.length) throw new Error(`Unresolved FantasyPros IDs were not present in supported weekly rows: ${missingFromWeekly.join(", ")}.`);

  return Object.freeze({
    method: espnFantasyPlayers
      ? "classification-only exact normalized display-name plus position check against ESPN Fantasy; never used for identity mapping"
      : "stable-ID evidence only; ESPN Fantasy diagnostic unavailable",
    espnFantasyPoolAvailable: Boolean(espnFantasyPlayers),
    unresolvedCount: rows.length,
    counts: Object.freeze({ ...counts }),
    rows: Object.freeze(rows)
  });
}
