import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const assetVersion = packageJson.version;
if (typeof assetVersion !== "string" || !assetVersion.trim()) throw new Error("package.json must declare an application version.");

const port = 4199; const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/dev-server.js"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  let page;
  for (let attempt = 0; attempt < 30; attempt += 1) { try { page = await fetch(`${origin}/`); if (page.ok) break; } catch {} await wait(100); }
  if (!page?.ok) throw new Error("Static server did not become ready.");
  const html = await page.text();
  for (const expected of ["The Chip Winner", "Content-Security-Policy", `src/app.js?v=${assetVersion}`, `src/styles.css?v=${assetVersion}`]) if (!html.includes(expected)) throw new Error(`HTML smoke check missing ${expected}.`);
  for (const path of [`/src/app.js?v=${assetVersion}`, `/src/styles.css?v=${assetVersion}`, "/src/data/sample-espn-snapshot.json", "/schema/espn-snapshot.schema.json", "/schema/model-explanation.schema.json", "/schema/model-evaluation-report.schema.json"]) { const response = await fetch(`${origin}${path}`); if (!response.ok) throw new Error(`Static asset failed: ${path}.`); }
  const missing = await fetch(`${origin}/does-not-exist`); if (missing.status !== 404) throw new Error("Missing asset did not return 404.");
  console.log("Static production smoke checks passed.");
} finally { server.kill(); }
