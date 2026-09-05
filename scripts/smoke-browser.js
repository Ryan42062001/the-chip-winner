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

function makeIrHardeningSnapshot(base, { status = "OUT", fillIr = false } = {}) {
  const snapshot = structuredClone(base);
  snapshot.meta = { ...(snapshot.meta || {}), capturedAt: "2026-09-05T12:00:00.000Z" };
  snapshot.league = {
    ...snapshot.league,
    lineupSlots: [
      { slot: "QB", count: 1 },
      { slot: "RB", count: 2 },
      { slot: "WR", count: 2 },
      { slot: "TE", count: 1 },
      { slot: "FLEX", count: 1 },
      { slot: "K", count: 1 },
      { slot: "D/ST", count: 1 },
      { slot: "BE", count: 5 },
      { slot: "IR", count: 1 }
    ],
    rosterRules: { size: 15, positionLimits: [] },
    waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
  };
  snapshot.teams = snapshot.teams.map((team) => team.id === "t1" ? {
    ...team,
    acquisition: { waiverRank: 3, seasonAcquisitions: 0, matchupAcquisitions: 0 }
  } : team);
  snapshot.players = snapshot.players.map((item) => item.id === "p13" ? {
    ...item,
    injury: { ...(item.injury || {}), status }
  } : item);
  snapshot.players.push({
    id: "ir-hardening-add",
    name: "Hardening Receiver",
    position: "WR",
    proTeam: "SEA",
    opponent: "SF",
    gameTime: null,
    projection: 30,
    seasonAverage: 16,
    byeWeek: 8,
    injury: { status: "ACTIVE" }
  });
  snapshot.availablePlayers = ["ir-hardening-add"];
  if (fillIr) {
    snapshot.players.push({
      id: "ir-hardening-stash",
      name: "Existing IR Stash",
      position: "WR",
      proTeam: "MIA",
      opponent: "NE",
      gameTime: null,
      projection: 2,
      seasonAverage: 4,
      byeWeek: 12,
      injury: { status: "OUT" }
    });
    const roster = snapshot.rosters.find((item) => item.teamId === "t1");
    roster.entries.push({ playerId: "ir-hardening-stash", lineupSlot: "IR" });
    snapshot.league.rosterRules.size = 15;
  }
  return snapshot;
}

function makeIrFutureInputs(snapshot, { omitProjectionId = null } = {}) {
  const capturedAt = "2026-09-05T12:00:00.000Z";
  const projections = snapshot.players
    .filter((item) => item.id !== omitProjectionId)
    .map((item, index) => ({
      providerPlayerId: `ir-provider-${item.id}`,
      week: 7,
      points: item.id === "ir-hardening-add" ? 30 : Number.isFinite(item.projection) ? item.projection : 8 + (index % 5),
      capturedAt
    }));
  const identityEntries = snapshot.players.map((item) => ({
    providerPlayerId: `ir-provider-${item.id}`,
    espnPlayerId: item.id
  }));
  return {
    projectionSet: {
      provider: "IR hardening fixture",
      scoringFormat: "PPR",
      season: 2026,
      capturedAt,
      projections
    },
    identityEntries
  };
}

async function openIrSeasonPlan(browser, baseSnapshot, options = {}) {
  const snapshot = makeIrHardeningSnapshot(baseSnapshot, options);
  const { projectionSet, identityEntries } = makeIrFutureInputs(snapshot, options);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(({ snapshotValue, projectionValue, identityValue }) => {
    localStorage.setItem("chip-winner:espn-snapshot:v1", JSON.stringify(snapshotValue));
    localStorage.setItem("chip-winner:future-projections:v1", JSON.stringify(projectionValue));
    localStorage.setItem("chip-winner:projection-identity-map:v1", JSON.stringify(identityValue));
    localStorage.setItem("chip-winner:onboarding:v1", JSON.stringify({ mode: "sample" }));
  }, { snapshotValue: snapshot, projectionValue: projectionSet, identityValue: identityEntries });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${origin}/#season`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Season Plan", level: 2 }).waitFor();
  return { context, page, pageErrors };
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
  await page.locator("#onboarding-league-id").fill("123456");
  await page.locator("#onboarding-season-id").fill("2026");
  await page.locator("#onboarding-team-id").fill("2");
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
  await page.locator(".comparison-confidence").waitFor();
  await page.getByText(/not the chance a player succeeds/).waitFor();
  await page.locator('a[data-section="league"]').click();
  await page.getByRole("heading", { name: "Standings overview", level: 3 }).waitFor();
  await page.getByRole("heading", { name: "Reported schedule", level: 3 }).waitFor();
  await page.locator("#fantasypros-manual-input").setInputFiles([
    { name: "FantasyPros_QB.csv", mimeType: "text/csv", buffer: Buffer.from("Player,Team,FPTS\nManual QB,PHI,21.4") },
    { name: "FantasyPros_FLX.csv", mimeType: "text/csv", buffer: Buffer.from("Player,Team,POS,FPTS\nManual RB,DAL,RB,12.2") },
    { name: "FantasyPros_K.csv", mimeType: "text/csv", buffer: Buffer.from("Player,Team,FPTS\nManual K,BUF,8.1") },
    { name: "FantasyPros_DST.csv", mimeType: "text/csv", buffer: Buffer.from("Player,Team,FPTS\nManual DST,SF,7.3") },
  ]);
  await page.locator("#fantasypros-manual-dialog[open]").waitFor();
  await page.locator("#manual-profile-url").fill("https://www.fantasypros.com/nfl/players/manual-qb.php");
  const mappedEspnId = await page.locator("#manual-espn-player").inputValue();
  await page.getByRole("button", { name: "Approve mapping" }).click();
  await page.getByText("1 approved mapping", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Import approved players" }).click();
  if (await page.locator("#fantasypros-manual-dialog").isVisible()) throw new Error("Manual FantasyPros import did not close after a valid explicit mapping.");
  await page.getByText("FantasyPros manual CSV", { exact: true }).waitFor();
  await page.locator('a[data-section="overview"]').click();
  await page.locator(`[data-player-id="${mappedEspnId}"]`).first().click();
  await page.locator("#player-dialog[open]").getByText("21.4 pts", { exact: true }).waitFor();
  await page.locator("#player-dialog[open]").getByText(/External: FantasyPros manual CSV/).waitFor();
  await page.getByRole("button", { name: "Close player details" }).click();
  await page.locator('a[data-section="lineup"]').click();
  await page.locator(".external-comparison").getByText(/FantasyPros manual CSV/).waitFor();
  await page.locator(".external-comparison").getByText(/Comparison withheld/).waitFor();
  await page.locator('a[data-section="season"]').click();
  const playoffWeek = page.locator('[data-playoff-week="15"]');
  await playoffWeek.focus(); await playoffWeek.press("Space");
  await page.getByText("Weeks 15", { exact: false }).waitFor();
  if (await playoffWeek.isChecked() === false) throw new Error("Keyboard playoff-week selection did not persist.");
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
  await menu.click(); await mobilePage.locator('a[data-section="season"]').click();
  await mobilePage.locator('[data-playoff-week="16"]').check();
  await mobilePage.getByText("Weeks 16", { exact: false }).waitFor();
  if (await menu.getAttribute("aria-expanded") !== "false") throw new Error("Mobile navigation did not close after selection.");
  await mobile.close();

  const baseSnapshot = await (await fetch(`${origin}/src/data/sample-espn-snapshot.json`)).json();

  const validIr = await openIrSeasonPlan(browser, baseSnapshot);
  await validIr.page.getByText(/move David Njoku to IR · no drop/i).first().waitFor();
  await validIr.page.getByText(/Add Hardening Receiver · move David Njoku to IR · no drop/i).waitFor();
  await validIr.page.getByText(/Selected horizon: \+/).waitFor();
  if (validIr.pageErrors.length) throw new Error(`IR valid-state browser errors: ${validIr.pageErrors.join(" | ")}`);
  await validIr.context.close();

  const incompleteIr = await openIrSeasonPlan(browser, baseSnapshot, { omitProjectionId: "p13" });
  await incompleteIr.page.getByText("Week 7 · blocked", { exact: true }).waitFor();
  await incompleteIr.page.getByText(/Baseline roster projection coverage is incomplete/).first().waitFor();
  await incompleteIr.page.getByText(/move David Njoku to IR · no drop/i).first().waitFor();
  if (incompleteIr.pageErrors.length) throw new Error(`IR incomplete-coverage browser errors: ${incompleteIr.pageErrors.join(" | ")}`);
  await incompleteIr.context.close();

  const staleEligibility = await openIrSeasonPlan(browser, baseSnapshot, { status: "QUESTIONABLE" });
  if (await staleEligibility.page.getByText(/move David Njoku to IR · no drop/i).count()) throw new Error("Season Plan still exposed an IR-assisted path after ESPN changed the bench player to QUESTIONABLE.");
  if (staleEligibility.pageErrors.length) throw new Error(`IR stale-eligibility browser errors: ${staleEligibility.pageErrors.join(" | ")}`);
  await staleEligibility.context.close();

  const filledIr = await openIrSeasonPlan(browser, baseSnapshot, { fillIr: true });
  if (await filledIr.page.getByText(/move David Njoku to IR · no drop/i).count()) throw new Error("Season Plan still exposed an IR-assisted path after the ESPN IR slot was filled.");
  if (filledIr.pageErrors.length) throw new Error(`IR filled-capacity browser errors: ${filledIr.pageErrors.join(" | ")}`);
  await filledIr.context.close();

  console.log("Desktop, mobile, and IR Season Plan browser smoke checks passed.");
} finally {
  await browser?.close();
  server.kill();
}
