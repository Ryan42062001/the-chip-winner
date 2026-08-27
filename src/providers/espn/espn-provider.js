import { validateLeagueSnapshot } from "../../domain/model.js";

const CACHE_KEY = "chip-winner:espn-snapshot:v1";
const PREVIOUS_CACHE_KEY = "chip-winner:espn-snapshot:previous:v1";

export class EspnSnapshotProvider {
  constructor({ storage = globalThis.localStorage, sampleUrl = "./src/data/sample-espn-snapshot.json" } = {}) {
    this.storage = storage;
    this.sampleUrl = sampleUrl;
  }

  async load() {
    const cached = this.readCache();
    if (cached) return { snapshot: cached, previousSnapshot: this.readPreviousSnapshot(), source: "cache" };
    const response = await fetch(this.sampleUrl);
    if (!response.ok) throw new Error(`Could not load sample snapshot (${response.status}).`);
    const sample = await response.json();
    this.assertValid(sample);
    return { snapshot: sample, source: "sample" };
  }

  importSnapshot(text) {
    let snapshot;
    try { snapshot = JSON.parse(text); }
    catch { throw new Error("That file is not valid JSON."); }
    this.assertValid(snapshot);
    const imported = { ...snapshot, meta: { ...(snapshot.meta || {}), importedAt: new Date().toISOString() } };
    return this.saveSnapshot(imported);
  }

  readCache() {
    const raw = this.storage?.getItem(CACHE_KEY);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      this.assertValid(value);
      return value;
    } catch {
      this.storage?.removeItem(CACHE_KEY);
      return null;
    }
  }

  readPreviousSnapshot() {
    const raw = this.storage?.getItem(PREVIOUS_CACHE_KEY);
    if (!raw) return null;
    try { const value = JSON.parse(raw); this.assertValid(value); return value; }
    catch { this.storage?.removeItem(PREVIOUS_CACHE_KEY); return null; }
  }

  clearCache() { this.storage?.removeItem(CACHE_KEY); this.storage?.removeItem(PREVIOUS_CACHE_KEY); }

  saveSnapshot(snapshot) {
    this.assertValid(snapshot);
    const current = this.readCache();
    if (current) this.storage?.setItem(PREVIOUS_CACHE_KEY, JSON.stringify(current));
    this.storage?.setItem(CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }

  assertValid(snapshot) {
    const errors = validateLeagueSnapshot(snapshot);
    if (errors.length) throw new Error(`Snapshot validation failed: ${errors.join(" ")}`);
  }
}
