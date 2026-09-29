import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  executeTransition,
  removalEligibilityErrors
} from "../scripts/workflow-manager-transition.js";

const SHA = "a".repeat(40);
const FIXED_NOW = new Date("2026-09-19T04:00:00.000Z");

function completedTask(overrides = {}) {
  return {
    task_id: "TCW-999",
    status: "VERIFYING_MASTER",
    integration_sha: SHA,
    post_merge_run: 600,
    audit_required: true,
    post_merge_canary_required: true,
    closeout_evidence: {
      manager_verdict: "ACCEPTED",
      integration_verification: "PASS",
      master_verification: "PASS",
      audit_verdict: "PASS",
      canary_verification: "PASS"
    },
    ...overrides
  };
}

function registryText(task) {
  return `${JSON.stringify({
    schema_version: 3,
    workflow_version: "V3.2",
    updated_at_utc: "2026-09-19T03:00:00.000Z",
    tasks: [task]
  }, null, 2)}\n`;
}

async function tempRegistry(task) {
  const root = await mkdtemp(path.join(os.tmpdir(), "tcw-transition-"));
  const dir = path.join(root, ".ai/shared");
  await mkdir(dir, { recursive: true });
  const registryPath = path.join(dir, "ACTIVE_TASKS.json");
  const original = registryText(task);
  await writeFile(registryPath, original, "utf8");
  return { root, registryPath, original };
}

test("incomplete lifecycle states cannot be removed", () => {
  for (const status of ["ASSIGNED", "IN_PROGRESS", "MANAGER_REVIEW_READY", "AUDIT_READY", "MERGE_READY", "REWORK_REQUIRED", "BLOCKED", "MERGED"]) {
    assert.match(removalEligibilityErrors(completedTask({ status })).join("\n"), /VERIFYING_MASTER/, status);
  }
});

test("audit-required task cannot be removed before accepted audit completion", () => {
  const task = completedTask({
    closeout_evidence: {
      ...completedTask().closeout_evidence,
      audit_verdict: "PENDING"
    }
  });
  assert.match(removalEligibilityErrors(task).join("\n"), /audit-required task needs PASS/);
});

test("removal requires explicit integration, post-merge, Manager, master, and canary proof", () => {
  const task = completedTask({
    integration_sha: null,
    post_merge_run: null,
    closeout_evidence: {
      manager_verdict: "PENDING",
      integration_verification: "UNKNOWN",
      master_verification: "UNKNOWN",
      audit_verdict: "PASS",
      canary_verification: "PENDING"
    }
  });
  const errors = removalEligibilityErrors(task).join("\n");
  assert.match(errors, /integration_sha/);
  assert.match(errors, /post_merge_run/);
  assert.match(errors, /manager_verdict/);
  assert.match(errors, /integration_verification/);
  assert.match(errors, /master_verification/);
  assert.match(errors, /canary-required task/);
});

test("non-audit and non-canary closeout requires explicit NOT_APPLICABLE markers", () => {
  const task = completedTask({
    audit_required: false,
    post_merge_canary_required: false,
    closeout_evidence: {
      ...completedTask().closeout_evidence,
      audit_verdict: "NOT_APPLICABLE",
      canary_verification: "NOT_APPLICABLE"
    }
  });
  assert.deepEqual(removalEligibilityErrors(task), []);
});

test("genuinely completed task can be removed", async () => {
  const { root, registryPath } = await tempRegistry(completedTask());
  const result = await executeTransition(["--task", "TCW-999", "--remove", "--apply"], {
    root,
    audit: async () => {},
    now: () => FIXED_NOW
  });
  assert.equal(result.applied, true);
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  assert.deepEqual(registry.tasks, []);
  assert.equal(registry.updated_at_utc, FIXED_NOW.toISOString());
});

test("rejected applied transition restores original registry byte-for-byte", async () => {
  const { root, registryPath, original } = await tempRegistry(completedTask());
  await assert.rejects(
    executeTransition(["--task", "TCW-999", "--remove", "--apply"], {
      root,
      audit: async () => { throw new Error("static validation rejected candidate"); },
      now: () => FIXED_NOW
    }),
    /static validation rejected candidate/
  );
  assert.equal(await readFile(registryPath, "utf8"), original);
});

test("ineligible applied removal fails before mutation and preserves bytes", async () => {
  const { root, registryPath, original } = await tempRegistry(completedTask({ status: "AUDIT_READY" }));
  await assert.rejects(
    executeTransition(["--task", "TCW-999", "--remove", "--apply"], {
      root,
      audit: async () => {},
      now: () => FIXED_NOW
    }),
    /not closeout-removal eligible/
  );
  assert.equal(await readFile(registryPath, "utf8"), original);
});

test("dry-run remains non-mutating", async () => {
  const { root, registryPath, original } = await tempRegistry(completedTask());
  const result = await executeTransition(["--task", "TCW-999", "--remove"], {
    root,
    audit: async () => { throw new Error("dry-run must not invoke audit"); },
    now: () => FIXED_NOW
  });
  assert.equal(result.applied, false);
  assert.equal(await readFile(registryPath, "utf8"), original);
  assert.deepEqual(JSON.parse(result.candidateText).tasks, []);
});
