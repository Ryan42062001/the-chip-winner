import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { canonicalJson, sha256 } from "./serialization.js";
import { ControlPlaneError } from "./errors.js";
import { validateBootstrapStateVersion } from "./state.js";

export function createBootstrapProposal(repository, config, manifestResult, trackedInvariants) {
  const controlPlane = { ...config };
  const state = {
    schema_version: 1, repository: config.repository, mode: config.mode,
    state_version: validateBootstrapStateVersion(1), canonical_commit_sha: repository.commit_sha,
    workflow_version: "V3.2", canonical_manifest: { canonical_manifest_sha256: manifestResult.canonical_manifest_sha256 },
    tracked_invariants: trackedInvariants, last_effective_transaction_id: null,
    last_execution_receipt_sha256: null,
  };
  const proposal = { schema_version: 1, disposition: "PROPOSED_ONLY", source_commit_sha: repository.commit_sha, state_version: 1 };
  const validation = { schema_version: 1, valid: true, live_adoption: false, contradictions: [] };
  const artifacts = {
    "CONTROL_PLANE.json": controlPlane, "STATE.json": state,
    "canonical-manifest.json": manifestResult.manifest,
    "bootstrap-proposal.json": proposal, "bootstrap-validation-report.json": validation,
  };
  const hashes = Object.fromEntries(Object.entries(artifacts).map(([name, value]) => [name, sha256(canonicalJson(value))]));
  return { artifacts, hashes };
}

function assertDisposableOutput(repository, output) {
  if (!output || !isAbsolute(output)) throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap prepare requires an explicit absolute output directory");
  const target = resolve(output);
  const withinRepo = relative(repository.root, target);
  if (withinRepo === "" || (!withinRepo.startsWith("..") && !isAbsolute(withinRepo))) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap output must be outside repository state", { output: target });
  }
  return target;
}

export function writeProposal(repository, proposal, output) {
  const target = assertDisposableOutput(repository, output);
  mkdirSync(target, { recursive: true });
  for (const [name, value] of Object.entries(proposal.artifacts)) {
    const destination = resolve(target, name);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, canonicalJson(value));
  }
  return { output_directory: target, artifact_hashes: proposal.hashes };
}
