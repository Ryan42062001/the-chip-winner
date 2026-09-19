import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA_RE = /^[0-9a-f]{40}$/;
const ACCEPTED_AUDIT_VERDICTS = new Set(["PASS", "PASS WITH NON-BLOCKING FINDINGS"]);

export function parseArgs(raw = process.argv.slice(2)) {
  const out = { task: null, status: null, pr: undefined, checkpoint: undefined, blockerType: undefined, userActionRequired: undefined, nextGate: undefined, apply: false, remove: false };
  for (let i = 0; i < raw.length; i += 1) {
    const arg = raw[i];
    if (arg === "--task") out.task = raw[++i];
    else if (arg === "--status") out.status = raw[++i];
    else if (arg === "--pr") out.pr = raw[++i] === "null" ? null : Number(raw[i]);
    else if (arg === "--checkpoint") out.checkpoint = raw[++i] === "null" ? null : raw[i];
    else if (arg === "--blocker-type") out.blockerType = raw[++i];
    else if (arg === "--user-action-required") out.userActionRequired = raw[++i] === "true";
    else if (arg === "--next-gate") out.nextGate = raw[++i];
    else if (arg === "--apply") out.apply = true;
    else if (arg === "--remove") out.remove = true;
  }
  if (!out.task) throw new Error("Usage: node scripts/workflow-manager-transition.js --task TCW-### [fields] [--apply]");
  if (!out.remove && !out.status && out.pr === undefined && out.checkpoint === undefined && out.blockerType === undefined && out.userActionRequired === undefined && out.nextGate === undefined) {
    throw new Error("No transition field supplied.");
  }
  return out;
}

export function removalEligibilityErrors(task) {
  const errors = [];
  const closeout = task?.closeout_evidence;
  if (task?.status !== "VERIFYING_MASTER") errors.push("task must be at VERIFYING_MASTER before active-registry removal");
  if (!SHA_RE.test(task?.integration_sha || "")) errors.push("integration_sha must prove the integrated checkpoint");
  if (!Number.isInteger(task?.post_merge_run) || task.post_merge_run <= 0) errors.push("post_merge_run must identify successful post-merge verification");
  if (!closeout || typeof closeout !== "object" || Array.isArray(closeout)) {
    errors.push("closeout_evidence is required");
    return errors;
  }
  if (closeout.manager_verdict !== "ACCEPTED") errors.push("closeout_evidence.manager_verdict must be ACCEPTED");
  if (closeout.integration_verification !== "PASS") errors.push("closeout_evidence.integration_verification must be PASS");
  if (closeout.master_verification !== "PASS") errors.push("closeout_evidence.master_verification must be PASS");
  if (task?.audit_required) {
    if (!ACCEPTED_AUDIT_VERDICTS.has(closeout.audit_verdict)) errors.push("audit-required task needs PASS or PASS WITH NON-BLOCKING FINDINGS");
  } else if (closeout.audit_verdict !== "NOT_APPLICABLE") {
    errors.push("non-audit task must mark closeout_evidence.audit_verdict NOT_APPLICABLE");
  }
  if (task?.post_merge_canary_required) {
    if (closeout.canary_verification !== "PASS") errors.push("canary-required task needs closeout_evidence.canary_verification PASS");
  } else if (closeout.canary_verification !== "NOT_APPLICABLE") {
    errors.push("task without a canary requirement must mark closeout_evidence.canary_verification NOT_APPLICABLE");
  }
  return errors;
}

export function assertRemovalEligible(task) {
  const errors = removalEligibilityErrors(task);
  if (errors.length) throw new Error(`${task?.task_id || "Task"} is not closeout-removal eligible: ${errors.join("; ")}`);
}

function runAudit(root) {
  execFileSync(process.execPath, ["scripts/audit-workflow.js"], { cwd: root, stdio: "inherit" });
}

function defaultRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export async function executeTransition(raw = process.argv.slice(2), { root = defaultRoot(), audit = runAudit, now = () => new Date() } = {}) {
  const args = parseArgs(raw);
  const registryPath = path.join(root, ".ai/shared/ACTIVE_TASKS.json");
  const originalText = await readFile(registryPath, "utf8");
  const registry = JSON.parse(originalText);
  const index = registry.tasks.findIndex((task) => task.task_id === args.task);
  if (index < 0) throw new Error(`${args.task} is not active in ACTIVE_TASKS.json`);

  if (args.remove) {
    assertRemovalEligible(registry.tasks[index]);
    registry.tasks.splice(index, 1);
  } else {
    const task = registry.tasks[index];
    if (args.status) task.status = args.status;
    if (args.pr !== undefined) task.pr = args.pr;
    if (args.checkpoint !== undefined) task.worker_checkpoint_sha = args.checkpoint;
    if (args.blockerType !== undefined) task.blocker_type = args.blockerType;
    if (args.userActionRequired !== undefined) task.user_action_required = args.userActionRequired;
    if (args.nextGate !== undefined) task.next_gate = args.nextGate;
  }
  registry.updated_at_utc = now().toISOString();
  const candidateText = `${JSON.stringify(registry, null, 2)}\n`;

  console.log(args.apply ? "APPLY requested." : "DRY RUN — no repository file will be changed.");
  console.log(candidateText);

  if (!args.apply) return { applied: false, candidateText };

  await writeFile(registryPath, candidateText, "utf8");
  try {
    await audit(root);
  } catch (error) {
    await writeFile(registryPath, originalText, "utf8");
    console.error("Transition validation failed; ACTIVE_TASKS.json was rolled back.");
    throw error;
  }
  console.log("Transition applied and static workflow validation passed.");
  return { applied: true, candidateText };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) await executeTransition();
