import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { manualProjectionReviewToCsv, parseFantasyProsManualProjectionCsv } from "./lib/fantasypros-manual-csv.js";

function argument(name, fallback = null) { const index = process.argv.indexOf(`--${name}`); return index >= 0 ? process.argv[index + 1] : fallback; }
const season = Number(argument("season")); const week = Number(argument("week")); const scoringFormat = String(argument("scoring", "")).toUpperCase();
if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error("Pass a valid --season.");
if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("Pass a valid --week.");
if (!["PPR", "HALF", "STD"].includes(scoringFormat)) throw new Error("Pass --scoring PPR, HALF, or STD.");
const inputs = [["qb", "QB"], ["flx", "FLX"], ["k", "K"], ["dst", "DST"]].map(([name, position]) => ({ path: argument(name), position }));
if (inputs.some((item) => !item.path)) throw new Error("Pass --qb, --flx, --k, and --dst source CSV paths.");
const records = []; let exclusionCount = 0; const modifiedTimes = [];
for (const input of inputs) {
  const path = resolve(input.path); const fileStat = await stat(path); modifiedTimes.push(fileStat.mtimeMs);
  const parsed = parseFantasyProsManualProjectionCsv(await readFile(path, "utf8"), { sourceFile: basename(path), position: input.position });
  records.push(...parsed.records); exclusionCount += parsed.exclusions.length;
}
const keys = records.map((item) => `${item.sourceFile}:${item.sourceRow}`);
if (new Set(keys).size !== keys.length) throw new Error("Manual projection staging contains duplicate source-row identities.");
const retrievedAt = new Date(Math.max(...modifiedTimes)).toISOString();
const output = resolve(argument("output", `local-data/fantasypros-${season}-week-${week}-${scoringFormat.toLowerCase()}-identity-review.csv`));
await mkdir(dirname(output), { recursive: true });
await writeFile(output, manualProjectionReviewToCsv(records, { season, week, scoringFormat, retrievedAt }), "utf8");
console.log(`Staged ${records.length} FantasyPros Week ${week} ${scoringFormat} rows for explicit identity review at ${output}.`);
console.log(`${exclusionCount} source rows were excluded because required labels or FPTS values were missing.`);
console.log("FantasyPros and ESPN ID columns remain blank by design; this file is not yet importable as a projection set.");
