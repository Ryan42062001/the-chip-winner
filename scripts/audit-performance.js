import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const kib = 1024;
const budgets = Object.freeze({
  "index.html": 12 * kib,
  "src/styles.css": 32 * kib,
  "src/app.js": 80 * kib,
  "src/data/sample-espn-snapshot.json": 32 * kib,
  "all source JavaScript": 220 * kib,
});

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const measurements = {
  "index.html": statSync("index.html").size,
  "src/styles.css": statSync("src/styles.css").size,
  "src/app.js": statSync("src/app.js").size,
  "src/data/sample-espn-snapshot.json": statSync("src/data/sample-espn-snapshot.json").size,
  "all source JavaScript": filesUnder("src").filter((path) => extname(path) === ".js").reduce((total, path) => total + statSync(path).size, 0),
};

const failures = [];
for (const [asset, limit] of Object.entries(budgets)) {
  const bytes = measurements[asset]; const percentage = Math.round((bytes / limit) * 100);
  console.log(`${asset}: ${(bytes / kib).toFixed(1)} KiB / ${(limit / kib).toFixed(0)} KiB (${percentage}%)`);
  if (bytes > limit) failures.push(`${asset} exceeds its ${(limit / kib).toFixed(0)} KiB budget by ${((bytes - limit) / kib).toFixed(1)} KiB.`);
}

if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log("Static performance budgets passed.");
