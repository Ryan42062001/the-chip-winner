import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const ID = /^TCW-\d{3}$/;
const BRANCH = /^builder\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const READY = new Set(["MANAGER_REVIEW_READY", "AUDIT_READY", "MERGE_READY"]);
const SCHEMA = "TCW_TASK_AUDIT_READINESS_AUTOMATION_V1";
const REPO = "Ryan42062001/the-chip-winner";

function fail(reason, classification = "FAIL") {
  const error = new Error(reason);
  error.classification = classification;
  throw error;
}
function assert(condition, reason, classification) {
  if (!condition) fail(reason, classification);
}
function sha(value) { return typeof value === "string" && SHA.test(value); }
function stamp() { return new Date().toISOString(); }
function git(cwd, args, env = process.env) {
  return execFileSync("git", args, { cwd, env, encoding: "utf8", timeout: 120000, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function digest(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function resultDigest(result) { const { resultSha256, ...fields } = result; return digest(JSON.stringify(fields)); }
function writeJson(location, data) { writeFileSync(location, JSON.stringify(data, null, 2) + "\n"); }
function safeDiagnostic(error) {
  return String(error?.message || error || "Unknown error").slice(0, 800)
    .replace(/(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/g, "[REDACTED]");
}
function controlPath(name) { return name.startsWith(".ai/"); }
function pathAllowed(name, task) {
  const matches = (rule) => rule.endsWith("/") ? name.startsWith(rule) : name === rule;
  return !task.forbidden_path_prefixes.some(matches) && task.allowed_path_prefixes.some(matches);
}
export function validateCandidate(task) {
  const errors = [];
  if (!task || typeof task !== "object") return ["missing task metadata"];
  if (!ID.test(task.task_id || "")) errors.push("invalid task ID");
  if (task.owner !== "Builder") errors.push("task is not Builder-owned");
  if (!READY.has(task.status)) errors.push("task status is not audit-readiness eligible");
  if (task.audit_required !== true) errors.push("audit_required must be true");
  if (!BRANCH.test(task.branch || "")) errors.push("invalid assigned Builder branch");
  if (!sha(task.assignment_master_sha)) errors.push("invalid assignment baseline SHA");
  if (!sha(task.worker_checkpoint_sha)) errors.push("missing or invalid worker checkpoint SHA");
  if (!Number.isSafeInteger(task.pr) || task.pr <= 0) errors.push("missing or invalid assigned PR");
  if (task.merge_authority !== "Manager") errors.push("merge authority must remain Manager-owned");
  if (!Array.isArray(task.allowed_path_prefixes) || !task.allowed_path_prefixes.length ||
      !Array.isArray(task.forbidden_path_prefixes) ||
      !task.allowed_path_prefixes.every((x) => typeof x === "string") ||
      !task.forbidden_path_prefixes.every((x) => typeof x === "string")) errors.push("invalid task write-scope metadata");
  return errors;
}
function significant(task) {
  if (!task) return null;
  const keys = ["task_id", "owner", "status", "audit_required", "branch",
    "assignment_master_sha", "worker_checkpoint_sha", "pr", "task_file",
    "allowed_path_prefixes", "forbidden_path_prefixes", "merge_authority"];
  return JSON.stringify(Object.fromEntries(keys.map((key) => [key, task[key] ?? null])));
}
export function selectEligibleTasks(current, previous, options = {}) {
  assert(current && current.schema_version === 3 && current.workflow_version === "V3.2" &&
    current.canonical_branch === "master" && current.manager_owned === true &&
    Array.isArray(current.tasks), "canonical Manager registry has invalid root metadata");
  const ids = new Set();
  for (const task of current.tasks) {
    assert(task && ID.test(task.task_id || "") && !ids.has(task.task_id),
      "canonical Manager registry contains invalid or duplicated task IDs");
    ids.add(task.task_id);
  }
  const ready = current.tasks.filter((task) => task.owner === "Builder" &&
    READY.has(task.status) && task.audit_required === true);
  if (options.dispatch) {
    assert(ID.test(options.taskId || ""), "manual dispatch requires a valid task ID");
    const selected = current.tasks.find((task) => task.task_id === options.taskId);
    assert(selected, "manual dispatch task is not present in canonical registry");
    assert(ready.includes(selected), "manual dispatch task is not audit-readiness eligible");
    return [selected];
  }
  assert(previous && Array.isArray(previous.tasks), "previous canonical registry unavailable", "INFRA_ERROR");
  const prior = new Map(previous.tasks.map((task) => [task.task_id, task]));
  const changed = new Set(options.changedTaskSpecs || []);
  return ready.filter((task) => significant(task) !== significant(prior.get(task.task_id)) ||
    changed.has(task.task_id));
}
export function validateRemoteSnapshot(task, remote, repository = REPO) {
  const blockers = validateCandidate(task);
  if (!remote || remote.refSha !== task.worker_checkpoint_sha) blockers.push("assigned branch HEAD differs from immutable Manager checkpoint");
  const pr = remote?.pr;
  if (!pr || pr.number !== task.pr || pr.state !== "open" ||
      pr.head?.sha !== task.worker_checkpoint_sha ||
      pr.head?.ref !== task.branch || pr.head?.repo?.full_name !== repository ||
      pr.base?.ref !== "master" || pr.base?.repo?.full_name !== repository) {
    blockers.push("assigned PR identity, branch, base, or head differs from canonical Manager checkpoint");
  }
  return blockers;
}
export function verifyOriginalPacket(packet, task) {
  assert(packet && typeof packet === "object", "mechanical helper did not emit a JSON packet");
  const { sha256, ...payload } = packet;
  assert(typeof sha256 === "string" && HASH.test(sha256) && digest(JSON.stringify(payload)) === sha256, "mechanical helper packet SHA256 integrity mismatch");
  assert(packet.schema === "TCW_AUDIT_READINESS_V1" && packet.taskId === task.task_id &&
    packet.branch === task.branch && packet.head === task.worker_checkpoint_sha &&
    packet.assignmentMasterSha === task.assignment_master_sha &&
    packet.pr === task.pr && packet.auditRequired === true,
  "mechanical helper packet provenance does not match Manager metadata");
  assert(Array.isArray(packet.changedFiles) && Array.isArray(packet.blockers) &&
    typeof packet.readyForManagerFreeze === "boolean", "mechanical helper packet shape invalid");
  return packet.blockers;
}
export function summarizeResults(results, selectedCount) {
  if (selectedCount === 0) return "NO_ELIGIBLE_TASK";
  if (results.length !== selectedCount) return "INFRA_ERROR";
  if (results.some((result) => result.classification === "INFRA_ERROR")) return "INFRA_ERROR";
  if (results.some((result) => result.classification !== "PASS")) return "FAIL";
  return "PASS";
}
function authenticatedGitEnv(token) {
  return {
    ...process.env,
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_0: "AUTHORIZATION: basic " + Buffer.from("x-access-token:" + token).toString("base64")
  };
}
function unprivilegedEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(?:GITHUB_TOKEN|GH_TOKEN|ACTIONS_RUNTIME_TOKEN|GIT_CONFIG_)/.test(key)) delete env[key];
  }
  return env;
}
async function githubJson(apiPath, token) {
  let response;
  try {
    response = await fetch("https://api.github.com/repos/" + REPO + apiPath, {
      headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28" },
      signal: AbortSignal.timeout(30000)
    });
  } catch { fail("GitHub API request failed or timed out", "INFRA_ERROR"); }
  if (!response.ok) fail("GitHub API returned HTTP " + response.status,
    response.status === 404 ? "FAIL" : "INFRA_ERROR");
  return response.json();
}
function verifyGitCheckout(dir, task) {
  assert(git(dir, ["rev-parse", "HEAD"]) === task.worker_checkpoint_sha,
    "isolated checkout HEAD differs from exact Manager checkpoint");
  assert(git(dir, ["branch", "--show-current"]) === task.branch,
    "isolated checkout branch name differs from Manager assignment");
  try { git(dir, ["cat-file", "-e", task.assignment_master_sha + "^{commit}"]); }
  catch { fail("assignment baseline commit is missing from isolated checkout"); }
  const ancestor = spawnSync("git", ["merge-base", "--is-ancestor",
    task.assignment_master_sha, task.worker_checkpoint_sha], { cwd: dir });
  assert(ancestor.status === 0, "assignment baseline is not an ancestor of immutable Builder target");
  const changedFiles = git(dir, ["diff", "--name-only",
    task.assignment_master_sha + "..HEAD"]).split(/\r?\n/).filter(Boolean);
  // --no-renames checks both old and new names, not only a renamed destination.
  const allChangedPaths = git(dir, ["diff", "--name-only", "--no-renames",
    task.assignment_master_sha + "..HEAD"]).split(/\r?\n/).filter(Boolean);
  const unauthorized = allChangedPaths.filter((name) => !pathAllowed(name, task));
  assert(unauthorized.length === 0, "changed paths outside task authority: " + unauthorized.join(", "));
  return changedFiles;
}
function verifyOnlyCanonicalOverlay(builder) {
  const status = git(builder, ["status", "--porcelain", "-z", "--untracked-files=all"]);
  const entries = status.split("\0").filter(Boolean);
  for (const entry of entries) {
    const name = entry.slice(3);
    assert(entry[0] !== "?" || entry[1] === "?", "malformed git status entry");
    assert(entry.slice(0, 2) === "??" || entry[0] === " " && entry[1] !== " " ||
      entry.slice(0, 2) === " M", "unexpected staged or conflicted checkout changes");
    assert(controlPath(name), "non-control-plane checkout modification: " + name);
  }
  assert(!git(builder, ["diff", "--cached", "--name-only"]), "unexpected staged changes in Builder checkout");
}
function overlayCanonicalControlPlane(manager, builder) {
  assert(existsSync(path.join(manager, ".ai/shared/ACTIVE_TASKS.json")) &&
    existsSync(path.join(manager, ".ai/manager")), "canonical Manager control-plane source missing");
  cpSync(path.join(manager, ".ai"), path.join(builder, ".ai"),
    { recursive: true, force: true, dereference: false });
  verifyOnlyCanonicalOverlay(builder);
}
function runMechanical(builder, task) {
  const child = spawnSync("npm", ["run", "workflow:audit-readiness", "--", "--task", task.task_id],
    { cwd: builder, env: unprivilegedEnv(), encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024 });
  if (child.error) fail("mechanical helper could not execute: " + safeDiagnostic(child.error), "INFRA_ERROR");
  if (child.signal) fail("mechanical helper timed out or was terminated", "INFRA_ERROR");
  let packet;
  try { packet = JSON.parse(child.stdout.trim()); } catch { /* static validator may fail before producing a packet */ }
  if (!packet) {
    fail(child.status === 0 ? "mechanical helper produced no valid JSON packet" :
      "static workflow audit or mechanical helper rejected the canonical state: exit " + child.status);
  }
  const blockers = verifyOriginalPacket(packet, task);
  assert(child.status === 0 && packet.readyForManagerFreeze === true && blockers.length === 0,
    "mechanical readiness helper reported blockers: " + blockers.join("; "));
  return packet;
}
function baseResult(task, managerSha) {
  return {
    schema: SCHEMA, taskId: task.task_id, canonicalManagerSha: managerSha,
    builderTargetSha: task.worker_checkpoint_sha ?? null, branch: task.branch ?? null,
    pr: task.pr ?? null, assignmentBaselineSha: task.assignment_master_sha ?? null,
    changedFiles: [], blockers: [], readinessStatus: "NOT_READY", classification: "INFRA_ERROR",
    originalPacketSha256: null, startedAt: stamp(), completedAt: null,
    workflow: { repository: REPO, runId: process.env.GITHUB_RUN_ID || null,
      attempt: process.env.GITHUB_RUN_ATTEMPT || null, job: process.env.GITHUB_JOB || null,
      url: process.env.GITHUB_RUN_ID ? "https://github.com/" + REPO + "/actions/runs/" + process.env.GITHUB_RUN_ID : null },
    provenance: { canonicalRegistryFrom: managerSha, builderTargetPinnedToExactSha: false,
      isolatedBranchVerified: false, originalTargetHeadUnchanged: false,
      canonicalControlPlaneOverlaid: false, originalPacketVerified: false },
    resultSha256: null
  };
}
async function runTask(task, manager, managerSha, token, artifacts) {
  const result = baseResult(task, managerSha);
  const log = [];
  let builder = null;
  try {
    const blockers = validateCandidate(task);
    assert(blockers.length === 0, blockers.join("; "));
    const remoteBranch = await githubJson("/git/ref/heads/" + task.branch, token);
    const pr = await githubJson("/pulls/" + task.pr, token);
    const remote = { refSha: remoteBranch.object?.sha, pr };
    const remoteBlockers = validateRemoteSnapshot(task, remote);
    assert(remoteBlockers.length === 0, remoteBlockers.join("; "));
    builder = mkdtempSync(path.join(os.tmpdir(), "tcw-audit-readiness-"));
    git(builder, ["init", "-q"]);
    git(builder, ["remote", "add", "origin", "https://github.com/" + REPO + ".git"]);
    // Fetch the advertised assigned branch, then pin the exact Manager-recorded SHA.
    try {
      git(builder, ["fetch", "--no-tags", "origin", "refs/heads/" + task.branch],
        authenticatedGitEnv(token));
    } catch { fail("authenticated Git fetch of assigned Builder branch failed", "INFRA_ERROR"); }
    assert(git(builder, ["rev-parse", "FETCH_HEAD"]) === task.worker_checkpoint_sha,
      "Builder branch advanced between GitHub API verification and Git fetch");
    git(builder, ["checkout", "-q", "-B", task.branch, task.worker_checkpoint_sha]);
    result.changedFiles = verifyGitCheckout(builder, task);
    result.provenance.builderTargetPinnedToExactSha = true;
    result.provenance.isolatedBranchVerified = true;
    overlayCanonicalControlPlane(manager, builder);
    result.provenance.canonicalControlPlaneOverlaid = true;
    const packet = runMechanical(builder, task);
    assert(JSON.stringify(packet.changedFiles) === JSON.stringify(result.changedFiles),
      "mechanical helper changed-files packet differs from verified Git diff");
    result.originalPacketSha256 = packet.sha256;
    result.changedFiles = packet.changedFiles;
    result.provenance.originalPacketVerified = true;
    verifyOnlyCanonicalOverlay(builder);
    assert(git(builder, ["rev-parse", "HEAD"]) === task.worker_checkpoint_sha,
      "Builder HEAD changed during readiness execution");
    // Revalidate the two remote refs to reject advancement while the helper executed.
    const finalBranch = await githubJson("/git/ref/heads/" + task.branch, token);
    const finalPr = await githubJson("/pulls/" + task.pr, token);
    const finalBlockers = validateRemoteSnapshot(task,
      { refSha: finalBranch.object?.sha, pr: finalPr });
    assert(finalBlockers.length === 0,
      "assigned Builder branch or PR advanced during readiness: " + finalBlockers.join("; "));
    result.provenance.originalTargetHeadUnchanged = true;
    result.classification = "PASS";
    result.readinessStatus = "MECHANICALLY_READY_ONLY";
    log.push("Exact SHA, branch, PR, ancestor, diff, canonical metadata and helper packet verified.");
  } catch (error) {
    result.classification = error?.classification === "INFRA_ERROR" ? "INFRA_ERROR" : "FAIL";
    result.blockers.push(safeDiagnostic(error));
    log.push(result.blockers[0]);
  } finally {
    result.completedAt = stamp();
    result.resultSha256 = resultDigest(result);
    writeJson(path.join(artifacts, task.task_id + ".json"), result);
    writeFileSync(path.join(artifacts, task.task_id + ".log"), log.join("\n") + "\n");
  }
  return result;
}
async function main() {
  const args = process.argv.slice(2);
  const option = (name) => {
    const index = args.indexOf(name);
    return index < 0 ? null : args[index + 1] ?? null;
  };
  const artifacts = path.resolve(option("--output-dir") || "audit-readiness-evidence");
  mkdirSync(artifacts, { recursive: true });
  const manager = process.cwd();
  const managerSha = option("--manager-sha") || "";
  const event = option("--event") || "";
  const taskId = option("--task");
  const results = [];
  let selected = [];
  let overall = "INFRA_ERROR";
  try {
    assert(sha(managerSha) && git(manager, ["rev-parse", "HEAD"]) === managerSha,
      "triggering canonical Manager SHA does not match checkout");
    assert(process.env.GITHUB_REF === "refs/heads/master",
      "readiness automation must execute from canonical master ref");
    assert(process.env.GITHUB_REPOSITORY === REPO, "GitHub repository identity mismatch");
    assert(event === "push" || event === "workflow_dispatch", "unsupported readiness event");
    const token = process.env.GITHUB_TOKEN;
    assert(typeof token === "string" && token.length > 0,
      "read-only GitHub Actions token missing", "INFRA_ERROR");
    const registry = JSON.parse(readFileSync(path.join(manager, ".ai/shared/ACTIVE_TASKS.json"), "utf8"));
    let previous = null;
    let changedTaskSpecs = [];
    if (event === "push") {
      const before = option("--before-sha");
      assert(sha(before) && before !== managerSha, "push previous SHA missing or invalid", "INFRA_ERROR");
      try {
        previous = JSON.parse(git(manager, ["show", before + ":.ai/shared/ACTIVE_TASKS.json"]));
        changedTaskSpecs = git(manager, ["diff", "--name-only", before, managerSha, "--",
          ".ai/manager/tasks/"]).split(/\r?\n/).filter(Boolean)
          .map((name) => name.match(/^\.ai\/manager\/tasks\/(TCW-\d{3})\.md$/)?.[1]).filter(Boolean);
      } catch { fail("previous canonical Manager registry or changed task specs unavailable", "INFRA_ERROR"); }
    }
    selected = selectEligibleTasks(registry, previous,
      { dispatch: event === "workflow_dispatch", taskId, changedTaskSpecs });
    assert(selected.length <= 50, "unreasonably large eligible readiness batch");
    for (const task of selected) {
      // Each task is isolated. One task's failure cannot suppress another task's evidence.
      results.push(await runTask(task, manager, managerSha, token, artifacts));
    }
    overall = summarizeResults(results, selected.length);
  } catch (error) {
    const global = { schema: SCHEMA, canonicalManagerSha: managerSha,
      classification: error?.classification === "INFRA_ERROR" ? "INFRA_ERROR" : "FAIL",
      blockers: [safeDiagnostic(error)], completedAt: stamp() };
    writeJson(path.join(artifacts, "global-error.json"), global);
    overall = global.classification;
  }
  const summary = { schema: SCHEMA, canonicalManagerSha: managerSha,
    outcome: overall, eligibleTaskCount: selected.length, checkedTaskCount: results.length,
    tasks: results.map((r) => ({ taskId: r.taskId, classification: r.classification,
      resultSha256: r.resultSha256 })), completedAt: stamp() };
  summary.sha256 = digest(JSON.stringify(summary));
  writeJson(path.join(artifacts, "summary.json"), summary);
  console.log("TCW task audit-readiness outcome: " + overall +
    "; eligible=" + selected.length + "; checked=" + results.length);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY,
      "\n## Task audit-readiness\n\nOutcome: **" + overall + "**; eligible: " +
      selected.length + "; checked: " + results.length +
      "\n\nMechanical evidence only; no freeze, audit verdict or merge authority.\n",
      { flag: "a" });
  }
  if (overall === "FAIL") process.exitCode = 2;
  else if (overall === "INFRA_ERROR") process.exitCode = 3;
}
const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) await main();

export { verifyGitCheckout, overlayCanonicalControlPlane, pathAllowed, digest, resultDigest };
