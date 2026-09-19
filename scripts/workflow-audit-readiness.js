import crypto from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA = /^[0-9a-f]{40}$/;

function parseArgs(raw = process.argv.slice(2)) {
  const out = { task: null, json: false, output: null };
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === "--task") out.task = raw[++i];
    else if (raw[i] === "--json") out.json = true;
    else if (raw[i] === "--output") out.output = raw[++i];
  }
  if (!out.task) throw new Error("Usage: node scripts/workflow-audit-readiness.js --task TCW-### [--json] [--output path]");
  return out;
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function pathAllowed(file, task) {
  const allowed = task.allowed_path_prefixes || [];
  const forbidden = task.forbidden_path_prefixes || [];
  const matches = (rule) => rule.endsWith("/") ? file.startsWith(rule) : file === rule;
  if (forbidden.some(matches)) return false;
  return allowed.some(matches);
}

async function main() {
  const args = parseArgs();
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const registry = JSON.parse(await readFile(path.join(root, ".ai/shared/ACTIVE_TASKS.json"), "utf8"));
  const task = registry.tasks.find((item) => item.task_id === args.task);
  if (!task) throw new Error(`${args.task} is not active.`);

  execFileSync(process.execPath, ["scripts/audit-workflow.js"], { cwd: root, stdio: "pipe" });

  const head = git(root, ["rev-parse", "HEAD"]);
  const branch = git(root, ["branch", "--show-current"]);
  const changedFiles = git(root, ["diff", "--name-only", `${task.assignment_master_sha}..HEAD`]).split(/\r?\n/).filter(Boolean);
  const blockers = [];

  if (branch !== task.branch) blockers.push(`checked-out branch ${branch || "<detached>"} != assigned ${task.branch}`);
  if (task.worker_checkpoint_sha && task.worker_checkpoint_sha !== head) blockers.push(`HEAD ${head} != worker checkpoint ${task.worker_checkpoint_sha}`);
  if (!SHA.test(task.assignment_master_sha || "")) blockers.push("assignment_master_sha is invalid");
  for (const file of changedFiles) if (!pathAllowed(file, task)) blockers.push(`outside authorized write scope: ${file}`);

  const readyStatus = new Set(["MANAGER_REVIEW_READY", "AUDIT_READY", "MERGE_READY"]);
  if (!readyStatus.has(task.status)) blockers.push(`task status ${task.status} is not audit-readiness eligible`);

  const packet = {
    schema: "TCW_AUDIT_READINESS_V1",
    taskId: task.task_id,
    branch,
    head,
    assignmentMasterSha: task.assignment_master_sha,
    pr: task.pr ?? null,
    auditRequired: task.audit_required,
    changedFiles,
    blockers,
    readyForManagerFreeze: blockers.length === 0
  };
  const canonical = JSON.stringify(packet);
  packet.sha256 = crypto.createHash("sha256").update(canonical).digest("hex");

  if (args.output) await writeFile(path.resolve(root, args.output), `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  if (args.json || true) console.log(JSON.stringify(packet, null, 2));
  if (blockers.length) process.exitCode = 2;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) await main();
