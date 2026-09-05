import test from "node:test";
import assert from "node:assert/strict";
import { createDesktopAutoPublisher, createMobileSyncUpdater } from "../src/sync/auto-sync.js";

test("desktop auto publisher coalesces ESPN, ranking, and team state changes into one publish", async () => {
  let listener = null;
  let currentTeamId = "t1";
  const callbacks = [];
  const published = [];
  const credentials = { channelId: "reader", encryptionKey: "key", writeToken: "writer" };
  const controller = createDesktopAutoPublisher({
    store: { subscribe: (next) => { listener = next; return () => { listener = null; }; } },
    readCredentials: () => credentials,
    publish: async (received) => { published.push({ received, teamId: currentTeamId }); },
    schedule: (callback) => callbacks.push(callback),
  });

  listener({ source: "cache" }, { type: "load/success" });
  listener({ source: "cache" }, { type: "rankings/load" });
  currentTeamId = "t2";
  listener({ source: "cache" }, { type: "team/select" });
  assert.equal(callbacks.length, 1);
  assert.equal(published.length, 0);

  callbacks[0]();
  await controller.whenIdle();
  assert.equal(published.length, 1);
  assert.equal(published[0].teamId, "t2");
  assert.equal(published[0].received.writeToken, "writer");
});

test("desktop auto publisher never publishes synced phone state or channels without a desktop write token", async () => {
  let listener = null;
  let credentials = { channelId: "reader", encryptionKey: "key" };
  const callbacks = [];
  let publishCount = 0;
  createDesktopAutoPublisher({
    store: { subscribe: (next) => { listener = next; return () => {}; } },
    readCredentials: () => credentials,
    publish: async () => { publishCount += 1; },
    schedule: (callback) => callbacks.push(callback),
  });

  listener({ source: "sync" }, { type: "load/success" });
  listener({ source: "cache" }, { type: "load/success" });
  assert.equal(callbacks.length, 0);

  credentials = { channelId: "reader", encryptionKey: "key", writeToken: "writer" };
  listener({ source: "sample" }, { type: "team/select" });
  assert.equal(callbacks.length, 0);
  assert.equal(publishCount, 0);
});

test("mobile updater reloads only when the encrypted channel has a newer publish", async () => {
  const reads = [];
  let reloadCount = 0;
  const statuses = [];
  const credentials = Object.freeze({ channelId: "reader", encryptionKey: "key" });
  const updater = createMobileSyncUpdater({
    read: async (received) => {
      reads.push(received);
      return { createdAt: "2026-09-05T23:30:00.000Z", payload: {} };
    },
    reload: () => { reloadCount += 1; },
    onStatus: (message, kind) => statuses.push({ message, kind }),
  });
  updater.activate(credentials, "2026-09-05T23:20:00.000Z");

  const result = await updater.check({ force: true });
  assert.equal(result.status, "updated");
  assert.equal(result.updated, true);
  assert.equal(reloadCount, 1);
  assert.deepEqual(reads[0], credentials);
  assert.equal("writeToken" in reads[0], false);
  assert.equal(statuses.length, 0);
});

test("mobile updater reports current state and throttles duplicate foreground checks", async () => {
  let clock = 20000;
  let readCount = 0;
  const statuses = [];
  const updater = createMobileSyncUpdater({
    read: async () => { readCount += 1; return { createdAt: "2026-09-05T23:20:00.000Z", payload: {} }; },
    reload: () => { throw new Error("Current data must not reload."); },
    onStatus: (message, kind) => statuses.push({ message, kind }),
    now: () => clock,
    minIntervalMs: 15000,
  });
  updater.activate({ channelId: "reader", encryptionKey: "key" }, "2026-09-05T23:20:00.000Z");

  assert.equal((await updater.check()).status, "current");
  clock += 1000;
  assert.equal((await updater.check()).status, "throttled");
  assert.equal(readCount, 1);

  clock += 15000;
  assert.equal((await updater.check({ notifyWhenCurrent: true })).status, "current");
  assert.equal(readCount, 2);
  assert.match(statuses.at(-1).message, /already current/i);
  assert.equal(statuses.at(-1).kind, "success");
});

test("manual mobile check still reports current when it joins an automatic check already in flight", async () => {
  let releaseRead;
  let readCount = 0;
  const statuses = [];
  const updater = createMobileSyncUpdater({
    read: async () => {
      readCount += 1;
      await new Promise((resolve) => { releaseRead = resolve; });
      return { createdAt: "2026-09-05T23:20:00.000Z", payload: {} };
    },
    reload: () => { throw new Error("Current data must not reload."); },
    onStatus: (message, kind) => statuses.push({ message, kind }),
  });
  updater.activate({ channelId: "reader", encryptionKey: "key" }, "2026-09-05T23:20:00.000Z");

  const automatic = updater.check({ force: true });
  await Promise.resolve();
  const manual = updater.check({ force: true, notifyWhenCurrent: true });
  releaseRead();
  assert.equal((await automatic).status, "current");
  assert.equal((await manual).status, "current");
  assert.equal(readCount, 1);
  assert.equal(statuses.length, 1);
  assert.match(statuses[0].message, /already current/i);
  assert.equal(statuses[0].kind, "success");
});

test("mobile updater fails closed when a previously loaded channel is revoked", async () => {
  let reloadCount = 0;
  const statuses = [];
  const updater = createMobileSyncUpdater({
    read: async () => null,
    reload: () => { reloadCount += 1; },
    onStatus: (message, kind) => statuses.push({ message, kind }),
  });
  updater.activate({ channelId: "reader", encryptionKey: "key" }, "2026-09-05T23:20:00.000Z");

  const result = await updater.check({ force: true });
  assert.equal(result.status, "revoked");
  assert.equal(reloadCount, 1);
  assert.match(statuses[0].message, /expired or was revoked/i);
  assert.equal(statuses[0].kind, "error");
});
