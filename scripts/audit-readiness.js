import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const port = 4173;
const origin = `http://127.0.0.1:${port}`;
const executablePath = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((candidate) => candidate && existsSync(candidate));

if (!executablePath) throw new Error("Chrome or Chromium was not found. Set CHROME_PATH to run readiness audits.");

const server = spawn(process.execPath, ["scripts/dev-server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "inherit", "inherit"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode != null) throw new Error(`Production-readiness dev server exited early with code ${server.exitCode}.`);
    try { if ((await fetch(origin)).ok) return; } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local server did not become ready for production-readiness audits.");
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 2) {
    throw new Error(`${label} horizontally overflows: ${metrics.scrollWidth}px content in ${metrics.clientWidth}px viewport.`);
  }
}

async function openSample(page) {
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.locator("#onboarding-dialog").waitFor();
  await page.getByRole("button", { name: "Explore sample" }).click();
  await page.locator(".player-row").first().waitFor();
}

async function auditSections(page, label) {
  for (const section of ["overview", "lineup", "waivers", "alerts", "season", "league"]) {
    const menu = page.locator(".mobile-menu");
    if (await menu.isVisible()) {
      if (await menu.getAttribute("aria-expanded") !== "true") await menu.click();
    }
    await page.locator(`a[data-section="${section}"]`).click();
    await page.getByRole("heading", { level: 2 }).first().waitFor();
    await assertNoHorizontalOverflow(page, `${label} ${section}`);
  }
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });

  // A 720 CSS-pixel viewport represents a 1440px desktop at 200% browser zoom.
  const zoomContext = await browser.newContext({ viewport: { width: 720, height: 900 } });
  const zoomPage = await zoomContext.newPage();
  await openSample(zoomPage);
  await assertNoHorizontalOverflow(zoomPage, "200%-equivalent overview");
  await auditSections(zoomPage, "200%-equivalent");
  await zoomContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await openSample(mobilePage);
  await assertNoHorizontalOverflow(mobilePage, "390px phone overview");
  await auditSections(mobilePage, "390px phone");
  await mobileContext.close();

  console.log("Production-readiness reflow audit passed at 200%-equivalent desktop width and 390px mobile across all primary sections.");
} finally {
  await browser?.close();
  server.kill();
}
