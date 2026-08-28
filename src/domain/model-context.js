import { selectDataCoverage, selectTeamContext } from "./selectors.js";
import { evaluateRecommendationBatch } from "./model-evaluator.js";

export function buildModelContext(snapshot, teamId, recommendations = []) {
  const context = selectTeamContext(snapshot, teamId);
  if (!context.team) return Object.freeze({ status: "missing-team", packet: null, errors: ["Selected team is not present in the snapshot."] });
  const evaluation = evaluateRecommendationBatch(recommendations, snapshot);
  const acceptedIds = new Set(evaluation.results.filter((item) => item.valid).map((item) => item.id));
  const players = new Map(snapshot.players.map((player) => [player.id, player]));
  const roster = context.roster.map((entry) => {
    const player = players.get(entry.playerId);
    return Object.freeze({ playerId: entry.playerId, lineupSlot: entry.lineupSlot, name: player?.name || null, position: player?.position || null, proTeam: player?.proTeam || null, opponent: player?.opponent || null, projection: player?.projection ?? null, injury: player?.injury ?? null, byeWeek: player?.byeWeek ?? null });
  });
  const packet = Object.freeze({ schemaVersion: 1, product: "The Chip Winner", provider: "espn", league: Object.freeze({ id: snapshot.league.id, season: snapshot.league.season, scoringType: snapshot.league.scoringType, lineupSlots: snapshot.league.lineupSlots }), currentWeek: snapshot.currentWeek, selectedTeam: Object.freeze({ id: context.team.id, name: context.team.name, record: context.team.record }), opponent: context.opponent ? Object.freeze({ id: context.opponent.id, name: context.opponent.name, record: context.opponent.record }) : null, roster: Object.freeze(roster), coverage: Object.freeze(selectDataCoverage(snapshot, teamId)), recommendations: Object.freeze(recommendations.filter((item) => acceptedIds.has(item.id))), capturedAt: snapshot.meta?.capturedAt || null });
  return Object.freeze({ status: evaluation.failed ? "partial" : "ready", packet, errors: Object.freeze(evaluation.results.flatMap((item) => item.errors)) });
}
