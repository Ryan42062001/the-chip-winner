import { spawn } from "node:child_process";

const port = 4199; const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/dev-server.js"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  let page;
  for (let attempt = 0; attempt < 30; attempt += 1) { try { page = await fetch(`${origin}/`); if (page.ok) break; } catch {} await wait(100); }
  if (!page?.ok) throw new Error("Static server did not become ready.");
  const html = await page.text();
  for (const expected of ["The Chip Winner", "Content-Security-Policy", "src/app.js?v=0.9.10", "src/styles.css?v=0.9.10"]) if (!html.includes(expected)) throw new Error(`HTML smoke check missing ${expected}.`);
  for (const path of ["/src/app.js?v=0.9.10", "/src/styles.css?v=0.9.10", "/src/data/sample-espn-snapshot.json", "/schema/espn-snapshot.schema.json"]) { const response = await fetch(`${origin}${path}`); if (!response.ok) throw new Error(`Static asset failed: ${path}.`); }
  const missing = await fetch(`${origin}/does-not-exist`); if (missing.status !== 404) throw new Error("Missing asset did not return 404.");
  console.log("Static production smoke checks passed.");
} finally { server.kill(); }
