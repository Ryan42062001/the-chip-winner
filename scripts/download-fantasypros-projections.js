import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { identityReferenceToCsv, normalizeFantasyProsProjectionResponses, projectionSetToCsv } from "./lib/fantasypros-projections.js";

function argument(name, fallback) { const index = process.argv.indexOf(`--${name}`); return index >= 0 ? process.argv[index + 1] : fallback; }
const season = Number(argument("season", new Date().getUTCFullYear()));
const week = Number(argument("week", ""));
const scoring = String(argument("scoring", "PPR")).toUpperCase();
const output = resolve(argument("output", `local-data/fantasypros-${season}-week-${week}-${scoring.toLowerCase()}.csv`));
const identityOutput = resolve(argument("identity-output", `local-data/fantasypros-${season}-identity-reference.csv`));
const apiKey = process.env.FANTASYPROS_API_KEY;
if (!apiKey?.trim()) throw new Error("FANTASYPROS_API_KEY is not configured. Set it privately in this terminal before running the downloader.");
if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("Pass an NFL week from 1 through 18 with --week.");

const positions = ["QB", "RB", "WR", "TE", "K", "DST"];
const payloads = []; const responseDates = [];
for (const position of positions) {
  const url = new URL(`https://api.fantasypros.com/public/v2/json/nfl/${season}/projections`);
  url.searchParams.set("position", position); url.searchParams.set("week", String(week)); url.searchParams.set("scoring", scoring);
  const response = await fetch(url, { headers: { "x-api-key": apiKey, accept: "application/json" } });
  if (!response.ok) throw new Error(`FantasyPros ${position} request failed with HTTP ${response.status}. The response body was not logged.`);
  const responseDate = response.headers.get("date");
  if (responseDate && Number.isFinite(Date.parse(responseDate))) responseDates.push(Date.parse(responseDate));
  payloads.push(await response.json());
}
if (!responseDates.length) throw new Error("FantasyPros responses did not include a valid HTTP Date header; capture time cannot be proven.");
const capturedAt = new Date(Math.max(...responseDates)).toISOString();
const result = normalizeFantasyProsProjectionResponses(payloads, { season, week, scoring, capturedAt });
await mkdir(dirname(output), { recursive: true }); await mkdir(dirname(identityOutput), { recursive: true });
await writeFile(output, projectionSetToCsv(result.projectionSet), "utf8");
await writeFile(identityOutput, identityReferenceToCsv(result.identities), "utf8");
console.log(`Saved ${result.projectionSet.projections.length} FantasyPros Week ${week} ${scoring} projections to ${output}.`);
console.log(`Saved ${result.identities.length} provider identities for explicit ESPN mapping to ${identityOutput}.`);
console.log(`${result.exclusions.length} source rows were excluded because a required provider ID or ${scoring} point value was missing.`);
