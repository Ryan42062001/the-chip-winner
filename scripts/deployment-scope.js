import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function requiresProductionDeploy(paths = []) {
  const changed = paths.map((item) => String(item || "").trim()).filter(Boolean);
  return changed.some((item) => !item.startsWith(".ai/"));
}

export function classifyDeploymentScope({ eventName, changedFiles }) {
  if (eventName === "workflow_dispatch") return Object.freeze({ required: true, reason: "manual-dispatch" });
  if (eventName !== "push") return Object.freeze({ required: false, reason: "non-push" });
  if (!Array.isArray(changedFiles)) return Object.freeze({ required: true, reason: "classification-unavailable" });
  if (requiresProductionDeploy(changedFiles)) return Object.freeze({ required: true, reason: "deployable-change" });
  return Object.freeze({ required: false, reason: "control-plane-only" });
}

function changedFilesForPushRange({ baseSha = process.env.DEPLOY_BASE_SHA, cwd = process.cwd() } = {}) {
  if (!baseSha || /^0+$/.test(baseSha)) return null;
  try {
    return execFileSync("git", ["diff", "--name-only", baseSha, "HEAD"], {
      cwd,
      encoding: "utf8"
    }).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

export function classifyCurrentDeploymentScope({
  eventName = process.env.GITHUB_EVENT_NAME,
  baseSha = process.env.DEPLOY_BASE_SHA,
  cwd = process.cwd()
} = {}) {
  if (eventName !== "push") return classifyDeploymentScope({ eventName, changedFiles: [] });
  return classifyDeploymentScope({ eventName, changedFiles: changedFilesForPushRange({ baseSha, cwd }) });
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const result = classifyCurrentDeploymentScope();
  if (process.argv.includes("--github-output")) {
    process.stdout.write(`required=${result.required}\nreason=${result.reason}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }
}
