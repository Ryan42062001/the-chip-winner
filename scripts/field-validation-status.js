import { readFile } from "node:fs/promises";

const registryUrl = new URL("../config/field-validation.json", import.meta.url);
const registry = JSON.parse(await readFile(registryUrl, "utf8"));
const allowedStatuses = new Set(["pending", "passed", "blocked", "failed"]);
const requireComplete = process.argv.includes("--require-complete");

if (registry.schemaVersion !== 1) throw new Error("Unsupported field-validation schema version.");
if (!Array.isArray(registry.items) || registry.items.length === 0) throw new Error("Field-validation registry must contain items.");

const ids = new Set();
const totals = { pending: 0, passed: 0, blocked: 0, failed: 0 };

for (const item of registry.items) {
  if (!item || typeof item !== "object") throw new Error("Each field-validation item must be an object.");
  if (!/^FV-[A-Z0-9]+-\d{2}$/.test(item.id || "")) throw new Error(`Invalid field-validation id: ${item.id}`);
  if (ids.has(item.id)) throw new Error(`Duplicate field-validation id: ${item.id}`);
  ids.add(item.id);
  if (!allowedStatuses.has(item.status)) throw new Error(`Invalid status for ${item.id}: ${item.status}`);
  if (!Array.isArray(item.evidence)) throw new Error(`Evidence must be an array for ${item.id}.`);
  if ((item.status === "passed" || item.status === "failed") && item.evidence.length === 0) {
    throw new Error(`${item.id} cannot be ${item.status} without evidence.`);
  }
  totals[item.status] += 1;
}

console.log(`Release ${registry.releaseTarget} field validation · baseline v${registry.baselineVersion}`);
console.log(`Passed ${totals.passed}/${registry.items.length} · Pending ${totals.pending} · Blocked ${totals.blocked} · Failed ${totals.failed}`);

for (const item of registry.items) {
  console.log(`${item.status.toUpperCase().padEnd(7)} ${item.id} · ${item.title}`);
}

if (totals.failed > 0) process.exitCode = 1;
if (requireComplete && totals.passed !== registry.items.length) process.exitCode = 1;
