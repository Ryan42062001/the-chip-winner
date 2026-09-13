import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyDeploymentScope, requiresProductionDeploy } from "../scripts/deployment-scope.js";

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

test("push scope is explicit and fails open when classification is unavailable", () => {
  assert.deepEqual(
    classifyDeploymentScope({ eventName: "push", changedFiles: [".ai/shared/ACTIVE_TASKS.json"] }),
    { required: false, reason: "control-plane-only" }
  );
  assert.deepEqual(
    classifyDeploymentScope({ eventName: "push", changedFiles: [".ai/shared/ACTIVE_TASKS.json", "src/app.js"] }),
    { required: true, reason: "deployable-change" }
  );
  assert.deepEqual(
    classifyDeploymentScope({ eventName: "push", changedFiles: null }),
    { required: true, reason: "classification-unavailable" }
  );
});

test("manual dispatch always deploys and non-push validation does not deploy", () => {
  assert.deepEqual(
    classifyDeploymentScope({ eventName: "workflow_dispatch", changedFiles: [] }),
    { required: true, reason: "manual-dispatch" }
  );
  assert.deepEqual(
    classifyDeploymentScope({ eventName: "pull_request", changedFiles: ["src/app.js"] }),
    { required: false, reason: "non-push" }
  );
});

test("Pages workflow keeps test validation unconditional and gates deployment with classifier output", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /deployment_required:/);
  assert.match(workflow, /deployment_reason:/);
  assert.match(workflow, /DEPLOY_BASE_SHA: \$\{\{ github\.event\.before \}\}/);
  assert.match(workflow, /node scripts\/deployment-scope\.js --github-output/);
  assert.match(workflow, /needs\.test\.outputs\.deployment_required == 'true'/);
  assert.match(workflow, /workflow_dispatch/);
});
