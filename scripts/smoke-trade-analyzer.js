import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const port = 4191;
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

if (!executablePath) throw new Error("Chrome or Chromium was not found. Set CHROME_PATH to run Trade Analyzer browser smoke tests.");

const server = spawn(process.execPath, ["scripts/dev-server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "inherit"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(origin)).ok) return; } catch { /* still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Trade Analyzer smoke server did not become ready.");
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.locator("#onboarding-dialog").waitFor();
  await page.getByRole("button", { name: "Explore sample" }).click();
  await page.locator('a[data-section="trade"]').click();
  await page.getByRole("heading", { name: "Trade Analyzer", level: 2 }).waitFor();
  await page.getByRole("heading", { name: "Build the trade", level: 3 }).waitFor();

  if (await page.locator("#trade-outgoing-select option").count() < 1) throw new Error("Trade Analyzer did not offer outgoing roster players.");
  if (await page.locator("#trade-incoming-select option").count() < 1) throw new Error("Trade Analyzer did not offer incoming ESPN snapshot players.");

  await page.getByRole("button", { name: "Add outgoing" }).click();
  await page.getByRole("button", { name: "Add incoming" }).click();
  if (await page.locator('[data-trade-remove="outgoingPlayerIds"]').count() !== 1) throw new Error("Trade Analyzer did not add an outgoing player.");
  if (await page.locator('[data-trade-remove="incomingPlayerIds"]').count() !== 1) throw new Error("Trade Analyzer did not add an incoming player.");

  await page.locator("#trade-objective").selectOption("FUTURE_UPSIDE");
  if (await page.locator("#trade-objective").inputValue() !== "FUTURE_UPSIDE") throw new Error("Trade Analyzer objective selection did not persist.");
  await page.getByRole("button", { name: "Analyze proposed trade" }).click();
  await page.locator("#trade-results-title").waitFor();
  await page.getByText(/No ESPN trade mutation/i).waitFor();
  await page.getByText(/There is no trade score/i).waitFor();

  await page.locator('[data-trade-remove="outgoingPlayerIds"]').first().click();
  if (await page.locator('[data-trade-remove="outgoingPlayerIds"]').count() !== 0) throw new Error("Trade Analyzer did not remove the outgoing player during proposal editing.");
  await page.getByRole("button", { name: "Add outgoing" }).click();
  if (await page.locator('[data-trade-remove="outgoingPlayerIds"]').count() !== 1) throw new Error("Trade Analyzer could not re-add an outgoing player after editing.");
  await page.getByRole("button", { name: "Analyze proposed trade" }).click();
  await page.locator("#trade-results-title").waitFor();

  if (pageErrors.length) throw new Error(`Trade Analyzer browser page errors: ${pageErrors.join(" | ")}`);
  await context.close();
  console.log("Trade Analyzer browser smoke passed.");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
