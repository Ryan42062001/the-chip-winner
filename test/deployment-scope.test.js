import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { requiresProductionDeploy } from "../scripts/deployment-scope.js";

test("control-plane-only .ai changes do not require a production deploy", () => {
  assert.equal(requiresProductionDeploy([
    ".ai/shared/ACTIVE_TASKS.json",
    ".ai/manager/HANDOFF.md"
  ]), false);
});

test("any path outside .ai requires a production deploy", () => {
  assert.equal(requiresProductionDeploy([
    ".ai/shared/PROJECT_STATE.md",
    "src/ui/section-renderer-priority.js"
  ]), true);
  assert.equal(requiresProductionDeploy(["README.md"]), true);
  assert.equal(requiresProductionDeploy([".github/workflows/deploy-pages.yml"]), true);
});

test("empty change lists do not invent a deploy requirement", () => {
  assert.equal(requiresProductionDeploy([]), false);
  assert.equal(requiresProductionDeploy(["", "   "]), false);
});

test("Pages workflow keeps test validation unconditional and gates deployment with the classifier output", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /deployment-scope/);
  assert.match(workflow, /outputs:\s*\n\s*deployment_required:/);
  assert.match(workflow, /needs\.test\.outputs\.deployment_required == 'true'/);
  assert.match(workflow, /node scripts\/deployment-scope\.js/);
  assert.match(workflow, /workflow_dispatch/);
});
