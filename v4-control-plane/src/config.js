import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ControlPlaneError } from "./errors.js";
import { normalizeRepositoryPath } from "./serialization.js";

export const DEFAULT_CONFIG = Object.freeze({
  schema_version: 1,
  repository: "Ryan42062001/the-chip-winner",
  mode: "V3_COMPAT_SHADOW",
  canonical_state_paths: [
    ".ai/shared/ACTIVE_TASKS.json", ".ai/shared/DECISIONS.md",
    ".ai/shared/PROJECT_STATE.md", ".ai/shared/ROADMAP.md",
    ".ai/shared/WORKFLOW.md", ".ai/shared/WORKFLOW_V3_1.md",
    ".ai/shared/WORKFLOW_V3_2.md",
  ],
  manager_spec_roots: [".ai/manager/tasks", ".ai/manager/evidence"],
  allowed_mutation_paths: [".ai/shared"],
  control_plane_metadata_paths: [".ai/v4"],
  protected_from_automation: [".github", "config/field-validation.json"],
  requirements: {
    state_version: true, hash_precondition: true, manager_authority: true,
    human_merge: true, workers_report_only: true, control_plane_mutates: true,
    local_high_governance_prohibited: true,
  },
});

export function validateConfig(input) {
  if (!input || input.schema_version !== 1 || input.mode !== "V3_COMPAT_SHADOW" ||
      typeof input.repository !== "string" || !Array.isArray(input.canonical_state_paths) || input.canonical_state_paths.length === 0) {
    throw new ControlPlaneError("CONFIG_INVALID", "Configuration does not satisfy the V4 compatibility schema");
  }
  const canonical = [...new Set(input.canonical_state_paths.map(normalizeRepositoryPath))].sort();
  return { ...input, canonical_state_paths: canonical };
}

export function loadConfig(repository, configPath) {
  if (!configPath) return validateConfig(structuredClone(DEFAULT_CONFIG));
  try { return validateConfig(JSON.parse(readFileSync(resolve(repository.root, configPath), "utf8"))); }
  catch (error) {
    if (error instanceof ControlPlaneError) throw error;
    throw new ControlPlaneError("CONFIG_INVALID", "Configuration could not be loaded", { cause: error.message });
  }
}
