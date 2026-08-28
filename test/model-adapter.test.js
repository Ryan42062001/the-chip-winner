import test from "node:test";
import assert from "node:assert/strict";
import { DeterministicExplanationAdapter, ModelAdapter } from "../src/models/model-adapter.js";

test("base model adapter fails explicitly when no provider is configured", async () => {
  await assert.rejects(() => new ModelAdapter().explain(), /must be implemented/);
});

test("deterministic fallback explanation names inputs and limitations", async () => {
  const recommendation = { id: "r-1", kind: "lineup", status: "review", confidence: "medium", inputs: ["ESPN projection"], limitations: ["Late news unavailable."] };
  const result = await new DeterministicExplanationAdapter().explain({ currentWeek: 1 }, recommendation);
  assert.equal(result.provider, "deterministic");
  assert.match(result.text, /ESPN projection/);
  assert.match(result.text, /Late news unavailable/);
});
