import { access, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWED_STATUSES = Object.freeze([
  "PLANNED",
  "WAITING_EXTERNAL_EVIDENCE",
  "BLOCKED",
  "ASSIGNED",
  "IN_PROGRESS",
  "MANAGER_REVIEW_READY",
  "AUDIT_READY",
  "MERGE_READY",
  "REWORK_REQUIRED",
  "MERGED",
  "VERIFYING_MASTER",
  "CLOSED"
]);

const ACTIVE_STALE_STATUSES = new Set([
  "ASSIGNED",
  "IN_PROGRESS",
  "MANAGER_REVIEW_READY",
  "AUDIT_READY",
  "MERGE_READY",
  "REWORK_REQUIRED"
]);
const OWNERS = new Set(["Manager", "Builder", "Auditor", "R&D", "Strategy", "Troubleshooting"]);
const DEPENDENCIES = new Set(["INDEPENDENT", "SOFT", "HARD"]);
const EXECUTION_MODES = new Set(["STANDARD_CHAT", "WORK_MODE_PREFERRED", "WORK_MODE_HIGH_VALUE"]);
const MERGE_AUTHORITIES = new Set(["Manager"]);
const BRANCH_PREFIX = Object.freeze({
  Manager: "manager/",
  Builder: "builder/",
  Auditor: "auditor/",
  "R&D": "rnd/",
  Strategy: "strategy/",
  Troubleshooting: "troubleshooting/"
});
const TARGET_ADVANCEMENT = new Set(["CONTROL_PLANE_ONLY", "NON_OVERLAPPING", "OVERLAPPING_RISK"]);
const TASK_ID_RE = /^TCW-(?:PW-)?\d{3}$/;
const SHA_RE = /^[0-9a-f]{40}$/;

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function validateRegistryShape(registry) {
  const errors = [];
  const warnings = [];
  add(errors, registry?.schema_version === 2, "ACTIVE_TASKS schema_version must be 2 for Workflow V3.1.");
  add(errors, registry?.canonical_branch === "master", "canonical_branch must be master.");
  add(errors, registry?.manager_owned === true, "ACTIVE_TASKS must remain Manager-owned.");
  add(errors, Array.isArray(registry?.tasks), "tasks must be an array.");
  add(errors, Array.isArray(registry?.lifecycle_states), "lifecycle_states must be an array.");

  const lifecycle = new Set(registry?.lifecycle_states || []);
  for (const status of ALLOWED_STATUSES) {
    add(errors, lifecycle.has(status), `lifecycle_states is missing ${status}.`);
  }

  const ids = new Set();
  for (const task of registry?.tasks || []) {
    const id = task?.task_id;
    add(errors, TASK_ID_RE.test(id || ""), `Invalid task_id: ${id}`);
    if (ids.has(id)) errors.push(`Duplicate task_id in ACTIVE_TASKS: ${id}`);
    ids.add(id);

    add(errors, OWNERS.has(task?.owner), `${id}: invalid owner ${task?.owner}`);
    add(errors, ALLOWED_STATUSES.includes(task?.status), `${id}: invalid status ${task?.status}`);
    add(errors, DEPENDENCIES.has(task?.dependency), `${id}: invalid dependency ${task?.dependency}`);
    add(errors, EXECUTION_MODES.has(task?.execution_mode), `${id}: invalid execution_mode ${task?.execution_mode}`);
    add(errors, MERGE_AUTHORITIES.has(task?.merge_authority), `${id}: merge_authority must be Manager.`);
    add(errors, typeof task?.task_file === "string" && task.task_file.startsWith(".ai/manager/tasks/"), `${id}: task_file must be a Manager task spec path.`);
    add(errors, typeof task?.role_handoff === "string" && task.role_handoff.startsWith(".ai/"), `${id}: role_handoff must be an .ai path.`);
    add(errors, SHA_RE.test(task?.assignment_master_sha || ""), `${id}: assignment_master_sha must be a full SHA.`);

    if (task?.branch) {
      add(errors, task.branch.startsWith(BRANCH_PREFIX[task.owner] || ""), `${id}: branch ${task.branch} does not match owner ${task.owner}.`);
    }
    if (task?.pr !== null && task?.pr !== undefined) {
      add(errors, Number.isInteger(task.pr) && task.pr > 0, `${id}: pr must be a positive integer or null.`);
    }
    if (task?.supersedes_pr !== undefined && task?.supersedes_pr !== null) {
      add(errors, Number.isInteger(task.supersedes_pr) && task.supersedes_pr > 0, `${id}: supersedes_pr must be a positive integer.`);
    }
    if (task?.supersedes_task !== undefined && task?.supersedes_task !== null) {
      add(errors, TASK_ID_RE.test(task.supersedes_task), `${id}: invalid supersedes_task ${task.supersedes_task}.`);
      add(errors, task.supersedes_task !== id, `${id}: a task cannot supersede itself.`);
    }

    if (task?.status === "WAITING_EXTERNAL_EVIDENCE") {
      add(errors, typeof task.external_actor === "string" && task.external_actor.length > 0, `${id}: WAITING_EXTERNAL_EVIDENCE requires external_actor.`);
      add(errors, typeof task.external_action === "string" && task.external_action.length > 0, `${id}: WAITING_EXTERNAL_EVIDENCE requires external_action.`);
      add(errors, OWNERS.has(task.resume_role), `${id}: WAITING_EXTERNAL_EVIDENCE requires a valid resume_role.`);
    }

    if (task?.target_advancement) {
      add(errors, TARGET_ADVANCEMENT.has(task.target_advancement.classification), `${id}: invalid target_advancement classification.`);
      add(errors, SHA_RE.test(task.target_advancement.checked_at_sha || ""), `${id}: target_advancement.checked_at_sha must be a full SHA.`);
    }

    if (task?.status === "CLOSED") {
      const verification = task.verification || {};
      add(errors, SHA_RE.test(verification.master_sha || ""), `${id}: CLOSED requires verification.master_sha.`);
      add(errors, Number.isInteger(verification.post_merge_run) && verification.post_merge_run > 0, `${id}: CLOSED requires verification.post_merge_run.`);
      add(errors, verification.post_merge_result === "PASS", `${id}: CLOSED requires verification.post_merge_result PASS.`);
    }
  }

  return { errors, warnings };
}

export async function validateRegistryFiles(registry, rootDir = process.cwd()) {
  const errors = [];
  for (const task of registry?.tasks || []) {
    for (const [label, relativePath] of [["task_file", task.task_file], ["role_handoff", task.role_handoff]]) {
      if (!relativePath) continue;
      try {
        await access(path.join(rootDir, relativePath));
      } catch {
        errors.push(`${task.task_id}: ${label} does not exist: ${relativePath}`);
      }
    }
  }
  return errors;
}

export function taskIdFromPullRequest(pr) {
  const text = `${pr?.title || ""}\n${pr?.body || ""}`;
  const explicit = text.match(/^Task-ID:\s*(TCW-(?:PW-)?\d{3})\s*$/im)?.[1];
  return explicit || text.match(/\bTCW-(?:PW-)?\d{3}\b/)?.[0] || null;
}

function supersedesPrNumbers(pr) {
  const text = `${pr?.title || ""}\n${pr?.body || ""}`;
  return [...text.matchAll(/^Supersedes-PR:\s*#?(\d+)\s*$/gim)].map((match) => Number(match[1]));
}

export function detectDuplicateTaskPullRequests(prs) {
  const groups = new Map();
  for (const pr of prs || []) {
    const taskId = taskIdFromPullRequest(pr);
    if (!taskId) continue;
    const group = groups.get(taskId) || [];
    group.push(pr);
    groups.set(taskId, group);
  }

  const errors = [];
  const warnings = [];
  for (const [taskId, group] of groups.entries()) {
    if (group.length < 2) continue;
    const numbers = new Set(group.map((pr) => Number(pr.number)));
    const hasExplicitSupersession = group.some((pr) => supersedesPrNumbers(pr).some((number) => numbers.has(number)));
    if (hasExplicitSupersession) {
      warnings.push(`${taskId}: multiple open PRs exist but explicit Supersedes-PR metadata is present; close the superseded PR promptly.`);
    } else {
      errors.push(`${taskId}: multiple open PRs claim the same Task ID without Supersedes-PR metadata.`);
    }
  }
  return { errors, warnings };
}

function gitCommitCount(fromSha, targetRef, cwd = process.cwd()) {
  try {
    execFileSync("git", ["cat-file", "-e", `${fromSha}^{commit}`], { cwd, stdio: "ignore" });
    execFileSync("git", ["cat-file", "-e", `${targetRef}^{commit}`], { cwd, stdio: "ignore" });
    return Number(execFileSync("git", ["rev-list", "--count", `${fromSha}..${targetRef}`], { cwd, encoding: "utf8" }).trim());
  } catch {
    return null;
  }
}

export function checkAssignmentStaleness(registry, { rootDir = process.cwd(), threshold = 3, targetRef = "HEAD" } = {}) {
  const errors = [];
  const warnings = [];
  for (const task of registry?.tasks || []) {
    if (!ACTIVE_STALE_STATUSES.has(task.status)) continue;
    const count = gitCommitCount(task.assignment_master_sha, targetRef, rootDir);
    if (count === null) {
      warnings.push(`${task.task_id}: assignment drift could not be calculated; perform Fast Refresh manually.`);
      continue;
    }
    if (count <= threshold) continue;
    if (!task.target_advancement) {
      errors.push(`${task.task_id}: assignment is ${count} commits behind HEAD; Full Refresh or target-advancement classification is required.`);
    } else {
      warnings.push(`${task.task_id}: assignment is ${count} commits behind HEAD; recorded ${task.target_advancement.classification} classification must be rechecked before merge.`);
    }
  }
  return { errors, warnings };
}

async function fetchOpenPullRequests(repository) {
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/${repository}/pulls?state=open&per_page=100`, { headers });
  if (!response.ok) throw new Error(`GitHub PR query failed with HTTP ${response.status}.`);
  return response.json();
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const registry = JSON.parse(await readFile(path.join(rootDir, ".ai/shared/ACTIVE_TASKS.json"), "utf8"));
  const shape = validateRegistryShape(registry);
  const fileErrors = await validateRegistryFiles(registry, rootDir);
  const ciMode = process.argv.includes("--ci");
  const inGitHubActions = process.env.GITHUB_ACTIONS === "true";
  const targetRef = inGitHubActions && process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "HEAD";
  const stale = ciMode && inGitHubActions ? checkAssignmentStaleness(registry, { rootDir, targetRef }) : { errors: [], warnings: [] };
  const errors = [...shape.errors, ...fileErrors, ...stale.errors];
  const warnings = [...shape.warnings, ...stale.warnings];

  if (ciMode && process.env.GITHUB_REPOSITORY) {
    try {
      const duplicatePrs = detectDuplicateTaskPullRequests(await fetchOpenPullRequests(process.env.GITHUB_REPOSITORY));
      errors.push(...duplicatePrs.errors);
      warnings.push(...duplicatePrs.warnings);
    } catch (error) {
      warnings.push(`Open-PR duplicate check unavailable: ${error.message}`);
    }
  }

  console.log(`Workflow V3.1 audit · ${registry.tasks.length} tracked task${registry.tasks.length === 1 ? "" : "s"}`);
  for (const warning of warnings) console.warn(`WARN ${warning}`);
  for (const error of errors) console.error(`ERROR ${error}`);
  if (errors.length) process.exitCode = 1;
  else console.log("PASS workflow registry integrity checks.");
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) await main();
