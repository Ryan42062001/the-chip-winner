const CACHE_KEY = "chip-winner:dismissed-alerts:v1";

export const alertId = (warning, week) => `${week}:${warning.kind}:${warning.player.id}`;

export class AlertPreferences {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  read() {
    try { const value = JSON.parse(this.storage?.getItem(CACHE_KEY) || "[]"); return new Set(Array.isArray(value) ? value.filter((item) => typeof item === "string") : []); }
    catch { this.clear(); return new Set(); }
  }
  dismiss(id) { const values = this.read(); values.add(id); this.storage?.setItem(CACHE_KEY, JSON.stringify([...values])); }
  restoreAll() { this.clear(); }
  clear() { this.storage?.removeItem(CACHE_KEY); }
}
