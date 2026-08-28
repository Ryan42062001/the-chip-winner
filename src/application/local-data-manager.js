export class LocalDataManager {
  constructor({ providers = [], storage = globalThis.localStorage, extraKeys = [] } = {}) { this.providers = providers; this.storage = storage; this.extraKeys = extraKeys; }
  clearAll() { for (const provider of this.providers) provider?.clearCache?.(); for (const key of this.extraKeys) this.storage?.removeItem(key); }
}
