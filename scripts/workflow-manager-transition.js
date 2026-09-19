import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(raw = process.argv.slice(2)) {
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

function runAudit(root) {
  execFileSync(process.execPath, ["scripts/audit-workflow.js"], { cwd: root, stdio: "inherit" });
}

async function main() {
  const args = parseArgs();
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const registryPath = path.join(root, ".ai/shared/ACTIVE_TASKS.json");
  const originalText = await readFile(registryPath, "utf8");
  const registry = JSON.parse(originalText);
  const index = registry.tasks.findIndex((task) => task.task_id === args.task);
  if (index < 0) throw new Error(`${args.task} is not active in ACTIVE_TASKS.json`);

  if (args.remove) {
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
  registry.updated_at_utc = new Date().toISOString();
  const candidateText = `${JSON.stringify(registry, null, 2)}\n`;

  console.log(args.apply ? "APPLY requested." : "DRY RUN — no repository file will be changed.");
  console.log(candidateText);

  if (!args.apply) return;

  await writeFile(registryPath, candidateText, "utf8");
  try {
    runAudit(root);
  } catch (error) {
    await writeFile(registryPath, originalText, "utf8");
    console.error("Transition validation failed; ACTIVE_TASKS.json was rolled back.");
    throw error;
  }
  console.log("Transition applied and static workflow validation passed.");
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) await main();
