import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkCandidateAssignmentStaleness,
  detectDuplicateTaskPullRequests,
  validateNextActivationDashboard,
  validateRegistryShape
} from "../scripts/audit-workflow.js";

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

function pr(number, supersedes = []) {
  return {
    number,
    title: `TCW-010 PR #${number}`,
    body: ["Task-ID: TCW-010", ...supersedes.map((target) => `Supersedes-PR: #${target}`)].join("\n")
  };
}

const dashboard = (status = "RECOMMEND TO MANAGER") => `# Handoff

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | ${status} | Gate | Review. |
| 2 | Implementation Engineer / Builder | WAIT | Gate | Wait. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | IDLE | Gate | No action. |
| 4 | Research & Development (R&D) | IDLE | Gate | No action. |
| 5 | Independent Auditor / QA | WAIT | Gate | Wait. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | Gate | No action. |
`;

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

test("closeout evidence values fail closed when malformed", () => {
  const result = validateRegistryShape(registry({
    closeout_evidence: {
      manager_verdict: "PENDING",
      integration_verification: "UNKNOWN",
      master_verification: "UNKNOWN",
      audit_verdict: "PENDING",
      canary_verification: "PENDING"
    }
  }));
  assert.match(result.errors.join("\n"), /manager_verdict must be ACCEPTED/);
  assert.match(result.errors.join("\n"), /integration_verification must be PASS/);
  assert.match(result.errors.join("\n"), /master_verification must be PASS/);
  assert.match(result.errors.join("\n"), /invalid closeout_evidence.audit_verdict/);
  assert.match(result.errors.join("\n"), /invalid closeout_evidence.canary_verification/);
});

test("detects duplicate open task pull requests", () => {
  const result = detectDuplicateTaskPullRequests([pr(70), pr(71)]);
  assert.ok(result.errors.length >= 1);
  assert.match(result.errors.join("\n"), /exactly one current survivor/);
});

test("existing two-PR supersession happy path remains valid", () => {
  const result = detectDuplicateTaskPullRequests([pr(70), pr(71, [70])]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /survivor #71/);
});

test("partial three-PR supersession remains an error", () => {
  const result = detectDuplicateTaskPullRequests([pr(70), pr(71), pr(72, [70])]);
  assert.ok(result.errors.length >= 1);
  assert.match(result.errors.join("\n"), /exactly one current survivor/);
});

test("valid three-PR transitive succession has exactly one survivor", () => {
  const result = detectDuplicateTaskPullRequests([pr(70), pr(71, [70]), pr(72, [71])]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /survivor #72/);
});

test("supersession cycles fail closed", () => {
  const result = detectDuplicateTaskPullRequests([pr(70, [71]), pr(71, [70])]);
  assert.match(result.errors.join("\n"), /cycle detected/);
});

test("self supersession fails closed", () => {
  const result = detectDuplicateTaskPullRequests([pr(70, [70]), pr(71, [70])]);
  assert.match(result.errors.join("\n"), /cannot supersede itself/);
});

test("unsafe unknown supersession references fail closed", () => {
  const result = detectDuplicateTaskPullRequests([pr(70), pr(71, [999])]);
  assert.match(result.errors.join("\n"), /unsafe unknown Supersedes-PR #999/);
});

test("multiple current survivors fail closed", () => {
  const result = detectDuplicateTaskPullRequests([pr(70), pr(71, [70]), pr(72)]);
  assert.match(result.errors.join("\n"), /exactly one current survivor; found 2/);
});

test("six-role Next Activation dashboard validates in canonical order", () => {
  assert.deepEqual(validateNextActivationDashboard(dashboard(), { label: "Builder handoff" }), []);
});

test("Next Activation rejects a missing canonical role row", () => {
  const missing = dashboard().replace("| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | Gate | No action. |\n", "");
  assert.match(validateNextActivationDashboard(missing, { label: "Builder handoff" }).join("\n"), /exactly six role rows/);
});

test("worker handoffs cannot self-authorize ACTIVATE NOW", () => {
  assert.match(validateNextActivationDashboard(dashboard("ACTIVATE NOW"), { label: "Builder handoff" }).join("\n"), /worker handoff cannot use ACTIVATE NOW/);
  assert.deepEqual(validateNextActivationDashboard(dashboard("ACTIVATE NOW"), { label: "Manager handoff", allowActivateNow: true }), []);
});

test("PR assignment-drift gate projects one merge commit for a branch-head checkout", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "tcw-premerge-staleness-"));
  const git = (...args) => execFileSync("git", args, { cwd: rootDir, encoding: "utf8" }).trim();
  try {
    git("init", "-q", "-b", "master");
    git("config", "user.name", "TCW workflow test");
    git("config", "user.email", "workflow-test@example.invalid");
    writeFileSync(join(rootDir, "fixture.txt"), "baseline\\n");
    git("add", "fixture.txt");
    git("commit", "-qm", "baseline");
    const baseline = git("rev-parse", "HEAD");
    const assigned = registry({ assignment_master_sha: baseline });

    git("checkout", "-qb", "candidate");
    for (let i = 1; i <= 3; i++) {
      writeFileSync(join(rootDir, "fixture.txt"), `candidate ${i}\\n`);
      git("add", "fixture.txt");
      git("commit", "-qm", `candidate ${i}`);
    }

    assert.deepEqual(checkCandidateAssignmentStaleness(assigned, { rootDir, isPullRequest: false }).errors, []);
    assert.match(
      checkCandidateAssignmentStaleness(assigned, { rootDir, isPullRequest: true }).errors.join("\\n"),
      /TCW-010: assignment is 4 commits behind target/
    );
    const classified = registry({
      assignment_master_sha: baseline,
      target_advancement: { classification: "OVERLAPPING_RISK", checked_at_sha: baseline }
    });
    assert.deepEqual(checkCandidateAssignmentStaleness(classified, { rootDir, isPullRequest: true }).errors, []);
    assert.match(checkCandidateAssignmentStaleness(classified, { rootDir, isPullRequest: true }).warnings.join("\\n"), /recheck OVERLAPPING_RISK/);

    git("checkout", "-q", "master");
    git("merge", "--no-ff", "-qm", "synthetic PR merge preview", "candidate");
    // A two-parent checkout already includes the merge commit: do not count it twice.
    assert.match(
      checkCandidateAssignmentStaleness(assigned, { rootDir, isPullRequest: true }).errors.join("\\n"),
      /TCW-010: assignment is 4 commits behind target/
    );
    assert.doesNotMatch(
      checkCandidateAssignmentStaleness(assigned, { rootDir, isPullRequest: true }).errors.join("\\n"),
      /assignment is 5 commits/
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
