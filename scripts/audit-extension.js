import { readFileSync } from "node:fs";

const root = new URL("../extensions/espn-companion/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", root), "utf8"));
const worker = readFileSync(new URL("service-worker.js", root), "utf8");
const bridge = readFileSync(new URL("content-bridge.js", root), "utf8");
const findings = [];

const expectedHosts = [
  "https://lm-api-reads.fantasy.espn.com/*",
  "https://site.api.espn.com/*",
];
const expectedMatches = [
  "https://ryan42062001.github.io/the-chip-winner/*",
  "http://localhost:4173/*",
];

if (manifest.manifest_version !== 3) findings.push("Extension must use Manifest V3.");
if ((manifest.permissions || []).length) findings.push(`Unexpected extension permissions: ${(manifest.permissions || []).join(", ")}.`);
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(expectedHosts)) findings.push("Host permissions exceed or differ from the two reviewed ESPN read hosts.");
if (manifest.background?.service_worker !== "service-worker.js") findings.push("Unexpected background service worker entry.");
if (manifest.content_scripts?.length !== 1 || JSON.stringify(manifest.content_scripts[0].matches) !== JSON.stringify(expectedMatches)) findings.push("Content bridge origins exceed or differ from the reviewed site origins.");
if (/\b(?:POST|PUT|PATCH|DELETE)\b/i.test(worker)) findings.push("Potential mutation method found in the ESPN service worker.");
if (/chrome\.(?:cookies|webRequest|tabs|scripting|identity|history)\b/.test(`${worker}\n${bridge}`)) findings.push("Sensitive Chrome API usage found outside the approved boundary.");
if (!worker.includes('const ALLOWED_VIEWS = Object.freeze(["mTeam", "mRoster", "mMatchup", "mSettings"])')) findings.push("ESPN league views are no longer the reviewed fixed allowlist.");
if (!bridge.includes('new Set(["CHIP_WINNER_PING", "CHIP_WINNER_FETCH_LEAGUE"])')) findings.push("Page-to-extension operations are no longer the reviewed fixed allowlist.");
if (/document\.cookie|chrome\.cookies/.test(`${worker}\n${bridge}`)) findings.push("Cookie access must never enter extension code.");

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Chrome companion least-privilege audit passed: fixed origins, read operations, views, and message types.");
}
