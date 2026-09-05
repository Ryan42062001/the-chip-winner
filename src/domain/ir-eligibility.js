const NEW_IR_ELIGIBLE_STATUSES = Object.freeze(new Set(["OUT", "INJURED_RESERVE"]));
const GRANDFATHERED_IR_STATUSES = Object.freeze(new Set(["QUESTIONABLE", "DOUBTFUL"]));
const KNOWN_IR_INELIGIBLE_STATUSES = Object.freeze(new Set(["ACTIVE", "SUSPENSION"]));
const ESPN_PUP_STATUS = "PHYSICALLY_UNABLE_TO_PERFORM";

export const ESPN_IR_POLICY = Object.freeze({
  provider: "ESPN Fantasy Football",
  reviewedAt: "2026-09-05",
  supportUpdatedAt: "2026-08-18",
  newlyEligibleStatuses: Object.freeze(["OUT", "INJURED_RESERVE"]),
  grandfatheredWhileAlreadyInIr: Object.freeze(["QUESTIONABLE", "DOUBTFUL"]),
  sourceNote: "ESPN support says only OUT or IR fantasy tags prove a new IR placement; Q/D players already in IR may remain; suspended players are not IR-eligible. NFL PUP is not separately inferred because ESPN may surface that real-world status through an OUT/IR fantasy tag."
});

function freezeResult(result) {
  return Object.freeze(result);
}

function normalizedStatus(player) {
  return player?.injury?.status ?? null;
}

function statusLabel(status) {
  return status ? status.toLowerCase().replaceAll("_", " ") : "no injury designation";
}

export function evaluatePlayerIrEligibility(player, lineupSlot = null) {
  const status = normalizedStatus(player);
  const inIr = lineupSlot === "IR";

  if (status === "UNKNOWN") {
    return freezeResult({
      status: "unverified",
      injuryStatus: status,
      canMoveToIr: null,
      canRemainInIr: inIr ? null : false,
      reason: `ESPN supplied an unsupported injury designation${player?.injury?.sourceStatus ? ` (${player.injury.sourceStatus})` : ""}, so IR eligibility is not inferred.`
    });
  }

  if (NEW_IR_ELIGIBLE_STATUSES.has(status)) {
    return freezeResult({
      status: "eligible",
      injuryStatus: status,
      canMoveToIr: true,
      canRemainInIr: true,
      reason: `ESPN reports ${statusLabel(status)}; current ESPN Fantasy Football policy allows this designation in IR.`
    });
  }

  if (status === ESPN_PUP_STATUS) {
    return freezeResult({
      status: "unverified",
      injuryStatus: status,
      canMoveToIr: null,
      canRemainInIr: inIr ? null : false,
      reason: "ESPN reports physically unable to perform. ESPN Fantasy support proves new IR placement from the fantasy OUT/IR tag rather than the NFL PUP label itself, so a raw PUP status is not inferred eligible or ineligible. If ESPN surfaces the player as OUT or IR, that fantasy designation qualifies."
    });
  }

  if (inIr && GRANDFATHERED_IR_STATUSES.has(status)) {
    return freezeResult({
      status: "grandfathered",
      injuryStatus: status,
      canMoveToIr: false,
      canRemainInIr: true,
      reason: `ESPN reports ${statusLabel(status)} while the player is already in IR; ESPN policy allows this player to remain there but not to be newly moved into IR at this designation.`
    });
  }

  if (GRANDFATHERED_IR_STATUSES.has(status)) {
    return freezeResult({
      status: "ineligible",
      injuryStatus: status,
      canMoveToIr: false,
      canRemainInIr: false,
      reason: `ESPN reports ${statusLabel(status)}; this designation is not eligible for a new IR placement.`
    });
  }

  if (KNOWN_IR_INELIGIBLE_STATUSES.has(status) || status == null) {
    const suspended = status === "SUSPENSION";
    return freezeResult({
      status: "ineligible",
      injuryStatus: status,
      canMoveToIr: false,
      canRemainInIr: false,
      reason: suspended
        ? "ESPN reports suspension; ESPN explicitly says suspended Fantasy Football players are not IR-eligible."
        : `ESPN reports ${statusLabel(status)}; current ESPN Fantasy Football policy does not qualify this designation for IR.`
    });
  }

  return freezeResult({
    status: "unverified",
    injuryStatus: status,
    canMoveToIr: null,
    canRemainInIr: inIr ? null : false,
    reason: `IR eligibility for ESPN injury designation ${statusLabel(status)} is not documented by the supported policy and is not inferred.`
  });
}

export function configuredIrSlotCount(snapshot) {
  const slots = snapshot?.league?.lineupSlots;
  if (!Array.isArray(slots)) return null;
  return slots
    .filter((entry) => entry?.slot === "IR" && Number.isInteger(entry.count) && entry.count > 0)
    .reduce((total, entry) => total + entry.count, 0);
}

export function evaluateTeamIrState(snapshot, teamId, playerIndex = null) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) {
    return freezeResult({
      status: "missing-roster",
      configuredSlots: configuredIrSlotCount(snapshot),
      occupiedSlots: null,
      openSlots: null,
      blocksAcquisitions: null,
      invalidEntries: Object.freeze([]),
      unverifiedEntries: Object.freeze([]),
      grandfatheredEntries: Object.freeze([]),
      placeableEntries: Object.freeze([]),
      benchPlaceableEntries: Object.freeze([]),
      reason: "The selected ESPN roster is unavailable, so IR eligibility cannot be evaluated."
    });
  }

  const players = playerIndex instanceof Map
    ? playerIndex
    : new Map((snapshot.players || []).map((player) => [player.id, player]));
  const configuredSlots = configuredIrSlotCount(snapshot);
  const currentIrEntries = (roster.entries || []).filter((entry) => entry.lineupSlot === "IR");
  const evaluatedCurrent = currentIrEntries.map((entry) => {
    const player = players.get(entry.playerId);
    return Object.freeze({ entry, player: player || null, eligibility: evaluatePlayerIrEligibility(player, "IR") });
  });
  const invalidEntries = evaluatedCurrent.filter((item) => !item.player || item.eligibility.status === "ineligible");
  const unverifiedEntries = evaluatedCurrent.filter((item) => item.player && item.eligibility.status === "unverified");
  const grandfatheredEntries = evaluatedCurrent.filter((item) => item.eligibility.status === "grandfathered");
  const placeableEntries = (roster.entries || [])
    .filter((entry) => entry.lineupSlot !== "IR")
    .map((entry) => {
      const player = players.get(entry.playerId);
      return Object.freeze({ entry, player: player || null, eligibility: evaluatePlayerIrEligibility(player, entry.lineupSlot) });
    })
    .filter((item) => item.player && item.eligibility.canMoveToIr === true);
  const benchPlaceableEntries = placeableEntries.filter((item) => item.entry.lineupSlot === "BE");
  const occupiedSlots = currentIrEntries.length;
  const openSlots = configuredSlots == null ? null : Math.max(0, configuredSlots - occupiedSlots);
  const overCapacity = configuredSlots != null && occupiedSlots > configuredSlots;

  let status = "ready";
  let blocksAcquisitions = false;
  let reason = "Current ESPN IR occupants satisfy the supported eligibility policy.";

  if (overCapacity) {
    status = "invalid";
    blocksAcquisitions = true;
    reason = `The ESPN roster contains ${occupiedSlots} IR occupants but only ${configuredSlots} configured IR slot${configuredSlots === 1 ? "" : "s"}.`;
  } else if (invalidEntries.length) {
    status = "invalid";
    blocksAcquisitions = true;
    const names = invalidEntries.map((item) => item.player?.name || item.entry.playerId).join(", ");
    reason = `${names} ${invalidEntries.length === 1 ? "is" : "are"} in IR without a currently valid ESPN IR designation; waiver and free-agent moves may be blocked until the IR roster is corrected.`;
  } else if (unverifiedEntries.length) {
    status = "unverified";
    blocksAcquisitions = null;
    const names = unverifiedEntries.map((item) => item.player?.name || item.entry.playerId).join(", ");
    reason = `IR eligibility for ${names} cannot be verified from the supported ESPN designation rules, so acquisition legality is withheld.`;
  } else if (configuredSlots === 0 && occupiedSlots === 0) {
    status = "disabled";
    reason = "ESPN reports no configured IR slots for this league.";
  } else if (configuredSlots == null) {
    status = "settings-unavailable";
    blocksAcquisitions = currentIrEntries.length ? false : null;
    reason = "ESPN IR slot settings are unavailable; existing supported IR occupants can be checked, but open IR capacity is not inferred.";
  } else if (grandfatheredEntries.length) {
    const names = grandfatheredEntries.map((item) => item.player?.name || item.entry.playerId).join(", ");
    reason = `${names} ${grandfatheredEntries.length === 1 ? "may" : "may"} remain in IR under ESPN's Q/D grandfathering rule; ${grandfatheredEntries.length === 1 ? "this player is" : "these players are"} not eligible for a new IR placement at the current designation.`;
  }

  return freezeResult({
    status,
    configuredSlots,
    occupiedSlots,
    openSlots,
    blocksAcquisitions,
    invalidEntries: Object.freeze(invalidEntries),
    unverifiedEntries: Object.freeze(unverifiedEntries),
    grandfatheredEntries: Object.freeze(grandfatheredEntries),
    placeableEntries: Object.freeze(placeableEntries),
    benchPlaceableEntries: Object.freeze(benchPlaceableEntries),
    reason
  });
}
