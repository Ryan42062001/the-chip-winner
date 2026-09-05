import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import axe from "axe-core";
import { chromium } from "playwright-core";

const port = 4189;
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

if (!executablePath) throw new Error("Chrome or Chromium was not found. Set CHROME_PATH to run accessibility audits.");

const server = spawn(process.execPath, ["scripts/dev-server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "inherit"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local server did not become ready for accessibility audits.");
}

const violations = [];
async function audit(page, section) {
  const result = await page.evaluate(async () => globalThis.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"] },
  }));
  violations.push(...result.violations.map((violation) => ({
    section,
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")).join(", "),
  })));
}

async function auditSampleContext(browser, contextOptions, label) {
  const context = await browser.newContext({ ...contextOptions, bypassCSP: true });
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.locator(".player-row").first().waitFor();
  await page.addScriptTag({ content: axe.source });

  await page.locator("#onboarding-dialog").waitFor();
  await audit(page, `${label} onboarding`);
  await page.getByRole("button", { name: "Explore sample" }).click();
  await page.locator(".player-row").first().click();
  await page.locator("#player-dialog[open]").waitFor();
  await audit(page, `${label} player detail`);
  await page.getByRole("button", { name: "Close player details" }).click();

  for (const section of ["overview", "lineup", "waivers", "alerts", "changes", "season", "league"]) {
    const menu = page.locator(".mobile-menu");
    if (await menu.isVisible() && await menu.getAttribute("aria-expanded") !== "true") await menu.click();
    await page.locator(`a[data-section="${section}"]`).click();
    await page.locator("#app-content").waitFor();
    await audit(page, `${label} ${section}`);
  }
  await context.close();
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  await auditSampleContext(browser, { viewport: { width: 1440, height: 900 } }, "desktop");
  await auditSampleContext(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, "phone");

  if (violations.length) {
    throw new Error(`WCAG audit violations:\n${violations.map((item) => `${item.section}: ${item.id} (${item.impact}, ${item.nodes} nodes) — ${item.help} [${item.targets}]`).join("\n")}`);
  }
  console.log("Automated WCAG 2.2 A/AA browser audit passed across onboarding, player detail, and all seven primary sections on desktop and 390x844 phone layouts.");
} finally {
  await browser?.close();
  server.kill();
}
