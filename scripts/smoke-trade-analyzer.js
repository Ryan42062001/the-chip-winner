import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

  const fixture = JSON.parse(readFileSync("src/data/sample-espn-snapshot.json", "utf8"));
  const myTeamId = await page.locator("#team-select").inputValue();
  const opposing = fixture.teams.find((team) => team.id !== myTeamId);
  if (!opposing) throw new Error("Trade Analyzer sample has no opposing team.");
  if (await page.locator("#trade-outgoing-select option").count() < 1) throw new Error("Trade Analyzer did not offer outgoing roster players.");
  if (await page.locator("#trade-incoming-select option").count() !== 0) throw new Error("Trade Analyzer offered incoming players without an explicit partner.");
  await page.locator("#trade-partner-select").selectOption(opposing.id);
  const expectedIncoming = fixture.rosters.find((item) => item.teamId === opposing.id).entries.map((entry) => entry.playerId).sort();
  const actualIncoming = await page.locator("#trade-incoming-select option").evaluateAll((options) => options.map((item) => item.value).sort());
  if (JSON.stringify(actualIncoming) !== JSON.stringify(expectedIncoming)) throw new Error(`Incoming choices were not restricted to the selected partner roster: ${actualIncoming.join(",")}`);
  const freeAgentIds = fixture.players.map((player) => player.id).filter((id) => !fixture.rosters.some((roster) => roster.entries.some((entry) => entry.playerId === id)));
  if (actualIncoming.some((id) => freeAgentIds.includes(id))) throw new Error("Unrostered player appeared as incoming trade asset.");

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
  await page.getByText("My team", { exact: true }).first().waitFor();
  await page.locator(".trade-results").getByText(opposing.name, { exact: true }).waitFor();
  await page.locator("#trade-incoming-select").waitFor();

  await page.locator("#team-select").selectOption(opposing.id);
  if (await page.locator('[data-trade-remove="incomingPlayerIds"]').count() !== 0) throw new Error("Trade Analyzer retained incoming players after changing the connected user's team.");
  if (await page.locator("#trade-partner-select").inputValue() !== "") throw new Error("Trade Analyzer retained a trade partner after changing the connected user's team.");
  if (await page.locator("#trade-results-title").count()) throw new Error("Trade Analyzer retained stale analysis after changing the connected user's team.");
  await page.locator("#trade-partner-select").selectOption(myTeamId);
  await page.getByRole("button", { name: "Add outgoing" }).click();
  await page.getByRole("button", { name: "Add incoming" }).click();
  await page.getByRole("button", { name: "Analyze proposed trade" }).click();
  await page.locator("#trade-results-title").waitFor();
  await page.getByRole("button", { name: "Reset proposal" }).click();
  if (await page.locator("#trade-partner-select").inputValue() !== "" || await page.locator('[data-trade-remove="incomingPlayerIds"]').count() || await page.locator("#trade-results-title").count()) {
    throw new Error("Trade Analyzer reset did not clear partner, incoming selections, and previous result.");
  }

  if (pageErrors.length) throw new Error(`Trade Analyzer browser page errors: ${pageErrors.join(" | ")}`);
  await context.close();
  console.log("Trade Analyzer browser smoke passed.");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
