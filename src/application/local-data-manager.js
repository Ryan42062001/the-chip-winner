const DEFAULT_LOCAL_DATA_KEYS = Object.freeze([
  "chip-winner:weekly-projection-updates:v1"
]);

export class LocalDataManager {
  constructor({ providers = [], storage = globalThis.localStorage, extraKeys = [] } = {}) {
    this.providers = providers;
    this.storage = storage;
    this.extraKeys = [...new Set([...DEFAULT_LOCAL_DATA_KEYS, ...extraKeys])];
  }
  clearAll() {
    for (const provider of this.providers) provider?.clearCache?.();
    for (const key of this.extraKeys) this.storage?.removeItem(key);
  }
}
