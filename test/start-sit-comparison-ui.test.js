import test from "node:test";
import assert from "node:assert/strict";
import { renderStartSitComparison } from "../src/ui/start-sit-comparison.js";

test("start sit UI labels data confidence without claiming outcome probability", () => {
  const html = renderStartSitComparison({ status: "preference", first: { id: "1", name: "One", projection: 18 }, second: { id: "2", name: "Two", projection: 16 }, preferred: { id: "1", name: "One" }, difference: 2, reason: "Higher available projection", confidence: { label: "Medium", score: 67, limitations: ["Snapshot is stale."] } });
  assert.match(html, /Medium data confidence · 67% complete/); assert.match(html, /Snapshot is stale/); assert.match(html, /not the chance a player succeeds/);
});
