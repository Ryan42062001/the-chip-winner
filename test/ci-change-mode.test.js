import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyEvent, classifyRecords, isDocumentationPath, parseNameStatus,
  selectDiffRange, selectSuccessfulPredecessorRun
} from "../scripts/ci-change-mode.js";

const BASE = "1".repeat(40);
const HEAD = "2".repeat(40);
const BEFORE = "3".repeat(40);
function opened(diffText, overrides = {}) { return classifyEvent({ eventName: "pull_request", action: "opened", baseSha: BASE, headSha: HEAD, diffText, ...overrides }); }
function sync(diffText, overrides = {}) { return classifyEvent({ eventName: "pull_request", action: "synchronize", baseSha: BASE, headSha: HEAD, eventBefore: BEFORE, eventAfter: HEAD, diffText, ...overrides }); }

test("documentation allowlist is narrow", () => {
  assert.equal(isDocumentationPath("README.md"), true);
  assert.equal(isDocumentationPath(".ai/manager/example.md"), true);
  assert.equal(isDocumentationPath("docs/example.md"), true);
  assert.equal(isDocumentationPath(".ai/shared/ACTIVE_TASKS.json"), false);
  assert.equal(isDocumentationPath(".github/workflows/deploy-pages.yml"), false);
  assert.equal(isDocumentationPath("nested/README.md"), false);
});

test("opened docs-only PR uses cumulative diff without predecessor", () => {
  const result = opened("M\tREADME.md\nA\t.ai/manager/note.md\n");
  assert.equal(result.mode, "DOCS_ONLY");
  assert.equal(result.scope, "cumulative-pr");
  assert.equal(result.requiresPredecessor, false);
});

test("synchronize docs-only delta requires predecessor continuity", () => {
  const result = sync("M\t.ai/manager/note.md\n");
  assert.equal(result.mode, "DOCS_ONLY");
  assert.equal(result.scope, "synchronize-delta");
  assert.equal(result.predecessorSha, BEFORE);
  assert.equal(result.requiresPredecessor, true);
});

test("non-doc machine-state workflow package source tests and mixed diffs are FULL", () => {
  for (const diff of [
    "M\t.ai/shared/ACTIVE_TASKS.json\n",
    "M\t.github/workflows/deploy-pages.yml\n",
    "M\tpackage.json\n",
    "M\tsrc/app.js\n",
    "M\ttest/example.test.js\n",
    "M\tREADME.md\nM\tsrc/app.js\n"
  ]) assert.equal(opened(diff).mode, "FULL");
});

test("deletion and rename-disabled source movement fail closed FULL", () => {
  assert.equal(opened("D\tsrc/app.js\n").mode, "FULL");
  assert.equal(opened("D\tsrc/app.js\nA\tdocs/app.md\n").mode, "FULL");
});

test("malformed empty traversal and unknown status fail closed FULL", () => {
  assert.equal(opened("").mode, "FULL");
  assert.equal(opened("R100\tsrc/a.js\tdocs/a.md\n").mode, "FULL");
  assert.equal(opened("Q\tdocs/a.md\n").mode, "FULL");
  assert.equal(opened("M\t../README.md\n").mode, "FULL");
  assert.equal(parseNameStatus("M\tdocs//a.md\n").ok, false);
  assert.equal(classifyRecords([]).mode, "FULL");
});

test("manual dispatch and every push are FULL", () => {
  assert.equal(classifyEvent({ eventName: "workflow_dispatch", diffText: "" }).mode, "FULL");
  assert.equal(classifyEvent({ eventName: "push", diffText: "M\tREADME.md\n" }).mode, "FULL");
});

test("classifier errors and invalid SHAs fail closed FULL", () => {
  assert.equal(opened("", { diffError: "simulated" }).mode, "FULL");
  assert.equal(opened("M\tREADME.md\n", { baseSha: "" }).mode, "FULL");
  assert.equal(sync("M\tREADME.md\n", { eventBefore: "" }).mode, "FULL");
  assert.equal(sync("M\tREADME.md\n", { eventAfter: "4".repeat(40) }).mode, "FULL");
});

test("unsupported PR action is FULL", () => {
  const result = classifyEvent({ eventName: "pull_request", action: "edited", baseSha: BASE, headSha: HEAD, diffText: "M\tREADME.md\n" });
  assert.equal(result.mode, "FULL");
});

test("diff range exposes synchronize delta", () => {
  const result = selectDiffRange({ eventName: "pull_request", action: "synchronize", baseSha: BASE, headSha: HEAD, eventBefore: BEFORE, eventAfter: HEAD });
  assert.equal(result.startSha, BEFORE);
  assert.equal(result.endSha, HEAD);
  assert.equal(result.requiresPredecessor, true);
});

test("predecessor selector requires successful same-workflow same-PR same-head run", () => {
  const runs = [
    { id: 1, run_number: 1, name: "Deploy website", event: "pull_request", status: "completed", conclusion: "failure", head_sha: BEFORE, pull_requests: [{ number: 5 }] },
    { id: 2, run_number: 2, name: "Deploy website", event: "pull_request", status: "completed", conclusion: "success", head_sha: HEAD, pull_requests: [{ number: 5 }] },
    { id: 3, run_number: 3, name: "Deploy website", event: "pull_request", status: "completed", conclusion: "success", head_sha: BEFORE, pull_requests: [{ number: 99 }] },
    { id: 4, run_number: 4, name: "Deploy website", event: "pull_request", status: "completed", conclusion: "success", head_sha: BEFORE, pull_requests: [{ number: 5 }] }
  ];
  assert.equal(selectSuccessfulPredecessorRun(runs, { predecessorSha: BEFORE, prNumber: 5 })?.id, 4);
  assert.equal(selectSuccessfulPredecessorRun(runs.slice(0, 3), { predecessorSha: BEFORE, prNumber: 5 }), null);
});

import { validateRegistryShape } from "../scripts/audit-workflow.js";

function taskFixture(id, overrides = {}) {
  return {
    task_id: id,
    title: id,
    owner: "Builder",
    role_label: "Implementation Engineer / Builder",
    status: "ASSIGNED",
    dependency: "INDEPENDENT",
    execution_mode: "STANDARD_CHAT_HIGH",
    refresh_mode: "FAST_REFRESH",
    refresh_reason: null,
    merge_authority: "Manager",
    blocker_type: "NONE",
    user_action_required: false,
    blocked_on_tasks: [],
    blocked_on: [],
    task_file: ".ai/manager/tasks/example.md",
    role_handoff: ".ai/builder/HANDOFF.md",
    assignment_master_sha: "a".repeat(40),
    branch: `builder/${id.toLowerCase()}`,
    pr: null,
    worker_checkpoint_sha: null,
    worker_slot: id.toLowerCase(),
    allowed_path_prefixes: ["src/"],
    forbidden_path_prefixes: [],
    audit_required: true,
    post_merge_canary_required: true,
    ...overrides
  };
}
function registryFixture(tasks) {
  return {
    schema_version: 3,
    workflow_version: "V3.2",
    workflow_overlay: ".ai/shared/WORKFLOW_V3_2.md",
    canonical_branch: "master",
    manager_owned: true,
    active_only: true,
    tasks
  };
}

test("V3.2 registry accepts distinct safely scoped runnable lanes", () => {
  const result = validateRegistryShape(registryFixture([
    taskFixture("TCW-901"),
    taskFixture("TCW-902", { branch: "builder/tcw-902", worker_slot: "two", allowed_path_prefixes: ["docs/"] })
  ]));
  assert.deepEqual(result.errors, []);
});

test("V3.2 registry rejects unsafe parallel write overlap", () => {
  const result = validateRegistryShape(registryFixture([
    taskFixture("TCW-901"),
    taskFixture("TCW-902", { branch: "builder/tcw-902", worker_slot: "two" })
  ]));
  assert.ok(result.errors.some((item) => item.includes("unsafe parallel write overlap")));
});

test("V3.2 registry rejects duplicate branch and worker slot claims", () => {
  const first = taskFixture("TCW-901");
  const second = taskFixture("TCW-902", {
    branch: first.branch,
    worker_slot: first.worker_slot,
    allowed_path_prefixes: ["docs/"]
  });
  const result = validateRegistryShape(registryFixture([first, second]));
  assert.ok(result.errors.some((item) => item.includes("branch duplicates")));
  assert.ok(result.errors.some((item) => item.includes("worker_slot duplicates")));
});

test("V3.2 registry rejects legacy execution modes and unreasoned full refresh", () => {
  const result = validateRegistryShape(registryFixture([
    taskFixture("TCW-901", { execution_mode: "STANDARD_CHAT", refresh_mode: "FULL_REFRESH", refresh_reason: "" })
  ]));
  assert.ok(result.errors.some((item) => item.includes("STANDARD_CHAT_HIGH or WORK_MODE")));
  assert.ok(result.errors.some((item) => item.includes("FULL_REFRESH requires refresh_reason")));
});

test("V3.2 active-only registry rejects CLOSED entries", () => {
  const result = validateRegistryShape(registryFixture([taskFixture("TCW-901", { status: "CLOSED" })]));
  assert.ok(result.errors.some((item) => item.includes("active-only registry")));
});
