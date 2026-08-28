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

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.locator(".player-row").first().waitFor();

  const violations = [];
  await page.addScriptTag({ content: axe.source });
  const audit = async (section) => {
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
  };
  await page.locator("#onboarding-dialog").waitFor();
  await audit("onboarding");
  await page.getByRole("button", { name: "Explore sample" }).click();
  for (const section of ["overview", "lineup", "waivers", "alerts", "season", "league"]) {
    await page.locator(`a[data-section="${section}"]`).click();
    await page.locator("#app-content").waitFor();
    await audit(section);
  }

  if (violations.length) {
    throw new Error(`WCAG audit violations:\n${violations.map((item) => `${item.section}: ${item.id} (${item.impact}, ${item.nodes} nodes) — ${item.help} [${item.targets}]`).join("\n")}`);
  }
  console.log("Automated WCAG 2.2 A/AA browser audit passed across onboarding and six primary sections.");
} finally {
  await browser?.close();
  server.kill();
}
