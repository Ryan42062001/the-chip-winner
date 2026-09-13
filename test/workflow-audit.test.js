import test from "node:test";
import assert from "node:assert/strict";
import { detectDuplicateTaskPullRequests, validateRegistryShape } from "../scripts/audit-workflow.js";

const states = ["PLANNED", "WAITING_EXTERNAL_EVIDENCE", "BLOCKED", "ASSIGNED", "IN_PROGRESS", "MANAGER_REVIEW_READY", "AUDIT_READY", "MERGE_READY", "REWORK_REQUIRED", "MERGED", "VERIFYING_MASTER", "CLOSED"];

function registry(overrides = {}) {
  return {
    schema_version: 2,
    canonical_branch: "master",
    manager_owned: true,
    lifecycle_states: states,
    tasks: [{
      task_id: "TCW-010",
      owner: "Manager",
      status: "IN_PROGRESS",
      task_file: ".ai/manager/tasks/TCW-010.md",
      role_handoff: ".ai/manager/HANDOFF.md",
      assignment_master_sha: "399869d0781bcc7ba844dabaa5bc439be784e809",
      branch: "manager/tcw-010-workflow-v3-1",
      pr: null,
      dependency: "INDEPENDENT",
      execution_mode: "STANDARD_CHAT",
      audit_required: false,
      blocked_on: [],
      next_gate: "Manager PR",
      ...overrides
    }]
  };
}

test("accepts valid active task metadata", () => {
  assert.deepEqual(validateRegistryShape(registry()).errors, []);
});

test("rejects duplicate task ids", () => {
  const value = registry();
  value.tasks.push({ ...value.tasks[0] });
  assert.match(validateRegistryShape(value).errors.join("\n"), /Duplicate task_id/);
});

test("requires explicit metadata for external evidence waits", () => {
  assert.match(validateRegistryShape(registry({ status: "WAITING_EXTERNAL_EVIDENCE" })).errors.join("\n"), /external_actor/);
  assert.deepEqual(validateRegistryShape(registry({ status: "WAITING_EXTERNAL_EVIDENCE", external_actor: "user", external_action: "Provide observation", resume_role: "Auditor" })).errors, []);
});

test("detects duplicate open task pull requests", () => {
  const result = detectDuplicateTaskPullRequests([
    { number: 70, title: "TCW-010 first", body: "Task-ID: TCW-010" },
    { number: 71, title: "TCW-010 replacement", body: "Task-ID: TCW-010" }
  ]);
  assert.equal(result.errors.length, 1);
});

test("explicit supersession downgrades duplicate open PRs to a warning", () => {
  const result = detectDuplicateTaskPullRequests([
    { number: 70, title: "TCW-010 first", body: "Task-ID: TCW-010" },
    { number: 71, title: "TCW-010 replacement", body: "Task-ID: TCW-010\nSupersedes-PR: #70" }
  ]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
});
