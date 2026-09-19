import test from "node:test";
import assert from "node:assert/strict";
import { detectDuplicateTaskPullRequests, validateRegistryShape } from "../scripts/audit-workflow.js";

const states = ["PLANNED","WAITING_EXTERNAL_EVIDENCE","BLOCKED","ASSIGNED","IN_PROGRESS","MANAGER_REVIEW_READY","AUDIT_READY","MERGE_READY","REWORK_REQUIRED","MERGED","VERIFYING_MASTER","CLOSED"];

function registry(overrides = {}) {
  return {
    schema_version: 3,
    workflow_version: "V3.2",
    workflow_overlay: ".ai/shared/WORKFLOW_V3_2.md",
    canonical_branch: "master",
    manager_owned: true,
    active_only: true,
    lifecycle_states: states,
    tasks: [{
      task_id: "TCW-010",
      title: "Fixture",
      owner: "Manager",
      role_label: "Manager / Architect",
      status: "IN_PROGRESS",
      task_file: ".ai/manager/tasks/TCW-010.md",
      role_handoff: ".ai/manager/HANDOFF.md",
      assignment_master_sha: "399869d0781bcc7ba844dabaa5bc439be784e809",
      branch: "manager/tcw-010-workflow-v3-1",
      pr: null,
      dependency: "INDEPENDENT",
      execution_mode: "STANDARD_CHAT_HIGH",
      refresh_mode: "FAST_REFRESH",
      refresh_reason: null,
      audit_required: false,
      post_merge_canary_required: false,
      merge_authority: "Manager",
      blocker_type: "NONE",
      user_action_required: false,
      blocked_on_tasks: [],
      blocked_on: [],
      worker_checkpoint_sha: null,
      worker_slot: "manager-fixture",
      allowed_path_prefixes: [".ai/manager/"],
      forbidden_path_prefixes: [],
      next_gate: "Manager PR",
      ...overrides
    }]
  };
}

test("accepts valid active task metadata", () => {
  assert.deepEqual(validateRegistryShape(registry()).errors, []);
});

test("requires Manager merge authority on active tasks", () => {
  assert.match(validateRegistryShape(registry({ merge_authority: undefined })).errors.join("\n"), /merge_authority must be Manager/);
  assert.match(validateRegistryShape(registry({ merge_authority: "Builder" })).errors.join("\n"), /merge_authority must be Manager/);
});

test("rejects duplicate task ids", () => {
  const value = registry();
  value.tasks.push({ ...value.tasks[0], worker_slot: "manager-fixture-2" });
  assert.match(validateRegistryShape(value).errors.join("\n"), /Duplicate task_id/);
});

test("external evidence waits require an explicit external blocker type", () => {
  assert.match(validateRegistryShape(registry({ status: "WAITING_EXTERNAL_EVIDENCE" })).errors.join("\n"), /WAITING_EXTERNAL_EVIDENCE requires external blocker type/);
  assert.deepEqual(validateRegistryShape(registry({
    status: "WAITING_EXTERNAL_EVIDENCE",
    blocker_type: "EXTERNAL_EVIDENCE",
    blocked_on: ["Genuine external evidence"],
    next_gate: "Resume when qualifying evidence exists"
  })).errors, []);
});

test("user-action flag requires a compatible blocker type", () => {
  assert.match(validateRegistryShape(registry({ status: "BLOCKED", blocker_type: "TECHNICAL", user_action_required: true })).errors.join("\n"), /user_action_required needs/);
  assert.deepEqual(validateRegistryShape(registry({ status: "BLOCKED", blocker_type: "USER_ACTION", user_action_required: true, blocked_on: ["User input"] })).errors, []);
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
