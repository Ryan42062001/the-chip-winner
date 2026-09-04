function rows(text) {
const output = []; let row = []; let field = ""; let quoted = false;
for (let index = 0; index < String(text || "").length; index += 1) {
const char = text[index];
if (quoted && char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
else if (char === '"') quoted = !quoted;
else if (!quoted && char === ",") { row.push(field); field = ""; }
else if (!quoted && (char === "\n" || char === "\r")) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(field); output.push(row); row = []; field = ""; }
else field += char;
}
if (field || row.length) { row.push(field); output.push(row); }
if (quoted) throw new Error("FantasyPros CSV contains an unterminated quoted field.");
return output;
}
const clean = (value) => String(value ?? "").replaceAll("\u00a0", " ").trim();
const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export function parseManualFantasyProsExport(text, { fileName, fallbackPosition }) {
const parsed = rows(text); if (parsed.length < 2) throw new Error(`${fileName} is empty.`);
const headers = parsed[0].map((value) => clean(value).toUpperCase());
const playerAt = headers.indexOf("PLAYER"); const teamAt = headers.indexOf("TEAM"); const positionAt = headers.indexOf("POS"); const pointsAt = headers.lastIndexOf("FPTS");
if (playerAt < 0 || teamAt < 0 || pointsAt < 0) throw new Error(`${fileName} must include Player, Team, and FPTS columns.`);
const records = [];
for (let index = 1; index < parsed.length; index += 1) {
const values = parsed[index]; const playerName = clean(values[playerAt]); const pointsText = clean(values[pointsAt]);
if (!playerName && !pointsText) continue; const points = Number(pointsText);
if (!playerName || !pointsText || !Number.isFinite(points) || points < 0) continue;
const listed = positionAt >= 0 ? clean(values[positionAt]).replace(/\d+$/, "") : "";
records.push(Object.freeze({ sourceKey: `${fileName}:${index + 1}`, sourceFile: fileName, sourceRow: index + 1, playerName, team: clean(values[teamAt]) || null, position: listed || fallbackPosition, points }));
}
if (!records.length) throw new Error(`${fileName} contains no usable projection rows.`);
return Object.freeze(records);
}
export function fantasyProsProviderId(profileUrl) {
let url; try { url = new URL(String(profileUrl || "").trim()); } catch { throw new Error("Paste a complete FantasyPros player URL."); }
const host = url.hostname.toLowerCase();
if (url.protocol !== "https:" || !["fantasypros.com", "www.fantasypros.com"].includes(host)) throw new Error("The player URL must be an HTTPS FantasyPros URL.");
const match = url.pathname.match(/^\/nfl\/(?:players|projections)\/([a-z0-9-]+)\.php$/i);
if (!match) throw new Error("Use a FantasyPros NFL player or projection profile URL ending in the player's .php slug.");
return `fantasypros:${match[1].toLowerCase()}`;
}
export function fantasyProsProfileUrlFromProviderId(providerPlayerId) {
const match = String(providerPlayerId || "").trim().match(/^fantasypros:([a-z0-9-]+)$/i);
return match ? `https://www.fantasypros.com/nfl/players/${match[1].toLowerCase()}.php` : null;
}
export function fantasyProsProfileUrlForEspnPlayer(identityMap, espnPlayerId) {
if (!(identityMap instanceof Map) || !String(espnPlayerId || "").trim()) return null;
const matches = [...identityMap].filter(([providerPlayerId, mappedEspnId]) =>
String(mappedEspnId) === String(espnPlayerId) && fantasyProsProfileUrlFromProviderId(providerPlayerId)
);
return matches.length === 1 ? fantasyProsProfileUrlFromProviderId(matches[0][0]) : null;
}
export function buildApprovedManualImports({ records, approvals, season, week, scoringFormat, capturedAt }) {
if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error("Enter a valid four-digit season.");
if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("Enter a valid NFL week.");
if (!String(scoringFormat || "").trim()) throw new Error("Enter the scoring format shown by the export.");
if (!capturedAt || !Number.isFinite(Date.parse(capturedAt))) throw new Error("The local CSV capture time is unavailable.");
const recordIndex = new Map(records.map((item) => [item.sourceKey, item])); const mapped = approvals.map((approval) => {
const record = recordIndex.get(approval.sourceKey); if (!record) throw new Error("An approved FantasyPros row is no longer present.");
if (!String(approval.espnPlayerId || "").trim()) throw new Error("Every approval requires an ESPN player.");
return { record, providerPlayerId: fantasyProsProviderId(approval.profileUrl), espnPlayerId: String(approval.espnPlayerId).trim() };
});
if (!mapped.length) throw new Error("Approve at least one player mapping first.");
if (new Set(mapped.map((item) => item.record.sourceKey)).size !== mapped.length) throw new Error("A FantasyPros row was approved more than once.");
if (new Set(mapped.map((item) => item.providerPlayerId)).size !== mapped.length) throw new Error("A FantasyPros profile was approved more than once.");
if (new Set(mapped.map((item) => item.espnPlayerId)).size !== mapped.length) throw new Error("An ESPN player was approved more than once.");
const projectionRows = [["provider", "scoring_format", "season", "captured_at", "provider_player_id", "week", "points"], ...mapped.map((item) => ["FantasyPros manual CSV", scoringFormat.trim(), season, capturedAt, item.providerPlayerId, week, item.record.points])];
const identityRows = [["provider_player_id", "espn_player_id"], ...mapped.map((item) => [item.providerPlayerId, item.espnPlayerId])];
const csv = (data) => `${data.map((row) => row.map(cell).join(",")).join("\n")}\n`;
return Object.freeze({ projectionsCsv: csv(projectionRows), identityMapCsv: csv(identityRows), count: mapped.length });
}
