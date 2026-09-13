import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function requiresProductionDeploy(paths = []) {
  const changed = paths.map((item) => String(item || "").trim()).filter(Boolean);
  return changed.some((item) => !item.startsWith(".ai/"));
}

function changedFilesFromPreviousCommit(cwd = process.cwd()) {
  try {
    return execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
      cwd,
      encoding: "utf8"
    }).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

export function classifyCurrentDeploymentScope({ eventName = process.env.GITHUB_EVENT_NAME, cwd = process.cwd() } = {}) {
  if (eventName === "workflow_dispatch") return Object.freeze({ required: true, reason: "manual-dispatch" });
  if (eventName !== "push") return Object.freeze({ required: false, reason: "non-push" });

  const changedFiles = changedFilesFromPreviousCommit(cwd);
  if (changedFiles === null) return Object.freeze({ required: true, reason: "classification-unavailable" });
  if (requiresProductionDeploy(changedFiles)) return Object.freeze({ required: true, reason: "deployable-change" });
  return Object.freeze({ required: false, reason: "control-plane-only" });
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const result = classifyCurrentDeploymentScope();
  process.stdout.write(result.required ? "true" : "false");
}
