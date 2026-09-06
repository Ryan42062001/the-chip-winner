import { EspnSnapshotProvider } from "./providers/espn/espn-provider.js";
import { FutureProjectionProvider } from "./providers/projections/future-projection-provider.js";
import { ProjectionIdentityMapProvider } from "./providers/projections/projection-identity-map.js";
import { WeeklyProjectionUpdateProvider } from "./providers/projections/weekly-projection-update-provider.js";
import { PlanningPreferences } from "./application/planning-preferences.js";
import { importProjectionBundle } from "./application/projection-import-transaction.js";

const snapshotProvider = new EspnSnapshotProvider();
const projectionProvider = new FutureProjectionProvider();
const identityProvider = new ProjectionIdentityMapProvider();
const weeklyProvider = new WeeklyProjectionUpdateProvider();
const planningPreferences = new PlanningPreferences();
const button = document.querySelector("#weekly-projection-update-button");
const noticeRegion = document.querySelector("#notice-region");
const sourceTime = document.querySelector("#source-time");
const CHECK_COOLDOWN_MS = 15 * 60 * 1000;
let availability = null;
let checking = null;
let lastCheckAt = 0;
let observerTimer = null;

function realEspnSnapshot() {
  const snapshot = snapshotProvider.readCache();
  if (!snapshot || snapshot.provider !== "espn" || snapshot.meta?.kind === "sample") return null;
  const season = Number(snapshot.league?.season);
  const week = Number(snapshot.currentWeek);
  return Number.isInteger(season) && Number.isInteger(week) && week >= 1 && week <= 18 ? snapshot : null;
}

function showNotice(message, kind = "success") {
  if (!noticeRegion) return;
  const notice = document.createElement("div");
  notice.className = `notice ${kind}`;
  notice.append(document.createTextNode(message));
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.setAttribute("aria-label", "Dismiss");
  dismiss.textContent = "×";
  dismiss.addEventListener("click", () => notice.remove());
  noticeRegion.replaceChildren(notice);
  notice.append(dismiss);
}

function sourceLabel(value) {
  if (!value?.publishedAt) return "";
  const date = new Date(value.publishedAt);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : value.publishedAt;
}

function renderButton(snapshot = realEspnSnapshot()) {
  if (!button) return;
  button.hidden = !snapshot;
  if (!snapshot) return;
  const week = snapshot.currentWeek;
  button.disabled = availability?.status === "checking" || availability?.status === "updating";
  if (availability?.status === "checking") button.textContent = "Checking projections…";
  else if (availability?.status === "updating") button.textContent = `Updating Week ${week}…`;
  else if (availability?.status === "available") button.textContent = `Update Week ${week} projections`;
  else if (availability?.status === "refresh-available") button.textContent = `Refresh Week ${week} projections`;
  else if (availability?.status === "identity-refresh-available") button.textContent = `Refresh Week ${week} player IDs`;
  else if (availability?.status === "current") button.textContent = `Week ${week} projections current`;
  else if (availability?.status === "waiting-source-refresh") button.textContent = `Week ${week} source pending`;
  else if (availability?.status === "stale-source") button.textContent = "Projection source stale";
  else button.textContent = "Check projections";
  button.title = availability?.reason ? `${availability.reason}${availability.publishedAt ? ` Published ${sourceLabel(availability)}.` : ""}` : "Check the latest free weekly projection publication.";
}

async function checkForUpdate({ announce = false, force = false } = {}) {
  const snapshot = realEspnSnapshot();
  renderButton(snapshot);
  if (!snapshot) return null;
  if (!force && Date.now() - lastCheckAt < CHECK_COOLDOWN_MS && availability) return availability;
  if (checking) return checking;
  availability = { status: "checking" };
  renderButton(snapshot);
  checking = weeklyProvider.check({ season: Number(snapshot.league.season), week: Number(snapshot.currentWeek), projectionSet: projectionProvider.readCache() })
    .then((result) => {
      availability = result;
      lastCheckAt = Date.now();
      renderButton(snapshot);
      if (announce) showNotice(`${result.reason}${result.publishedAt ? ` Latest source publication: ${sourceLabel(result)}.` : ""}`, result.canUpdate ? "success" : result.status === "current" || result.status === "waiting-source-refresh" ? "success" : "error");
      return result;
    })
    .catch((error) => {
      availability = { status: "error", canUpdate: false, reason: error.message };
      lastCheckAt = Date.now();
      renderButton(snapshot);
      if (announce) showNotice(`Could not check weekly projections: ${error.message}`, "error");
      return availability;
    })
    .finally(() => { checking = null; });
  return checking;
}

async function updateCurrentWeek() {
  const snapshot = realEspnSnapshot();
  if (!snapshot) throw new Error("Refresh a connected ESPN league before updating weekly projections.");
  const checked = availability?.canUpdate ? availability : await checkForUpdate({ announce: false, force: true });
  if (!checked?.canUpdate) {
    showNotice(`${checked?.reason || "No weekly projection update is available."}${checked?.publishedAt ? ` Latest source publication: ${sourceLabel(checked)}.` : ""}`, checked?.status === "current" || checked?.status === "waiting-source-refresh" ? "success" : "error");
    return;
  }

  const identityRefreshOnly = checked.status === "identity-refresh-available";
  availability = { ...checked, status: "updating" };
  renderButton(snapshot);
  try {
    const season = Number(snapshot.league.season);
    const week = Number(snapshot.currentWeek);
    const staged = await weeklyProvider.stage({ season, week, projectionSet: projectionProvider.readCache() });
    const imported = importProjectionBundle({
      projectionProvider,
      identityProvider,
      projectionsCsv: staged.bundle.projectionsCsv,
      identityMapCsv: staged.bundle.identityMapCsv
    });
    const importedWeeks = [...new Set(imported.projectionSet.projections.map((record) => record.week))].sort((a, b) => a - b);
    planningPreferences.save(importedWeeks);
    weeklyProvider.saveReceipt({ season, week, bundle: staged.bundle, diagnostics: staged.diagnostics, playerIdsPublishedAt: staged.playerIdsPublishedAt });
    availability = { status: "current", canUpdate: false, publishedAt: staged.bundle.publishedAt, playerIdsPublishedAt: staged.playerIdsPublishedAt, reason: `Week ${week} projections and player identities are current.` };
    renderButton(snapshot);
    const summary = identityRefreshOnly
      ? `Week ${week} player identities refreshed: ${staged.bundle.mappedCount}/${staged.bundle.sourceRecordCount} source rows now have stable ESPN mappings.`
      : `Week ${week} projections updated: ${staged.bundle.mappedCount}/${staged.bundle.sourceRecordCount} source rows mapped.`;
    showNotice(`${summary} ${staged.bundle.unresolvedProviderIds.length} unsupported identity rows stayed excluded. Reloading the dashboard…`);
    setTimeout(() => location.reload(), 700);
  } catch (error) {
    availability = { status: "error", canUpdate: false, reason: error.message };
    renderButton(snapshot);
    showNotice(`Weekly projection update failed safely: ${error.message}`, "error");
  }
}

button?.addEventListener("click", () => {
  if (availability?.canUpdate) updateCurrentWeek();
  else checkForUpdate({ announce: true, force: true });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#clear-future-projections-button")) {
    weeklyProvider.clearCache();
    availability = null;
    lastCheckAt = 0;
  }
});

if (sourceTime) {
  const observer = new MutationObserver(() => {
    clearTimeout(observerTimer);
    observerTimer = setTimeout(() => checkForUpdate({ force: true }), 250);
  });
  observer.observe(sourceTime, { childList: true, subtree: true, characterData: true });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkForUpdate();
});
window.addEventListener("focus", () => checkForUpdate());
setTimeout(() => checkForUpdate({ force: true }), 500);
