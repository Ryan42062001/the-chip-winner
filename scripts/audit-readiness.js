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

async function assertCompactDesktopShell(page, label) {
  const metrics = await page.evaluate(() => {
    const sidebar = document.querySelector(".sidebar");
    const menu = document.querySelector(".mobile-menu");
    const topbar = document.querySelector(".topbar");
    return {
      menuDisplay: getComputedStyle(menu).display,
      sidebarRight: sidebar.getBoundingClientRect().right,
      topbarDisplay: getComputedStyle(topbar).display,
    };
  });
  if (metrics.menuDisplay === "none") throw new Error(`${label} did not expose the compact navigation trigger.`);
  if (metrics.sidebarRight > 2) throw new Error(`${label} left the desktop sidebar consuming content width (${metrics.sidebarRight}px right edge).`);
  if (metrics.topbarDisplay !== "grid") throw new Error(`${label} did not switch the header to compact two-row reflow.`);
}

async function assertSidebarNavigationReachable(page, label) {
  const menu = page.locator(".mobile-menu");
  if (await menu.getAttribute("aria-expanded") !== "true") await menu.click();

  const metrics = await page.evaluate(() => {
    const nav = document.querySelector(".sidebar > nav");
    const league = nav?.querySelector('a[data-section="league"]');
    if (!nav || !league) return null;

    const overflowY = getComputedStyle(nav).overflowY;
    const beforeScrollTop = nav.scrollTop;
    nav.scrollTop = nav.scrollHeight;
    const navRect = nav.getBoundingClientRect();
    const leagueRect = league.getBoundingClientRect();

    return {
      overflowY,
      beforeScrollTop,
      afterScrollTop: nav.scrollTop,
      clientHeight: nav.clientHeight,
      scrollHeight: nav.scrollHeight,
      navTop: navRect.top,
      navBottom: navRect.bottom,
      leagueTop: leagueRect.top,
      leagueBottom: leagueRect.bottom,
    };
  });

  if (!metrics) throw new Error(`${label} could not find the sidebar navigation or League Setup link.`);
  if (!['auto', 'scroll'].includes(metrics.overflowY)) {
    throw new Error(`${label} sidebar navigation is not vertically scrollable (overflow-y: ${metrics.overflowY}).`);
  }
  if (metrics.scrollHeight > metrics.clientHeight + 1 && metrics.afterScrollTop <= metrics.beforeScrollTop) {
    throw new Error(`${label} sidebar navigation overflowed but could not scroll.`);
  }
  if (metrics.leagueTop < metrics.navTop - 1 || metrics.leagueBottom > metrics.navBottom + 1) {
    throw new Error(`${label} could not bring League Setup into the visible sidebar navigation region.`);
  }

  await page.locator('a[data-section="league"]').click();
  await page.getByRole("heading", { level: 2, name: "League Setup" }).waitFor();
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

  // The real field case was a 1920x1050 desktop at 200% Chrome zoom: roughly a 960x525 CSS-pixel viewport.
  const wideZoomContext = await browser.newContext({ viewport: { width: 960, height: 525 } });
  const wideZoomPage = await wideZoomContext.newPage();
  await openSample(wideZoomPage);
  await assertCompactDesktopShell(wideZoomPage, "1920x1050-at-200%-equivalent shell");
  await assertNoHorizontalOverflow(wideZoomPage, "1920x1050-at-200%-equivalent overview");
  await assertSidebarNavigationReachable(wideZoomPage, "1920x1050-at-200%-equivalent shell");
  await auditSections(wideZoomPage, "1920x1050-at-200%-equivalent");
  await wideZoomContext.close();

  // A 1440x900 desktop at 200% browser zoom exposes roughly a 720x450 CSS-pixel viewport.
  const zoomContext = await browser.newContext({ viewport: { width: 720, height: 450 } });
  const zoomPage = await zoomContext.newPage();
  await openSample(zoomPage);
  await assertNoHorizontalOverflow(zoomPage, "1440x900-at-200%-equivalent overview");
  await assertSidebarNavigationReachable(zoomPage, "1440x900-at-200%-equivalent shell");
  await auditSections(zoomPage, "1440x900-at-200%-equivalent");
  await zoomContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await openSample(mobilePage);
  await assertNoHorizontalOverflow(mobilePage, "390px phone overview");
  await auditSections(mobilePage, "390px phone");
  await mobileContext.close();

  console.log("Production-readiness reflow audit passed at 960x525 and 720x450 200%-equivalent desktop viewports plus 390x844 mobile across all primary sections, including scroll-reachable League Setup navigation.");
} finally {
  await browser?.close();
  server.kill();
}
