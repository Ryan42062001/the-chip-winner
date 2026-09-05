import {
  buildDynastyProcessWeeklyBundle,
  DYNASTYPROCESS_WEEKLY_PROVIDER,
  parseDynastyProcessWeeklyCsv
} from "../../../scripts/lib/dynastyprocess-weekly.js";
import { classifyDynastyProcessWeeklyGaps } from "../../../scripts/lib/dynastyprocess-weekly-diagnostics.js";

export const WEEKLY_PROJECTION_SOURCE_URLS = Object.freeze({
  weekly: "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv",
  playerIds: "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv",
  publication: "https://api.github.com/repos/dynastyprocess/data/commits?path=files/fp_latest_weekly.csv&per_page=1"
});

const RECEIPT_CACHE_KEY = "chip-winner:weekly-projection-updates:v1";
const MAX_SOURCE_AGE_MS = 8 * 24 * 60 * 60 * 1000;

function validateTarget(season, week) {
  if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error("A valid ESPN season is required before checking weekly projections.");
  if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("A valid ESPN current week from 1 through 18 is required before checking weekly projections.");
}

function latestWeekCapture(projectionSet, week) {
  const captures = (projectionSet?.projections || [])
    .filter((record) => record.week === week)
    .map((record) => Date.parse(record.capturedAt))
    .filter(Number.isFinite);
  return captures.length ? Math.max(...captures) : null;
}

function availabilityFromSource({ source, season, week, projectionSet, now }) {
  if (Number(source.sourceDate.slice(0, 4)) !== season) {
    return Object.freeze({ status: "season-mismatch", canUpdate: false, reason: `Latest source scrape ${source.sourceDate} does not match ESPN season ${season}.`, ...source });
  }
  const publishedMs = Date.parse(source.publishedAt);
  if (!Number.isFinite(publishedMs)) throw new Error("Weekly projection source publication time is invalid.");
  if (publishedMs - now > 5 * 60 * 1000) {
    return Object.freeze({ status: "invalid-source-time", canUpdate: false, reason: "Weekly projection source publication time is in the future.", ...source });
  }
  const currentCapture = latestWeekCapture(projectionSet, week);
  const previousCapture = week > 1 ? latestWeekCapture(projectionSet, week - 1) : null;
  if (currentCapture != null && publishedMs <= currentCapture) {
    return Object.freeze({ status: "current", canUpdate: false, reason: `Week ${week} already has this projection publication or a newer one.`, ...source });
  }
  if (currentCapture == null && previousCapture != null && publishedMs <= previousCapture) {
    return Object.freeze({ status: "waiting-source-refresh", canUpdate: false, reason: `ESPN is on Week ${week}, but the weekly source has not published anything newer than the stored Week ${week - 1} data.`, ...source });
  }
  if (now - publishedMs > MAX_SOURCE_AGE_MS) {
    return Object.freeze({ status: "stale-source", canUpdate: false, reason: "The latest weekly projection publication is more than eight days old, so it will not be labeled as the current ESPN week.", ...source });
  }
  return Object.freeze({
    status: currentCapture == null ? "available" : "refresh-available",
    canUpdate: true,
    firstImport: currentCapture == null && previousCapture == null,
    reason: currentCapture == null ? `A newer weekly source can be explicitly loaded for ESPN Week ${week}.` : `A newer weekly source is available to refresh ESPN Week ${week}.`,
    ...source
  });
}

export class WeeklyProjectionUpdateProvider {
  constructor({ fetchImpl = null, storage = globalThis.localStorage, now = () => Date.now(), urls = WEEKLY_PROJECTION_SOURCE_URLS } = {}) {
    this.fetchImpl = fetchImpl || ((...args) => globalThis.fetch(...args));
    this.storage = storage;
    this.now = now;
    this.urls = urls;
  }

  async fetchText(url, accept = "text/plain,*/*") {
    const response = await this.fetchImpl(url, { headers: { accept } });
    if (!response?.ok) throw new Error(`Weekly projection source request failed (${response?.status ?? "unknown"}).`);
    return response.text();
  }

  async inspectSource() {
    const [weeklyCsv, commitsText] = await Promise.all([
      this.fetchText(this.urls.weekly),
      this.fetchText(this.urls.publication, "application/vnd.github+json")
    ]);
    const commits = JSON.parse(commitsText);
    const publishedAt = commits?.[0]?.commit?.committer?.date || commits?.[0]?.commit?.author?.date || null;
    if (!publishedAt || !Number.isFinite(Date.parse(publishedAt))) throw new Error("Weekly projection publication lookup did not return a valid timestamp.");
    const parsed = parseDynastyProcessWeeklyCsv(weeklyCsv);
    return Object.freeze({ weeklyCsv, sourceDate: parsed.sourceDate, publishedAt: new Date(publishedAt).toISOString() });
  }

  async check({ season, week, projectionSet = null }) {
    validateTarget(season, week);
    const source = await this.inspectSource();
    return availabilityFromSource({ source, season, week, projectionSet, now: this.now() });
  }

  async stage({ season, week, projectionSet = null }) {
    validateTarget(season, week);
    const source = await this.inspectSource();
    const availability = availabilityFromSource({ source, season, week, projectionSet, now: this.now() });
    if (!availability.canUpdate) throw new Error(availability.reason);
    const playerIdsCsv = await this.fetchText(this.urls.playerIds);
    const bundle = buildDynastyProcessWeeklyBundle({ weeklyCsv: source.weeklyCsv, playerIdsCsv, season, week, publishedAt: source.publishedAt });
    const diagnostics = classifyDynastyProcessWeeklyGaps({ weeklyCsv: source.weeklyCsv, unresolvedProviderIds: bundle.unresolvedProviderIds });
    return Object.freeze({ availability, bundle, diagnostics });
  }

  saveReceipt({ season, week, bundle, diagnostics }) {
    validateTarget(season, week);
    const cache = this.readCache();
    const key = `${season}:${week}`;
    cache[key] = {
      season,
      week,
      provider: DYNASTYPROCESS_WEEKLY_PROVIDER,
      sourceDate: bundle.sourceDate,
      publishedAt: bundle.publishedAt,
      mappedCount: bundle.mappedCount,
      sourceRecordCount: bundle.sourceRecordCount,
      unresolvedCount: bundle.unresolvedProviderIds.length,
      diagnosticCounts: { ...diagnostics.counts }
    };
    this.storage?.setItem(RECEIPT_CACHE_KEY, JSON.stringify(cache));
    return Object.freeze({ ...cache[key], diagnosticCounts: Object.freeze({ ...cache[key].diagnosticCounts }) });
  }

  readReceipt(season, week) {
    return this.readCache()[`${season}:${week}`] || null;
  }

  readCache() {
    try {
      const value = JSON.parse(this.storage?.getItem(RECEIPT_CACHE_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      this.clearCache();
      return {};
    }
  }

  clearCache() { this.storage?.removeItem(RECEIPT_CACHE_KEY); }
}