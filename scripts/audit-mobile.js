import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import { createMobileSyncFragment, createSyncCredentials } from "../src/sync/crypto.js";
import { publishSyncState } from "../src/sync/sync-session.js";

const port = 4192;
const origin = `http://127.0.0.1:${port}`;
const syncOrigin = "https://the-chip-winner-sync.yc6syr6bkd.workers.dev";
const executablePath = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((candidate) => candidate && existsSync(candidate));

if (!executablePath) throw new Error("Chrome or Chromium was not found. Set CHROME_PATH to run mobile audits.");

const server = spawn(process.execPath, ["scripts/dev-server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "inherit", "inherit"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode != null) throw new Error(`Mobile-audit dev server exited early with code ${server.exitCode}.`);
    try { if ((await fetch(origin)).ok) return; } catch { /* still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local server did not become ready for mobile audit.");
}

async function buildFixture() {
  const snapshot = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));
  const previousSnapshot = structuredClone(snapshot);
  previousSnapshot.meta.capturedAt = "2026-10-08T14:30:00Z";
  const priorPlayer = previousSnapshot.players.find((player) => player.id === "p17");
  if (!priorPlayer) throw new Error("Mobile audit fixture is missing selected-team player p17.");
  priorPlayer.projection = 15.2;

  const credentials = await createSyncCredentials();
  let envelope = null;
  await publishSyncState({ publish: async (value) => { envelope = value; } }, credentials, snapshot, null, "t2", previousSnapshot);
  if (!envelope) throw new Error("Mobile audit could not create an encrypted sync envelope.");
  return { snapshot, previousSnapshot, credentials, envelope, fragment: createMobileSyncFragment(credentials) };
}

function allowCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Cache-Control": "no-store",
  };
}

async function routeSync(context, envelope, { revoked = false } = {}) {
  await context.route(`${syncOrigin}/v1/channels/**`, async (route) => {
    const method = route.request().method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: allowCorsHeaders(), body: "" });
      return;
    }
    if (method === "GET") {
      await route.fulfill({
        status: revoked ? 404 : 200,
        headers: { ...allowCorsHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(revoked ? { error: "not_found" } : envelope),
      });
      return;
    }
    await route.fulfill({ status: 405, headers: allowCorsHeaders(), body: "" });
  });
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

async function assertTouchTargets(page, label) {
  const menu = page.locator(".mobile-menu");
  const menuBox = await menu.boundingBox();
  if (!menuBox || menuBox.width < 44 || menuBox.height < 44) throw new Error(`${label} mobile menu is smaller than 44x44 CSS pixels.`);
  await menu.click();
  const navBoxes = await page.locator(".nav-link").evaluateAll((links) => links.map((link) => {
    const rect = link.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (navBoxes.some((box) => box.height < 44)) throw new Error(`${label} contains a primary navigation target shorter than 44 CSS pixels.`);
  await page.keyboard.press("Escape");
  if (await menu.getAttribute("aria-expanded") !== "false") throw new Error(`${label} Escape did not close the mobile navigation.`);
  if (await menu.getAttribute("aria-label") !== "Open navigation") throw new Error(`${label} Escape did not reset the mobile navigation label.`);
}

async function openMenuIfNeeded(page) {
  const menu = page.locator(".mobile-menu");
  if (await menu.isVisible() && await menu.getAttribute("aria-expanded") !== "true") await menu.click();
}

const titleBySection = {
  overview: "Weekly command center",
  lineup: "Lineup Lab",
  waivers: "Waiver Wire",
  alerts: "Player Alerts",
  changes: "What Changed",
  season: "Season Plan",
  league: "League Setup",
};

async function goToSyncSection(page, section, fragment, label) {
  await openMenuIfNeeded(page);
  const link = page.locator(`a[data-sync-section="${section}"]`).first();
  await link.waitFor();
  await link.click();
  await page.locator("#page-title").getByText(titleBySection[section], { exact: true }).waitFor();
  if (new URL(page.url()).hash !== fragment) throw new Error(`${label} ${section} navigation discarded or changed the private sync fragment.`);
  await assertNoHorizontalOverflow(page, `${label} ${section}`);
}

async function auditSyncedPhone(browser, fixture, viewport, label) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  await routeSync(context, fixture.envelope);
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${origin}/${fixture.fragment}`, { waitUntil: "networkidle" });
  await page.locator("#app-content .page-head").waitFor();

  if (await page.locator("body").getAttribute("data-app-source") !== "sync") throw new Error(`${label} did not enter synced mobile viewer mode.`);
  if (await page.locator("#team-select").inputValue() !== "t2") throw new Error(`${label} did not restore the desktop-selected team.`);
  if (!await page.locator(".team-picker").isVisible()) throw new Error(`${label} does not visibly identify the selected fantasy team.`);
  for (const selector of ["#connect-button", "#weekly-projection-update-button", "#import-button", "#rankings-button", "#reset-button"]) {
    if (await page.locator(selector).isVisible()) throw new Error(`${label} exposes desktop-only topbar control ${selector} in synced viewer mode.`);
  }
  if (new URL(page.url()).hash !== fixture.fragment) throw new Error(`${label} changed the private fragment during initial load.`);
  await assertNoHorizontalOverflow(page, `${label} initial overview`);
  await assertTouchTargets(page, label);

  // Exercise an in-content route, not just the hamburger links.
  const quickLink = page.locator('#app-content a[data-sync-section="lineup"]').first();
  await quickLink.click();
  await page.locator("#page-title").getByText("Lineup Lab", { exact: true }).waitFor();
  if (new URL(page.url()).hash !== fixture.fragment) throw new Error(`${label} in-content navigation discarded the private sync fragment.`);

  for (const section of ["overview", "lineup", "waivers", "alerts", "changes", "season", "league"]) {
    await goToSyncSection(page, section, fixture.fragment, label);
  }

  // The prior encrypted capture must make What Changed functional on the phone.
  await goToSyncSection(page, "changes", fixture.fragment, label);
  if (await page.getByText("One more refresh needed", { exact: true }).count()) throw new Error(`${label} lost the encrypted prior ESPN capture needed by What Changed.`);
  await page.locator(".timeline-summary").waitFor();

  // League Setup in sync mode is read-only. The only interactive control is a GET-only freshness check.
  await goToSyncSection(page, "league", fixture.fragment, label);
  await page.getByRole("heading", { level: 3, name: "Synced mobile viewer" }).waitFor();
  await page.getByRole("heading", { level: 3, name: "Private synced viewer" }).waitFor();
  if (await page.getByRole("button", { name: "Create mobile link" }).count()) throw new Error(`${label} incorrectly offers a nested mobile link from the synced phone.`);
  const visibleLeagueButtons = page.locator(".league-grid button:visible");
  if (await visibleLeagueButtons.count() !== 1) throw new Error(`${label} exposes unexpected synced League Setup controls.`);
  const checkButton = page.getByRole("button", { name: "Check for updates" });
  if (!await checkButton.isVisible()) throw new Error(`${label} is missing the read-only mobile freshness check.`);
  await checkButton.click();
  await page.getByText("Mobile data is already current.", { exact: true }).waitFor();
  if (new URL(page.url()).hash !== fixture.fragment) throw new Error(`${label} freshness check changed the private sync fragment.`);

  // Return to overview and exercise player detail at the real mobile dimensions.
  await goToSyncSection(page, "overview", fixture.fragment, label);
  await page.locator(".player-row").first().click();
  await page.locator("#player-dialog[open]").waitFor();
  const dialogMetrics = await page.locator("#player-dialog").evaluate((dialog) => ({
    width: dialog.getBoundingClientRect().width,
    viewport: document.documentElement.clientWidth,
    scrollHeight: dialog.scrollHeight,
    clientHeight: dialog.clientHeight,
  }));
  if (dialogMetrics.width > dialogMetrics.viewport + 1) throw new Error(`${label} player detail is wider than the viewport.`);
  if (dialogMetrics.clientHeight <= 0) throw new Error(`${label} player detail has no usable visible height.`);
  await page.getByRole("button", { name: "Close player details" }).click();

  // Navigation must not make the private link non-reloadable.
  await goToSyncSection(page, "waivers", fixture.fragment, label);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#app-content .page-head").waitFor();
  if (await page.locator("#team-select").inputValue() !== "t2") throw new Error(`${label} reload after navigation did not restore the synced team.`);
  if (new URL(page.url()).hash !== fixture.fragment) throw new Error(`${label} reload lost the private sync fragment.`);

  if (pageErrors.length) throw new Error(`${label} browser errors: ${pageErrors.join(" | ")}`);
  await context.close();
}

async function auditInvalidLinks(browser, fixture) {
  const revokedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await routeSync(revokedContext, fixture.envelope, { revoked: true });
  const revokedPage = await revokedContext.newPage();
  // Invalid-link gates care about the app's terminal error state, not unrelated global network idleness.
  await revokedPage.goto(`${origin}/${fixture.fragment}`, { waitUntil: "domcontentloaded" });
  await revokedPage.getByText("This mobile sync link has expired or was revoked.", { exact: true }).waitFor({ timeout: 10000 });
  if (await revokedPage.locator(".player-row").count()) throw new Error("Revoked mobile link silently fell back to local/sample league data.");
  await assertNoHorizontalOverflow(revokedPage, "Revoked mobile link error state");
  await revokedContext.close();

  const malformedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const malformedPage = await malformedContext.newPage();
  await malformedPage.goto(`${origin}/#mobile-sync=bad.bad`, { waitUntil: "domcontentloaded" });
  await malformedPage.getByText(/private mobile sync link is malformed/i).waitFor({ timeout: 10000 });
  if (await malformedPage.locator(".player-row").count()) throw new Error("Malformed mobile link silently fell back to local/sample league data.");
  await assertNoHorizontalOverflow(malformedPage, "Malformed mobile link error state");
  await malformedContext.close();
}

let browser;
try {
  await waitForServer();
  const fixture = await buildFixture();
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });

  await auditSyncedPhone(browser, fixture, { width: 320, height: 568 }, "320x568 small phone");
  await auditSyncedPhone(browser, fixture, { width: 390, height: 844 }, "390x844 representative phone");
  await auditSyncedPhone(browser, fixture, { width: 844, height: 390 }, "844x390 phone landscape");
  await auditInvalidLinks(browser, fixture);

  console.log("Synced mobile audit passed at 320x568, 390x844, and 844x390 across all seven sections, selected-team restoration, prior-state changes, private-fragment navigation/reload, read-only update checks, player detail, touch targets, Escape/ARIA navigation reset, revoked links, and malformed links.");
} finally {
  await browser?.close();
  server.kill();
}
