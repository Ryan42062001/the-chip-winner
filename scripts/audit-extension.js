import { readFileSync } from "node:fs";

const root = new URL("../extensions/espn-companion/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", root), "utf8"));
const worker = readFileSync(new URL("service-worker.js", root), "utf8");
const bridge = readFileSync(new URL("content-bridge.js", root), "utf8");
const combined = `${worker}\n${bridge}`;
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
if (manifest.externally_connectable) findings.push("externally_connectable is not allowed for the ESPN companion.");
if ((manifest.web_accessible_resources || []).length) findings.push("The ESPN companion must not expose web-accessible extension resources.");
if (manifest.background?.service_worker !== "service-worker.js" || manifest.background?.type !== "module") findings.push("Unexpected background service worker configuration.");
const contentScript = manifest.content_scripts?.[0];
if (manifest.content_scripts?.length !== 1 || JSON.stringify(contentScript?.matches) !== JSON.stringify(expectedMatches)) findings.push("Content bridge origins exceed or differ from the reviewed site origins.");
if (JSON.stringify(contentScript?.js) !== JSON.stringify(["content-bridge.js"]) || contentScript?.run_at !== "document_start") findings.push("Unexpected content bridge entry or injection timing.");

if (/\b(?:POST|PUT|PATCH|DELETE)\b/i.test(worker)) findings.push("Potential mutation method found in the ESPN service worker.");
if (/chrome\.(?:cookies|webRequest|tabs|scripting|identity|history|storage)\b/.test(combined)) findings.push("Sensitive or persistent Chrome API usage found outside the approved boundary.");
if (/document\.cookie|chrome\.cookies/.test(combined)) findings.push("Cookie access must never enter extension code.");
if (/\b(?:localStorage|sessionStorage|indexedDB)\b/.test(combined)) findings.push("The companion must not persist ESPN responses or credentials.");
if (/\b(?:console\.(?:log|info|debug|warn|error)|eval\s*\(|new\s+Function\b)/.test(combined)) findings.push("Logging or dynamic code execution is not allowed in companion runtime code.");
if (!worker.includes('const ALLOWED_VIEWS = Object.freeze(["mTeam", "mRoster", "mMatchup", "mSettings"])')) findings.push("ESPN league views are no longer the reviewed fixed allowlist.");
if (!worker.includes("sender?.id !== chrome.runtime.id")) findings.push("Service worker must reject runtime messages not sent by this extension.");
if (!bridge.includes('new Set(["CHIP_WINNER_PING", "CHIP_WINNER_FETCH_LEAGUE"])')) findings.push("Page-to-extension operations are no longer the reviewed fixed allowlist.");
if (!bridge.includes("event.source !== window || event.origin !== window.location.origin")) findings.push("Page bridge must verify both message source and same-origin sender.");
if ((bridge.match(/window\.postMessage\(/g) || []).length < 2 || !bridge.includes("window.location.origin")) findings.push("Page bridge responses must target the current reviewed origin, never '*'.");
if (/postMessage\([^\n]+["']\*["']/.test(bridge)) findings.push("Wildcard postMessage targets are prohibited.");
if (!worker.includes('credentials: "include"')) findings.push("Authenticated ESPN reads must remain explicit browser-session fetches.");
if (!worker.includes("requireDigits(payload?.leagueId") || !worker.includes("requireDigits(payload?.seasonId")) findings.push("League and season path inputs must remain digit-only before building ESPN URLs.");
if (!worker.includes('https://lm-api-reads.fantasy.espn.com/') || !worker.includes('https://site.api.espn.com/')) findings.push("Reviewed ESPN endpoint hosts changed unexpectedly.");

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Chrome companion threat audit passed: fixed origins/hosts, read-only methods, same-extension messaging, no cookie API, no persistence/logging, and no dynamic code.");
}
