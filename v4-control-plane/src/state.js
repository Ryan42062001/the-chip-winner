import { readFileSync } from "node:fs";
import { ControlPlaneError } from "./errors.js";

const SHA = /^[0-9a-f]{40}$/;

export function parseTrackedInvariants(activeTasks) {
  const task = activeTasks.tasks?.find((candidate) => candidate.task_id === "TCW-034");
  if (!task || !SHA.test(task.worker_checkpoint_sha || "") || !SHA.test(task.audit_target_sha || "")) {
    throw new ControlPlaneError("CANONICAL_STATE_CONTRADICTION", "V3 tracked invariants are absent or malformed");
  }
  return { worker_checkpoint_sha: task.worker_checkpoint_sha, audit_target_sha: task.audit_target_sha };
}

export function observeTrackedInvariants(repository) {
  return parseTrackedInvariants(JSON.parse(readFileSync(`${repository.root}/.ai/shared/ACTIVE_TASKS.json`, "utf8")));
}

export function validateState(state, observed) {
  if (!state || state.schema_version !== 1 || state.mode !== "V3_COMPAT_SHADOW" ||
      !Number.isInteger(state.state_version) || state.state_version < 1 || !SHA.test(state.canonical_commit_sha || "") ||
      typeof state.repository !== "string" || state.repository.length === 0 || !state.canonical_manifest || !state.tracked_invariants) {
    throw new ControlPlaneError("SCHEMA_INVALID", "Proposed STATE.json is malformed");
  }
  const contradictions = [];
  if (state.repository !== observed.repository.repository) contradictions.push("repository");
  if (state.canonical_commit_sha !== observed.repository.commit_sha) contradictions.push("canonical_commit_sha");
  if (state.canonical_manifest.canonical_manifest_sha256 !== observed.canonical_manifest_sha256) contradictions.push("canonical_manifest_sha256");
  for (const key of ["worker_checkpoint_sha", "audit_target_sha"]) {
    if (state.tracked_invariants[key] !== observed.tracked_invariants[key]) contradictions.push(`tracked_invariants.${key}`);
  }
  if (contradictions.length) throw new ControlPlaneError("CANONICAL_STATE_CONTRADICTION", "Proposed V4 state contradicts observed V3 canonical state", { contradictions });
  return state;
}

export function validateBootstrapStateVersion(value) {
  if (value !== 1) throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap state_version must be exactly 1");
  return value;
}
