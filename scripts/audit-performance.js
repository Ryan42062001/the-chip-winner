import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const kib = 1024;
const budgets = Object.freeze({
  "index.html": 12 * kib,
  "src/styles.css": 32 * kib,
  "src/app.js": 80 * kib,
  "src/data/sample-espn-snapshot.json": 32 * kib,
  "browser JavaScript graph": 220 * kib,
});

function browserGraph(entry) {
  const found = new Set(); const visit = (file) => {
    const path = resolve(file); if (found.has(path)) return; found.add(path);
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g)) if (match[1].startsWith(".")) visit(resolve(dirname(path), match[1].split("?")[0]));
  };
  visit(entry); return [...found];
}

const measurements = {
  "index.html": statSync("index.html").size,
  "src/styles.css": statSync("src/styles.css").size,
  "src/app.js": statSync("src/app.js").size,
  "src/data/sample-espn-snapshot.json": statSync("src/data/sample-espn-snapshot.json").size,
  "browser JavaScript graph": browserGraph("src/app.js").reduce((total, path) => total + statSync(path).size, 0),
};

const failures = [];
for (const [asset, limit] of Object.entries(budgets)) {
  const bytes = measurements[asset]; const percentage = Math.round((bytes / limit) * 100);
  console.log(`${asset}: ${(bytes / kib).toFixed(1)} KiB / ${(limit / kib).toFixed(0)} KiB (${percentage}%)`);
  if (bytes > limit) failures.push(`${asset} exceeds its ${(limit / kib).toFixed(0)} KiB budget by ${((bytes - limit) / kib).toFixed(1)} KiB.`);
}

if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log("Static performance budgets passed.");
