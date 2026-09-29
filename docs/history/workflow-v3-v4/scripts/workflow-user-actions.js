import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(args = process.argv.slice(2)) {
  return { json: args.includes("--json") };
}

export function selectUserActions(registry) {
  return (registry?.tasks || [])
    .filter((task) => task?.user_action_required === true)
    .map((task) => Object.freeze({
      taskId: task.task_id,
      title: task.title,
      status: task.status,
      blockerType: task.blocker_type,
      blockedOn: Object.freeze([...(task.blocked_on || [])]),
      nextGate: task.next_gate || null
    }));
}

async function main() {
  const args = parseArgs();
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const registry = JSON.parse(await readFile(path.join(root, ".ai/shared/ACTIVE_TASKS.json"), "utf8"));
  const items = selectUserActions(registry);
  if (args.json) {
    console.log(JSON.stringify({ count: items.length, items }, null, 2));
    return;
  }
  if (!items.length) {
    console.log("No user action is currently required.");
    return;
  }
  console.log("| Task | Status | Blocker | User action / next gate |");
  console.log("|---|---|---|---|");
  for (const item of items) {
    const action = item.blockedOn.length ? item.blockedOn.join("; ") : item.nextGate || "See task spec.";
    console.log(`| ${item.taskId} | ${item.status} | ${item.blockerType} | ${action.replaceAll("|", "\\|")} |`);
  }
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) await main();
