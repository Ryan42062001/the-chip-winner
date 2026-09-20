import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  validateCandidate, selectEligibleTasks, validateRemoteSnapshot, verifyOriginalPacket,
  summarizeResults, verifyGitCheckout, overlayCanonicalControlPlane,
  digest, resultDigest, pathAllowed, runTask, validateCanonicalState,
  authenticateTrustedVerifier, TRUSTED_VERIFIER_SHA
} from "../scripts/workflow-audit-readiness-automation.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/workflow-audit-readiness-automation.js");
const SHA = (digit) => digit.repeat(40);
const REPO = "Ryan42062001/the-chip-winner";
const runGit = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
function task(id = "TCW-101") {
  return {
    task_id: id, owner: "Builder", status: "MANAGER_REVIEW_READY",
    audit_required: true, merge_authority: "Manager", branch: "builder/tcw-101-example",
    assignment_master_sha: SHA("a"), worker_checkpoint_sha: SHA("b"), pr: 42,
    allowed_path_prefixes: ["src/allowed.txt"], forbidden_path_prefixes: ["src/private.txt"]
  };
}
function registry(tasks = []) {
  return { schema_version: 3, workflow_version: "V3.2", canonical_branch: "master",
    manager_owned: true, tasks };
}
function remote(t) {
  return { refSha: t.worker_checkpoint_sha, pr: {
    number: t.pr, state: "open", head: {
      sha: t.worker_checkpoint_sha, ref: t.branch, repo: { full_name: REPO }
    }, base: { ref: "master", repo: { full_name: REPO } }
  } };
}
function packet(t) {
  const original = {
    schema: "TCW_AUDIT_READINESS_V1", taskId: t.task_id, branch: t.branch,
    head: t.worker_checkpoint_sha, assignmentMasterSha: t.assignment_master_sha,
    pr: t.pr, auditRequired: true, changedFiles: ["src/allowed.txt"],
    blockers: [], readyForManagerFreeze: true
  };
  return { ...original, sha256: digest(JSON.stringify(original)) };
}
function gitFixture() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "tcw-047-test-"));
  runGit(dir, "init", "-q");
  runGit(dir, "config", "user.email", "fixture@example.invalid");
  runGit(dir, "config", "user.name", "Fixture");
  mkdirSync(path.join(dir, "src"), { recursive: true });
  writeFileSync(path.join(dir, "src/allowed.txt"), "base\n");
  runGit(dir, "add", ".");
  runGit(dir, "commit", "-qm", "assignment baseline");
  const baseline = runGit(dir, "rev-parse", "HEAD");
  runGit(dir, "checkout", "-qb", "builder/tcw-101-example");
  writeFileSync(path.join(dir, "src/allowed.txt"), "changed\n");
  runGit(dir, "add", ".");
  runGit(dir, "commit", "-qm", "Builder allowed change");
  const head = runGit(dir, "rev-parse", "HEAD");
  return { dir, baseline, head };
}
function fixtureTask(fixture) {
  return { ...task(), assignment_master_sha: fixture.baseline,
    worker_checkpoint_sha: fixture.head };
}

test("eligible task selection is exact, excludes unchanged or non-ready tasks, and supports independent concurrent tasks", () => {
  const one = task(), two = { ...task("TCW-102"), branch: "builder/tcw-102-example", pr: 43 };
  const earlier = registry([{ ...one, worker_checkpoint_sha: SHA("c") }, two]);
  const latest = registry([one, two]);
  assert.deepEqual(selectEligibleTasks(latest, earlier).map((t) => t.task_id), ["TCW-101"]);
  assert.equal(summarizeResults([], 0), "NO_ELIGIBLE_TASK");
  assert.deepEqual(selectEligibleTasks(latest, earlier,
    { changedTaskSpecs: ["TCW-102"] }).map((t) => t.task_id), ["TCW-101", "TCW-102"]);
  assert.deepEqual(selectEligibleTasks(registry([{ ...one, status: "IN_PROGRESS" }]), registry([one])), []);
  assert.deepEqual(selectEligibleTasks(latest, earlier, { dispatch: true, taskId: "TCW-102" }), [two]);
  assert.throws(() => selectEligibleTasks(latest, earlier, { dispatch: true, taskId: "bad;echo" }));
  assert.throws(() => selectEligibleTasks(latest, earlier, { dispatch: true, taskId: "TCW-999" }));
  assert.throws(() => selectEligibleTasks(registry([one, one]), earlier), /duplicated/);
  assert.throws(() => selectEligibleTasks({ ...latest, manager_owned: false }, earlier));
  assert.throws(() => selectEligibleTasks(latest, null), /previous/);
});
test("missing checkpoint, wrong status, PR, branch, audit authority and malformed metadata fail closed", () => {
  const good = task();
  assert.deepEqual(validateCandidate(good), []);
  for (const invalid of [
    { worker_checkpoint_sha: null }, { worker_checkpoint_sha: "HEAD" },
    { status: "IN_PROGRESS" }, { owner: "Auditor" }, { audit_required: false },
    { merge_authority: "Builder" },
    { pr: null }, { pr: -1 }, { branch: "builder/../attack" },
    { branch: "auditor/tcw-101" }, { assignment_master_sha: "master" },
    { allowed_path_prefixes: [] }
  ]) assert.ok(validateCandidate({ ...good, ...invalid }).length, JSON.stringify(invalid));
});
test("branch advancement, changed PR head, foreign PR ownership and wrong base fail closed", () => {
  const t = task();
  assert.deepEqual(validateRemoteSnapshot(t, remote(t)), []);
  for (const broken of [
    { refSha: SHA("c") },
    { pr: { ...remote(t).pr, head: { ...remote(t).pr.head, sha: SHA("c") } } },
    { pr: { ...remote(t).pr, head: { ...remote(t).pr.head, ref: "builder/other" } } },
    { pr: { ...remote(t).pr, head: { ...remote(t).pr.head, repo: { full_name: "foreign/repo" } } } },
    { pr: { ...remote(t).pr, base: { ref: "test", repo: { full_name: REPO } } } },
    { pr: { ...remote(t).pr, number: 999 } }, { pr: null }
  ]) assert.ok(validateRemoteSnapshot(t, { ...remote(t), ...broken }).length);
});
test("original helper packet hash, provenance, scope, and blockers are independently checked", () => {
  const t = task();
  const p = packet(t);
  assert.deepEqual(verifyOriginalPacket(p, t), []);
  assert.throws(() => verifyOriginalPacket({ ...p, head: SHA("c") }), /integrity/);
  const corrupt = { ...p, changedFiles: ["src/private.txt"] };
  corrupt.sha256 = digest(JSON.stringify((({ sha256, ...rest }) => rest)(corrupt)));
  assert.deepEqual(verifyOriginalPacket(corrupt, t), []);
  assert.equal(pathAllowed("src/private.txt", t), false);
  assert.equal(pathAllowed("src/allowed.txt", t), true);
  assert.equal(pathAllowed("src/other.txt", t), false);
  const blocked = { ...p, blockers: ["static guardrail"], readyForManagerFreeze: false };
  blocked.sha256 = digest(JSON.stringify((({ sha256, ...rest }) => rest)(blocked)));
  assert.deepEqual(verifyOriginalPacket(blocked, t), ["static guardrail"]);
  assert.throws(() => verifyOriginalPacket({ ...p, pr: 999 }), /integrity/);
  assert.throws(() => verifyOriginalPacket({ ...p, sha256: "0".repeat(64) }), /integrity/);
  const mismatch = { ...p, pr: 999 };
  mismatch.sha256 = digest(JSON.stringify((({ sha256, ...rest }) => rest)(mismatch)));
  assert.throws(() => verifyOriginalPacket(mismatch, t), /provenance/);
});
test("real synthetic Git history proves exact branch, ancestor, and changed path safeguards", () => {
  const f = gitFixture(), t = fixtureTask(f);
  assert.deepEqual(verifyGitCheckout(f.dir, t), ["src/allowed.txt"]);
  assert.throws(() => verifyGitCheckout(f.dir, { ...t, worker_checkpoint_sha: SHA("d") }), /HEAD/);
  assert.throws(() => verifyGitCheckout(f.dir, { ...t, branch: "builder/elsewhere" }), /branch name/);
  runGit(f.dir, "checkout", "-q", "--detach", f.baseline);
  assert.throws(() => verifyGitCheckout(f.dir, t), /HEAD/);
  runGit(f.dir, "checkout", "-q", "builder/tcw-101-example");
  runGit(f.dir, "checkout", "-qb", "unrelated", f.baseline);
  writeFileSync(path.join(f.dir, "src/private.txt"), "master-only\n");
  runGit(f.dir, "add", ".");
  runGit(f.dir, "commit", "-qm", "not an ancestor of Builder");
  const unrelated = runGit(f.dir, "rev-parse", "HEAD");
  runGit(f.dir, "checkout", "-q", "builder/tcw-101-example");
  assert.throws(() => verifyGitCheckout(f.dir,
    { ...t, assignment_master_sha: unrelated }), /not an ancestor/);
  writeFileSync(path.join(f.dir, "src/private.txt"), "forbidden\n");
  runGit(f.dir, "add", ".");
  runGit(f.dir, "commit", "-qm", "Builder forbidden change");
  const head = runGit(f.dir, "rev-parse", "HEAD");
  assert.throws(() => verifyGitCheckout(f.dir,
    { ...t, worker_checkpoint_sha: head }), /outside task authority/);
});
test("canonical Manager metadata overlays stale Builder registry without rewriting immutable Builder HEAD", () => {
  const f = gitFixture();
  const manager = mkdtempSync(path.join(os.tmpdir(), "tcw-047-manager-"));
  mkdirSync(path.join(manager, ".ai/shared"), { recursive: true });
  mkdirSync(path.join(manager, ".ai/manager/tasks"), { recursive: true });
  mkdirSync(path.join(f.dir, ".ai/shared"), { recursive: true });
  writeFileSync(path.join(manager, ".ai/shared/ACTIVE_TASKS.json"), '{"canonical":true}\n');
  writeFileSync(path.join(manager, ".ai/manager/tasks/TCW-101.md"), "canonical specification\n");
  writeFileSync(path.join(f.dir, ".ai/shared/ACTIVE_TASKS.json"), '{"stale":true}\n');
  const head = runGit(f.dir, "rev-parse", "HEAD");
  overlayCanonicalControlPlane(manager, f.dir);
  assert.deepEqual(JSON.parse(readFileSync(path.join(f.dir,
    ".ai/shared/ACTIVE_TASKS.json"), "utf8")), { canonical: true });
  assert.equal(readFileSync(path.join(f.dir, ".ai/manager/tasks/TCW-101.md"), "utf8"),
    "canonical specification\n");
  assert.equal(runGit(f.dir, "rev-parse", "HEAD"), head);
  writeFileSync(path.join(f.dir, "src/allowed.txt"), "staged change\\n");
  runGit(f.dir, "add", "src/allowed.txt");
  assert.throws(() => overlayCanonicalControlPlane(manager, f.dir), /staged/);
});
test("workflow aggregate never reports PASS for missing, failed, or infrastructure-error tasks", () => {
  const pass = { classification: "PASS" }, fail = { classification: "FAIL" },
    infra = { classification: "INFRA_ERROR" };
  assert.equal(summarizeResults([pass, pass], 2), "PASS");
  assert.equal(summarizeResults([pass], 2), "INFRA_ERROR");
  assert.equal(summarizeResults([pass, fail], 2), "FAIL");
  assert.equal(summarizeResults([pass, infra], 2), "INFRA_ERROR");
  assert.equal(summarizeResults([], 0), "NO_ELIGIBLE_TASK");
  const example = { classification: "PASS", blockers: [], resultSha256: null };
  example.resultSha256 = resultDigest(example);
  assert.equal(resultDigest(example), example.resultSha256);
  example.blockers.push("tampered");
  assert.notEqual(resultDigest(example), example.resultSha256);
});
test("trusted canonical audit precedes NO_ELIGIBLE_TASK and rejects invalid inactive/root/spec state with artifacts", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "tcw-047-e2e-"));
  // A local full-history clone preserves the real immutable trusted verifier ref.
  // No production branch, PR, or canonical repository file is mutated by this fixture.
  execFileSync("git", ["clone", "-q", "--no-hardlinks", "--", ROOT, dir]);
  runGit(dir, "checkout", "-q", "-B", "master");
  runGit(dir, "config", "user.email", "fixture@example.invalid");
  runGit(dir, "config", "user.name", "Fixture");
  const file = path.join(dir, ".ai/shared/ACTIVE_TASKS.json");
  const original = JSON.parse(readFileSync(file, "utf8"));
  const old = structuredClone(original);
  old.updated_at_utc = "2025-01-01T00:00:00Z";
  writeFileSync(file, JSON.stringify(old, null, 2) + "\n");
  runGit(dir, "add", ".");
  runGit(dir, "commit", "-qm", "previous canonical registry");
  let before = runGit(dir, "rev-parse", "HEAD");
  writeFileSync(file, JSON.stringify(original, null, 2) + "\n");
  runGit(dir, "add", ".");
  runGit(dir, "commit", "-qm", "canonical registry metadata-only push");
  const env = { ...process.env, GITHUB_REF: "refs/heads/master",
    GITHUB_REPOSITORY: REPO, GITHUB_TOKEN: "synthetic-read-only-token",
    GITHUB_RUN_ID: "987654321", GITHUB_JOB: "exact-sha-readiness" };
  const output = path.join(dir, "evidence");
  const invoke = (event = "push", id = "") => {
    const current = runGit(dir, "rev-parse", "HEAD");
    return spawnSync(process.execPath, [SCRIPT, "--manager-sha", current,
      "--before-sha", before, "--event", event, "--task", id,
      "--output-dir", output], { cwd: dir, env, encoding: "utf8" });
  };
  const pass = invoke();
  assert.equal(pass.status, 0, pass.stderr + pass.stdout);
  const noTask = JSON.parse(readFileSync(path.join(output, "summary.json")));
  assert.equal(noTask.outcome, "NO_ELIGIBLE_TASK");
  assert.equal(noTask.checkedTaskCount, 0);
  assert.equal(noTask.sha256, digest(JSON.stringify((({ sha256, ...rest }) => rest)(noTask))));
  const invalidId = invoke("workflow_dispatch", "TCW-999");
  assert.equal(invalidId.status, 2);
  assert.equal(JSON.parse(readFileSync(path.join(output, "summary.json"))).outcome, "FAIL");
  for (const corruption of [
    ["root-active-only", (r) => { r.active_only = false; }],
    ["root-workflow-overlay", (r) => { r.workflow_overlay = "wrong.md"; }],
    ["inactive-authority", (r) => {
      const item = r.tasks.find((t) => t.status !== "MANAGER_REVIEW_READY");
      assert.ok(item);
      item.merge_authority = "Builder";
    }]
  ]) {
    before = runGit(dir, "rev-parse", "HEAD");
    const invalid = structuredClone(original);
    corruption[1](invalid);
    writeFileSync(file, JSON.stringify(invalid, null, 2) + "\n");
    runGit(dir, "add", ".");
    runGit(dir, "commit", "-qm", corruption[0]);
    const failure = invoke();
    assert.equal(failure.status, 2, failure.stderr + failure.stdout);
    const result = JSON.parse(readFileSync(path.join(output, "summary.json")));
    assert.equal(result.outcome, "FAIL", corruption[0]);
    const global = JSON.parse(readFileSync(path.join(output, "global-error.json")));
    assert.equal(global.classification, "FAIL", corruption[0]);
    assert.match(global.blockers.join(" "), /canonical static registry\/task-spec validation failed/);
    assert.notEqual(result.outcome, "NO_ELIGIBLE_TASK");
  }
  before = runGit(dir, "rev-parse", "HEAD");
  writeFileSync(file, JSON.stringify(original, null, 2) + "\n");
  runGit(dir, "add", ".");
  runGit(dir, "commit", "-qm", "restore valid canonical state");
  const spec = path.join(dir, ".ai/manager/tasks/TCW-047.md");
  before = runGit(dir, "rev-parse", "HEAD");
  // The canonical task status legitimately advances during Manager integration.
  // Always create a different, valid task-spec STATUS to challenge the trusted
  // validator; a stale hard-coded REWORK_REQUIRED no longer mutates this fixture.
  const canonicalTask = original.tasks.find((item) => item.task_id === "TCW-047");
  assert.ok(canonicalTask);
  const mismatchedStatus = canonicalTask.status === "AUDIT_READY"
    ? "MANAGER_REVIEW_READY" : "AUDIT_READY";
  const specContents = readFileSync(spec, "utf8");
  assert.match(specContents, /^STATUS: [A-Z_]+$/m);
  assert.notEqual(canonicalTask.status, mismatchedStatus);
  writeFileSync(spec, specContents.replace(/^STATUS: [A-Z_]+$/m,
    "STATUS: " + mismatchedStatus));
  runGit(dir, "add", ".");
  runGit(dir, "commit", "-qm", "corrupt inactive canonical task spec");
  const specFail = invoke();
  assert.equal(specFail.status, 2, specFail.stderr + specFail.stdout);
  assert.equal(JSON.parse(readFileSync(path.join(output, "summary.json"))).outcome, "FAIL");
  assert.match(JSON.parse(readFileSync(path.join(output, "global-error.json"))).blockers.join(" "),
    /task spec STATUS/);
});
test("new automation is read-only and never grants merge or freeze authority", () => {
  const workflow = readFileSync(path.join(ROOT, ".github/workflows/task-audit-readiness.yml"), "utf8");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /if: always\(\)/);
  assert.doesNotMatch(workflow, /contents: write|pull-requests: write|merge-pull-request|auto-merge/);
});

test("isolated synthetic Builder checkout runs the real unchanged mechanical helper against canonical Manager state, retains PASS/FAIL/INFRA_ERROR", async () => {
  const source = mkdtempSync(path.join(os.tmpdir(), "tcw-047-source-"));
  runGit(source, "init", "-q");
  runGit(source, "config", "user.email", "fixture@example.invalid");
  runGit(source, "config", "user.name", "Fixture");
  mkdirSync(path.join(source, "scripts"), { recursive: true });
  mkdirSync(path.join(source, "src"), { recursive: true });
  mkdirSync(path.join(source, ".ai/shared"), { recursive: true });
  cpSync(path.join(ROOT, "scripts/audit-workflow.js"),
    path.join(source, "scripts/audit-workflow.js"));
  cpSync(path.join(ROOT, "scripts/workflow-audit-readiness.js"),
    path.join(source, "scripts/workflow-audit-readiness.js"));
  cpSync(path.join(ROOT, "package.json"), path.join(source, "package.json"));
  writeFileSync(path.join(source, ".ai/shared/ACTIVE_TASKS.json"), '{"staleBuilderRegistry":true}\n');
  writeFileSync(path.join(source, "src/allowed.txt"), "baseline\n");
  runGit(source, "add", ".");
  runGit(source, "commit", "-qm", "authorized assignment baseline");
  const baseline = runGit(source, "rev-parse", "HEAD");
  runGit(source, "checkout", "-qb", "builder/tcw-101-example");
  writeFileSync(path.join(source, "src/allowed.txt"), "implementation\n");
  runGit(source, "add", ".");
  runGit(source, "commit", "-qm", "exact Builder checkpoint");
  let checkpoint = runGit(source, "rev-parse", "HEAD");
  const t = {
    ...task(), title: "Synthetic readiness validation", role_label: "Implementation Engineer / Builder",
    dependency: "INDEPENDENT", execution_mode: "STANDARD_CHAT_HIGH", refresh_mode: "FAST_REFRESH",
    blocker_type: "NONE", user_action_required: false, blocked_on_tasks: [], blocked_on: [],
    worker_slot: "synthetic-workflow-audit-readiness", post_merge_canary_required: false,
    task_file: ".ai/manager/tasks/TCW-101.md", role_handoff: ".ai/builder/HANDOFF.md",
    assignment_master_sha: baseline, worker_checkpoint_sha: checkpoint
  };
  const manager = mkdtempSync(path.join(os.tmpdir(), "tcw-047-manager-e2e-"));
  cpSync(path.join(ROOT, ".ai"), path.join(manager, ".ai"), { recursive: true });
  mkdirSync(path.join(manager, "scripts"));
  for (const name of ["scripts/audit-workflow.js", "scripts/workflow-audit-readiness.js", "package.json"]) {
    cpSync(path.join(ROOT, name), path.join(manager, name));
  }
  const managerRegistry = JSON.parse(readFileSync(path.join(ROOT, ".ai/shared/ACTIVE_TASKS.json")));
  managerRegistry.tasks = [t];
  writeFileSync(path.join(manager, ".ai/shared/ACTIVE_TASKS.json"),
    JSON.stringify(managerRegistry, null, 2) + "\n");
  const specPath = path.join(manager, ".ai/manager/tasks/TCW-101.md");
  const spec = [
    "# TCW-101 — Synthetic readiness validation", "Schema: TCW_TASK_V2",
    "ROLE ROUTING: Implementation Engineer / Builder", "STATUS: MANAGER_REVIEW_READY",
    "DEPENDENCY: INDEPENDENT", "EXECUTION MODE: STANDARD_CHAT_HIGH",
    "REFRESH MODE: FAST_REFRESH", "BLOCKER TYPE: NONE", "USER ACTION REQUIRED: false",
    "PRODUCTION_SHA: N/A", "VALIDATED_CI: synthetic", "HANDOFF_SHA: synthetic",
    "INTEGRATION_SHA: N/A", "MANAGER_VERDICT: PENDING", "AUDIT_STATUS: PENDING"
  ].join("\n") + "\n";
  writeFileSync(specPath, spec);
  const artifacts = mkdtempSync(path.join(os.tmpdir(), "tcw-047-evidence-"));
  const readGithub = async (apiPath) => {
    if (apiPath.startsWith("/git/ref/heads/")) return { object: { sha: t.worker_checkpoint_sha } };
    if (apiPath.startsWith("/pulls/")) return remote(t).pr;
    throw Error("unexpected API URL");
  };
  const options = { readGithub, originUrl: source,
    trustedFiles: (name) => readFileSync(path.join(ROOT, name), "utf8") };
  assert.equal(authenticateTrustedVerifier(manager, source, options).commit, TRUSTED_VERIFIER_SHA);
  assert.equal(validateCanonicalState(manager, options).commit, TRUSTED_VERIFIER_SHA);
  const managerSha = SHA("e");
  const pass = await runTask(t, manager, managerSha, "test-token", artifacts, options);
  assert.equal(pass.classification, "PASS", JSON.stringify(pass));
  assert.deepEqual(pass.changedFiles, ["src/allowed.txt"]);
  assert.equal(pass.originalPacketSha256?.length, 64);
  assert.equal(pass.provenance.builderTargetPinnedToExactSha, true);
  assert.equal(pass.provenance.trustedVerifierAnchorSha, TRUSTED_VERIFIER_SHA);
  assert.equal(Object.keys(pass.provenance.trustedVerifierFileSha256).length, 3);
  assert.equal(pass.provenance.canonicalControlPlaneOverlaid, true);
  assert.equal(pass.provenance.originalTargetHeadUnchanged, true);
  assert.equal(pass.provenance.trustedDirectInvocationVerified, true);
  assert.equal(pass.resultSha256, resultDigest(pass));
  assert.equal(JSON.parse(readFileSync(path.join(artifacts, "TCW-101.json"))).classification, "PASS");
  assert.match(readFileSync(path.join(artifacts, "TCW-101.log"), "utf8"), /verified/);
  // Static validator catches the canonical task-spec inconsistency before issuing a PASS packet.
  writeFileSync(specPath, spec.replace("STATUS: MANAGER_REVIEW_READY", "STATUS: ASSIGNED"));
  const failed = await runTask(t, manager, managerSha, "test-token", artifacts, options);
  assert.equal(failed.classification, "FAIL", JSON.stringify(failed));
  assert.equal(failed.originalPacketSha256, null);
  assert.match(failed.blockers.join(" "), /task spec STATUS/);
  assert.equal(JSON.parse(readFileSync(path.join(artifacts, "TCW-101.json"))).classification, "FAIL");
  // A transient/unavailable Git remote is infrastructure, not a mechanical PASS or FAIL.
  const infra = await runTask(t, manager, managerSha, "test-token", artifacts,
    { ...options, originUrl: path.join(manager, "missing-git-remote") });
  assert.equal(infra.classification, "INFRA_ERROR", JSON.stringify(infra));
  assert.equal(JSON.parse(readFileSync(path.join(artifacts, "TCW-101.json"))).classification, "INFRA_ERROR");
  // A local filesystem/process permission error is INFRA_ERROR and its diagnostics are sanitized.
  const denied = await runTask(t, manager, managerSha, "test-token", artifacts,
    { ...options, readGithub: async () => {
      const error = new Error("Bearer test-token credential leaked");
      error.code = "EACCES";
      throw error;
    } });
  assert.equal(denied.classification, "INFRA_ERROR");
  assert.doesNotMatch(readFileSync(path.join(artifacts, "TCW-101.json"), "utf8"), /test-token/);
  // Allow broad future scripts/package scope, but never permit self-verifier tampering.
  writeFileSync(specPath, spec);
  t.allowed_path_prefixes = ["src/allowed.txt", "scripts/", "package.json"];
  t.forbidden_path_prefixes = [];
  for (const name of ["scripts/workflow-audit-readiness.js", "scripts/audit-workflow.js", "package.json"]) {
    for (const trustedName of ["scripts/workflow-audit-readiness.js", "scripts/audit-workflow.js", "package.json"]) {
      writeFileSync(path.join(source, trustedName), readFileSync(path.join(ROOT, trustedName), "utf8"));
    }
    const original = readFileSync(path.join(source, name), "utf8");
    const tampered = name === "package.json" ? JSON.stringify({
      ...JSON.parse(original), scripts: { ...JSON.parse(original).scripts,
        "preworkflow:audit-readiness": "node -e \"process.stdout.write(\u0027FAKE PASS\u0027)\"",
        "workflow:audit-readiness": "node -e \"process.stdout.write(\u0027FAKE PASS\u0027)\"" }
    }) : original + "\n// malicious verifier returns fabricated PASS packet\n";
    writeFileSync(path.join(source, name), tampered);
    runGit(source, "add", ".");
    runGit(source, "commit", "-qm", "synthetic authorized broad-scope " + name);
    checkpoint = runGit(source, "rev-parse", "HEAD");
    t.worker_checkpoint_sha = checkpoint;
    managerRegistry.tasks = [t];
    writeFileSync(path.join(manager, ".ai/shared/ACTIVE_TASKS.json"),
      JSON.stringify(managerRegistry, null, 2) + "\n");
    const rejected = await runTask(t, manager, managerSha, "test-token", artifacts, options);
    assert.equal(rejected.classification, "FAIL", name + ": " + JSON.stringify(rejected));
    assert.match(rejected.blockers.join(" "), /trusted verifier source diverges/);
    assert.equal(rejected.provenance.originalPacketVerified, false);
    assert.equal(JSON.parse(readFileSync(path.join(artifacts, "TCW-101.json"))).classification, "FAIL");
  }
});

test("canonical Manager verifier alterations require an explicit trust-anchor update", () => {
  const manager = mkdtempSync(path.join(os.tmpdir(), "tcw-047-canonical-trust-"));
  mkdirSync(path.join(manager, "scripts"));
  const files = ["scripts/audit-workflow.js", "scripts/workflow-audit-readiness.js", "package.json"];
  for (const name of files) cpSync(path.join(ROOT, name), path.join(manager, name));
  const options = { trustedFiles: (name) => readFileSync(path.join(ROOT, name), "utf8") };
  assert.equal(authenticateTrustedVerifier(manager, null, options).commit, TRUSTED_VERIFIER_SHA);
  for (const name of files) {
    const location = path.join(manager, name), original = readFileSync(location, "utf8");
    writeFileSync(location, original + "\n");
    assert.throws(() => authenticateTrustedVerifier(manager, null, options),
      /canonical Manager trusted verifier source diverges from frozen anchor/);
    writeFileSync(location, original);
  }
});
