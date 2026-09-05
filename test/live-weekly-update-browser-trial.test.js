import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const port = 4193;
const origin = `http://127.0.0.1:${port}`;
const executablePath = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].find((candidate) => candidate && existsSync(candidate));

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Temporary weekly update canary server did not start.");
}

test("TEMPORARY live Chrome can fetch and import the current weekly projection source", { timeout: 120_000 }, async () => {
  assert.ok(executablePath, "Chrome or Chromium is required for the temporary live weekly update canary.");
  const server = spawn(process.execPath, ["scripts/dev-server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "inherit"]
  });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(origin, { waitUntil: "networkidle" });

    await page.evaluate(async () => {
      const snapshot = await fetch("/src/data/sample-espn-snapshot.json").then((response) => response.json());
      snapshot.meta = { ...snapshot.meta, kind: "live", capturedAt: new Date().toISOString() };
      snapshot.league = { ...snapshot.league, id: "weekly-update-live-canary", scoringPeriod: 1 };
      snapshot.currentWeek = 1;
      snapshot.matchups = [];
      localStorage.setItem("chip-winner:espn-snapshot:v1", JSON.stringify(snapshot));
      localStorage.removeItem("chip-winner:future-projections:v1");
      localStorage.removeItem("chip-winner:projection-identity-map:v1");
      localStorage.removeItem("chip-winner:weekly-projection-updates:v1");
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    const button = page.locator("#weekly-projection-update-button");
    await button.waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const text = document.querySelector("#weekly-projection-update-button")?.textContent || "";
      return text.includes("Update Week 1 projections") || text.includes("Refresh Week 1 projections");
    }, null, { timeout: 30_000 });

    await page.evaluate(() => document.querySelector("#weekly-projection-update-button")?.click());
    await page.waitForFunction(() => {
      const raw = localStorage.getItem("chip-winner:future-projections:v1");
      if (!raw) return false;
      try {
        const set = JSON.parse(raw);
        return Array.isArray(set.projections) && set.projections.some((record) => record.week === 1);
      } catch { return false; }
    }, null, { timeout: 45_000 });

    const result = await page.evaluate(() => {
      const projections = JSON.parse(localStorage.getItem("chip-winner:future-projections:v1") || "null");
      const receipt = JSON.parse(localStorage.getItem("chip-winner:weekly-projection-updates:v1") || "{}")["2026:1"] || null;
      return { projectionCount: projections?.projections?.length || 0, receipt };
    });
    assert.ok(result.projectionCount > 0);
    assert.ok(result.receipt?.mappedCount > 0);
    assert.equal(pageErrors.length, 0, pageErrors.join(" | "));
    console.log(`LIVE_WEEKLY_BROWSER_TRIAL ${JSON.stringify(result)}`);
    await context.close();
  } finally {
    await browser?.close();
    server.kill("SIGTERM");
  }
});
