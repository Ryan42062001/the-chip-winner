import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { finalizeManualProjectionReview } from "./lib/fantasypros-manual-csv.js";

function argument(name, fallback = null) { const index = process.argv.indexOf(`--${name}`); return index >= 0 ? process.argv[index + 1] : fallback; }
const input = argument("input"); if (!input) throw new Error("Pass --input with the completed identity-review CSV.");
const result = finalizeManualProjectionReview(await readFile(resolve(input), "utf8"));
const outputDirectory = resolve(argument("output-dir", "local-data")); await mkdir(outputDirectory, { recursive: true });
const stem = `fantasypros-${result.season}-week-${result.week}`;
const projectionsPath = resolve(outputDirectory, `${stem}-projections.csv`); const identityPath = resolve(outputDirectory, `${stem}-identity-map.csv`);
await writeFile(projectionsPath, result.projectionsCsv, "utf8"); await writeFile(identityPath, result.identityMapCsv, "utf8");
console.log(`Created ${result.approvedCount} app-ready projection records; ${result.skippedCount} unmapped rows remained excluded.`);
console.log(`Projections: ${projectionsPath}`); console.log(`Identity map: ${identityPath}`);
