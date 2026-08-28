const CACHE_KEY = "chip-winner:onboarding:v1";
const MODES = new Set(["connection", "sample"]);

export class OnboardingPreferences {
  constructor({ storage = globalThis.localStorage } = {}) { this.storage = storage; }
  read() { try { const value = JSON.parse(this.storage?.getItem(CACHE_KEY) || "null"); return value && MODES.has(value.mode) ? Object.freeze({ mode: value.mode }) : null; } catch { return null; } }
  complete(mode) { if (!MODES.has(mode)) throw new Error("Onboarding mode must be connection or sample."); const value = Object.freeze({ mode }); this.storage?.setItem(CACHE_KEY, JSON.stringify(value)); return value; }
  clear() { this.storage?.removeItem(CACHE_KEY); }
}
