import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { normalizeFantasyProsPlayerDirectory, playerDirectoryToCsv } from "./lib/fantasypros-projections.js";

function argument(name, fallback) { const index = process.argv.indexOf(`--${name}`); return index >= 0 ? process.argv[index + 1] : fallback; }
const output = resolve(argument("output", "local-data/fantasypros-player-directory.csv"));
const apiKey = process.env.FANTASYPROS_API_KEY;
if (!apiKey?.trim()) throw new Error("FANTASYPROS_API_KEY is not configured. Set it privately in this terminal before running the directory downloader.");
const response = await fetch("https://api.fantasypros.com/public/v2/json/nfl/players", { headers: { "x-api-key": apiKey, accept: "application/json" } });
if (!response.ok) throw new Error(`FantasyPros player-directory request failed with HTTP ${response.status}. Confirm that the key is active for the free player-metadata endpoint. The response body was not logged.`);
const result = normalizeFantasyProsPlayerDirectory(await response.json());
await mkdir(dirname(output), { recursive: true }); await writeFile(output, playerDirectoryToCsv(result.players), "utf8");
console.log(`Saved ${result.players.length} FantasyPros player-directory records to ${output}.`);
console.log(`${result.exclusions.length} source rows were excluded because a provider player ID was missing.`);
