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

async function assertTradeEntryGeometry(page, { mobile = false } = {}) {
  const send = page.locator('[data-trade-side="send"]');
  const receive = page.locator('[data-trade-side="receive"]');
  const outgoingSelect = send.locator("#trade-outgoing-select");
  const incomingSelect = receive.locator("#trade-incoming-select");
  const outgoingAdd = send.getByRole("button", { name: "Add outgoing" });
  const incomingAdd = receive.getByRole("button", { name: "Add incoming" });
  const [sendBox, receiveBox, outgoingSelectBox, incomingSelectBox, outgoingAddBox, incomingAddBox] = await Promise.all([
    send.boundingBox(), receive.boundingBox(), outgoingSelect.boundingBox(), incomingSelect.boundingBox(), outgoingAdd.boundingBox(), incomingAdd.boundingBox()
  ]);
  if (![sendBox, receiveBox, outgoingSelectBox, incomingSelectBox, outgoingAddBox, incomingAddBox].every(Boolean)) throw new Error("Trade Analyzer input geometry could not be measured.");

  if (mobile) {
    if (receiveBox.y < sendBox.y + sendBox.height - 2) throw new Error("Trade Analyzer Send/Receive sides did not stack vertically on mobile.");
  } else {
    if (Math.abs(sendBox.y - receiveBox.y) > 4) throw new Error("Trade Analyzer Send/Receive sides are not aligned on desktop.");
    if (Math.abs(sendBox.width - receiveBox.width) > 12) throw new Error("Trade Analyzer Send/Receive sides are not balanced on desktop.");
  }

  for (const [selectBox, buttonBox, label] of [
    [outgoingSelectBox, outgoingAddBox, "outgoing"],
    [incomingSelectBox, incomingAddBox, "incoming"]
  ]) {
    const gap = buttonBox.x - (selectBox.x + selectBox.width);
    if (gap < -1 || gap > 18) throw new Error(`Trade Analyzer ${label} Add action is not adjacent to its selector (gap ${gap}).`);
    if (buttonBox.width > 110) throw new Error(`Trade Analyzer ${label} Add action is oversized (${buttonBox.width}px).`);
    if (buttonBox.height < 40) throw new Error(`Trade Analyzer ${label} Add action is below the minimum touch target height.`);
  }
  if (Math.abs(outgoingAddBox.width - incomingAddBox.width) > 3) throw new Error("Trade Analyzer outgoing/incoming Add controls do not use matched compact sizing.");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`Trade Analyzer layout has horizontal overflow of ${overflow}px.`);
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

  await assertTradeEntryGeometry(page);
  if (await page.getByRole("button", { name: "Add outgoing" }).textContent() !== "Add") throw new Error("Trade Analyzer outgoing Add copy is not compact.");
  if (await page.getByRole("button", { name: "Add incoming" }).textContent() !== "Add") throw new Error("Trade Analyzer incoming Add copy is not compact.");

  await page.getByRole("button", { name: "Add outgoing" }).click();
  await page.getByRole("button", { name: "Add incoming" }).click();
  if (await page.locator('[data-trade-remove="outgoingPlayerIds"]').count() !== 1) throw new Error("Trade Analyzer did not add an outgoing player.");
  if (await page.locator('[data-trade-remove="incomingPlayerIds"]').count() !== 1) throw new Error("Trade Analyzer did not add an incoming player.");
  if (await page.locator('[data-trade-side="send"] [data-trade-remove="outgoingPlayerIds"]').count() !== 1) throw new Error("Outgoing selected-player chip is not directly under the Send side.");
  if (await page.locator('[data-trade-side="receive"] [data-trade-remove="incomingPlayerIds"]').count() !== 1) throw new Error("Incoming selected-player chip is not directly under the Receive side.");

  await page.locator("#trade-objective").selectOption("FUTURE_UPSIDE");
  if (await page.locator("#trade-objective").inputValue() !== "FUTURE_UPSIDE") throw new Error("Trade Analyzer objective selection did not persist.");
  await page.getByRole("button", { name: "Analyze proposed trade" }).click();
  await page.locator("#trade-results-title").waitFor();
  await page.getByText(/No ESPN trade mutation/i).waitFor();
  await page.locator(".trade-package-value").getByText("Package value unavailable", { exact: true }).waitFor();
  await page.locator(".trade-package-value").getByText(/No approved package-value source is configured/i).waitFor();
  await page.locator(".trade-roster-decision").getByText(/YOUR ROSTER IMPACT/i).waitFor();
  const livePackageText = await page.locator(".trade-package-value").innerText();
  if (/YOU WIN|FAIR TRADE|THEY WIN|\b\d{1,3}\/\d{1,3}\b/.test(livePackageText)) throw new Error("Live Trade Analyzer exposed a winner or numeric split without an approved package-value source.");

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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#trade-partner-select").selectOption(myTeamId);
  await assertTradeEntryGeometry(page, { mobile: true });

  if (pageErrors.length) throw new Error(`Trade Analyzer browser page errors: ${pageErrors.join(" | ")}`);
  await context.close();

  const ambiguousFixture = JSON.parse(readFileSync("src/data/sample-espn-snapshot.json", "utf8"));
  const ambiguousUserTeamId = ambiguousFixture.teams[0].id;
  const ambiguousUserRoster = ambiguousFixture.rosters.find((item) => item.teamId === ambiguousUserTeamId);
  const duplicateTargetRoster = ambiguousFixture.rosters.find((item) => item.teamId !== ambiguousUserTeamId);
  const ambiguousOutgoingId = ambiguousUserRoster.entries[0].playerId;
  const duplicateEntry = { ...ambiguousUserRoster.entries[0], lineupSlot: "BE" };
  duplicateTargetRoster.entries.push(duplicateEntry);

  const ambiguousContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ambiguousPage = await ambiguousContext.newPage();
  const ambiguousErrors = [];
  ambiguousPage.on("pageerror", (error) => ambiguousErrors.push(error.message));
  await ambiguousPage.route("**/src/data/sample-espn-snapshot.json", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ambiguousFixture) });
  });
  await ambiguousPage.goto(origin, { waitUntil: "networkidle" });
  await ambiguousPage.locator("#onboarding-dialog").waitFor();
  await ambiguousPage.getByRole("button", { name: "Explore sample" }).click();
  await ambiguousPage.locator('a[data-section="trade"]').click();
  await ambiguousPage.getByRole("heading", { name: "Trade Analyzer", level: 2 }).waitFor();

  const outgoingIds = await ambiguousPage.locator("#trade-outgoing-select option").evaluateAll((options) => options.map((option) => option.value));
  if (outgoingIds.includes(ambiguousOutgoingId)) throw new Error("Ambiguously owned outgoing player remained visible in the outgoing selector.");

  await ambiguousPage.locator("#trade-outgoing-select").evaluate((select, playerId) => {
    const option = document.createElement("option");
    option.value = playerId;
    option.textContent = "Tampered ambiguous outgoing";
    select.append(option);
    select.value = playerId;
  }, ambiguousOutgoingId);
  await ambiguousPage.getByRole("button", { name: "Add outgoing" }).click();
  if (await ambiguousPage.locator('[data-trade-remove="outgoingPlayerIds"]').count()) throw new Error("Tampered ambiguous outgoing player was added through the UI.");
  await ambiguousPage.getByRole("alert").getByText(/not eligible for the currently selected trade side and team/i).waitFor();
  if (ambiguousErrors.length) throw new Error(`Trade Analyzer ambiguous-ownership page errors: ${ambiguousErrors.join(" | ")}`);
  await ambiguousContext.close();

  console.log("Trade Analyzer browser smoke passed.");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
