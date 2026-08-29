function requiredText(value, field) {
if (value == null || String(value).trim() === "") throw new Error(`${field} is required.`);
return String(value);
}
function optionalNumber(value, field) {
if (value == null) return null;
if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative number or null.`);
return value;
}
export function validateProjectionSet(input) {
if (!input || typeof input !== "object") throw new Error("Projection set is required.");
const season = Number(input.season);
const week = Number(input.week);
if (!Number.isInteger(season) || season < 2000) throw new Error("Projection season is invalid.");
if (!Number.isInteger(week) || week < 1 || week > 25) throw new Error("Projection week is invalid.");
const seen = new Set();
const players = (input.players || []).map((player) => {
const providerPlayerId = requiredText(player.providerPlayerId, "providerPlayerId");
if (seen.has(providerPlayerId)) throw new Error(`Duplicate provider player id ${providerPlayerId}.`);
seen.add(providerPlayerId);
return Object.freeze({
providerPlayerId,
projection: optionalNumber(player.projection, `projection for ${providerPlayerId}`),
floor: optionalNumber(player.floor, `floor for ${providerPlayerId}`),
ceiling: optionalNumber(player.ceiling, `ceiling for ${providerPlayerId}`),
restOfSeasonValue: optionalNumber(player.restOfSeasonValue, `restOfSeasonValue for ${providerPlayerId}`)
});
});
return Object.freeze({
source: requiredText(input.source, "Projection source"),
season,
week,
scoringFormat: requiredText(input.scoringFormat, "Projection scoring format"),
fetchedAt: requiredText(input.fetchedAt, "Projection fetched time"),
updatedAt: input.updatedAt ? String(input.updatedAt) : null,
players: Object.freeze(players)
});
}
export class ProjectionCatalog {
#sets = new Map();
add(input) {
const set = validateProjectionSet(input);
this.#sets.set(this.#key(set.source, set.season, set.week, set.scoringFormat), set);
return set;
}
get({ source, season, week, scoringFormat }) {
return this.#sets.get(this.#key(source, season, week, scoringFormat)) || null;
}
list({ season, week, scoringFormat }) {
return [...this.#sets.values()].filter((set) =>
set.season === season && set.week === week && set.scoringFormat === scoringFormat
);
}
#key(source, season, week, scoringFormat) {
return [source, season, week, scoringFormat].map((value) => String(value).toLowerCase()).join("|");
}
}
