import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(new URL("../config/field-validation.json", import.meta.url), "utf8"));

const requiredIds = [
  "FV-A11Y-01",
  "FV-A11Y-02",
  "FV-A11Y-03",
  "FV-MOBILE-01",
  "FV-ESPN-01",
  "FV-ESPN-02",
  "FV-ESPN-03",
  "FV-ESPN-04",
  "FV-ESPN-05",
  "FV-SEASON-01",
  "FV-RECOVERY-01",
  "FV-SYNC-01",
  "FV-WAIVER-01",
];

test("Release 1.0 field-validation registry is complete and evidence-gated", () => {
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.releaseTarget, "1.0");
  assert.equal(registry.baselineVersion, "0.9.72");
  assert.deepEqual(registry.items.map((item) => item.id), requiredIds);

  const ids = new Set();
  for (const item of registry.items) {
    assert.match(item.id, /^FV-[A-Z0-9]+-\d{2}$/);
    assert.equal(ids.has(item.id), false, `duplicate id ${item.id}`);
    ids.add(item.id);
    assert.ok(["pending", "passed", "blocked", "failed"].includes(item.status));
    assert.ok(Array.isArray(item.evidence));
    assert.ok(item.area);
    assert.ok(item.title);
    assert.ok(item.notes);
    if (item.status === "passed" || item.status === "failed") {
      assert.ok(item.evidence.length > 0, `${item.id} requires evidence when ${item.status}`);
    }
  }
});
