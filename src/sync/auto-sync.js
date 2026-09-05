export function createDesktopAutoPublisher({
  store,
  readCredentials,
  publish,
  onError = () => {},
  schedule = (callback) => queueMicrotask(callback),
}) {
  let scheduled = false;
  let stopped = false;
  let publishing = Promise.resolve();
  const publishActions = new Set(["load/success", "rankings/load", "rankings/clear", "team/select"]);

  const unsubscribe = store?.subscribe?.((nextState, action) => {
    if (stopped || nextState?.source !== "cache" || !publishActions.has(action?.type)) return;
    const credentials = readCredentials();
    if (!credentials?.writeToken) return;
    if (scheduled) return;
    scheduled = true;
    schedule(() => {
      scheduled = false;
      if (stopped) return;
      const latestCredentials = readCredentials();
      if (!latestCredentials?.writeToken) return;
      publishing = publishing
        .then(() => publish(latestCredentials))
        .catch((error) => onError(error));
    });
  });

  return Object.freeze({
    stop() {
      stopped = true;
      unsubscribe?.();
    },
    whenIdle() {
      return publishing;
    },
  });
}

export function createMobileSyncUpdater({
  read,
  reload = () => globalThis.location?.reload?.(),
  onStatus = () => {},
  now = () => Date.now(),
  minIntervalMs = 15000,
}) {
  let credentials = null;
  let publishedAt = null;
  let lastCheckedAt = 0;
  let inFlight = null;

  function activate(nextCredentials, nextPublishedAt) {
    credentials = nextCredentials;
    publishedAt = nextPublishedAt || null;
    lastCheckedAt = 0;
  }

  async function check({ force = false, notifyWhenCurrent = false } = {}) {
    if (!credentials) return Object.freeze({ status: "inactive", updated: false });
    const checkedAt = now();
    if (!force && checkedAt - lastCheckedAt < minIntervalMs) return Object.freeze({ status: "throttled", updated: false });
    if (inFlight) {
      const result = await inFlight;
      if (notifyWhenCurrent && result.status === "current") onStatus("Mobile data is already current.", "success");
      return result;
    }
    lastCheckedAt = checkedAt;
    inFlight = (async () => {
      try {
        const synced = await read(credentials);
        if (!synced) {
          onStatus("This mobile sync link has expired or was revoked.", "error");
          reload();
          return Object.freeze({ status: "revoked", updated: false });
        }
        const currentTime = Date.parse(publishedAt || "");
        const nextTime = Date.parse(synced.createdAt || "");
        if (Number.isFinite(nextTime) && (!Number.isFinite(currentTime) || nextTime > currentTime)) {
          reload();
          return Object.freeze({ status: "updated", updated: true });
        }
        if (notifyWhenCurrent) onStatus("Mobile data is already current.", "success");
        return Object.freeze({ status: "current", updated: false });
      } catch (error) {
        onStatus(`Could not check for newer mobile data. ${error.message}`, "error");
        return Object.freeze({ status: "error", updated: false, error });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  return Object.freeze({ activate, check });
}
