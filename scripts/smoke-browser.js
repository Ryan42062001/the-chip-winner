import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const port = 4188;
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

if (!executablePath) throw new Error("Chrome or Chromium was not found. Set CHROME_PATH to run browser smoke tests.");

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
  throw new Error("Local server did not become ready for browser smoke tests.");
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.locator(".player-row").first().waitFor();
  const onboarding = page.locator("#onboarding-dialog");
  await onboarding.waitFor();
  await page.getByRole("button", { name: "Save ESPN connection" }).click();
  if (await onboarding.isVisible()) throw new Error("Desktop onboarding did not close after saving a valid connection.");
  if (await page.title() !== "The Chip Winner") throw new Error("Unexpected document title.");
  if (await page.locator("#app-content").getByText("STARTERS", { exact: true }).count() === 0) throw new Error("Sample roster did not render.");
  await page.getByRole("heading", { name: "Weekly checklist", level: 3 }).waitFor();
  const firstPlayer = page.locator(".player-row").first();
  await firstPlayer.focus(); await firstPlayer.press("Enter");
  await page.locator("#player-dialog[open]").waitFor();
  if (await page.locator("#player-dialog-title").textContent() === "") throw new Error("Keyboard player detail did not render a player identity.");
  await page.getByRole("button", { name: "Close player details" }).click();
  if (await page.locator("#player-dialog").isVisible()) throw new Error("Player detail dialog did not close.");
  await page.locator('a[data-section="lineup"]').click();
  await page.getByRole("heading", { name: "Lineup Lab", level: 2 }).waitFor();
  await page.locator('a[data-section="league"]').click();
  await page.getByRole("heading", { name: "Standings overview", level: 3 }).waitFor();
  await page.getByRole("heading", { name: "Reported schedule", level: 3 }).waitFor();
  if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(" | ")}`);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(origin, { waitUntil: "networkidle" });
  await mobilePage.locator("#onboarding-dialog").waitFor();
  await mobilePage.getByRole("button", { name: "Explore sample" }).click();
  await mobilePage.locator(".player-row").first().click();
  await mobilePage.locator("#player-dialog[open]").waitFor();
  await mobilePage.getByRole("button", { name: "Close player details" }).click();
  const menu = mobilePage.locator(".mobile-menu");
  await menu.click();
  if (await menu.getAttribute("aria-expanded") !== "true") throw new Error("Mobile navigation did not open.");
  await mobilePage.locator('a[data-section="waivers"]').click();
  await mobilePage.getByRole("heading", { name: "Waiver Wire", level: 2 }).waitFor();
  if (await menu.getAttribute("aria-expanded") !== "false") throw new Error("Mobile navigation did not close after selection.");
  await mobile.close();

  console.log("Desktop and mobile browser smoke checks passed.");
} finally {
  await browser?.close();
  server.kill();
}
