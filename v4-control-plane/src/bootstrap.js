import { closeSync, existsSync, lstatSync, mkdirSync, openSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, parse, relative, resolve } from "node:path";
import { canonicalJson, sha256 } from "./serialization.js";
import { ControlPlaneError } from "./errors.js";
import { validateBootstrapStateVersion } from "./state.js";

export function createBootstrapProposal(repository, config, manifestResult, trackedInvariants) {
  if (!repository.repository || config.repository !== repository.repository) {
    throw new ControlPlaneError("REPOSITORY_MISMATCH", "Bootstrap repository identity contradicts observed Git custody", {
      expected: config.repository, observed: repository.repository || null,
    });
  }
  const controlPlane = { ...config };
  const state = {
    schema_version: 1, repository: repository.repository, mode: config.mode,
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

function isWithin(parent, candidate) {
  const relationship = relative(parent, candidate);
  return relationship === "" || (!relationship.startsWith("..") && !isAbsolute(relationship));
}

function assertNoFilesystemAliases(path) {
  const root = parse(path).root;
  let cursor = root;
  for (const segment of path.slice(root.length).split(/[\\/]+/).filter(Boolean)) {
    cursor = resolve(cursor, segment);
    if (!existsSync(cursor)) break;
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) {
      throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap output contains a filesystem alias", { path: cursor });
    }
  }
}

function assertDisposableOutput(repository, output) {
  if (!output || !isAbsolute(output)) throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap prepare requires an explicit absolute output directory");
  const target = resolve(output);
  const repositoryRoot = realpathSync(repository.root);
  assertNoFilesystemAliases(target);
  let ancestor = target;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const resolvedAncestor = realpathSync(ancestor);
  if (isWithin(repositoryRoot, resolvedAncestor)) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap output must be outside repository state", { output: target });
  }
  return { target, repositoryRoot };
}

export function writeProposal(repository, proposal, output) {
  const { target, repositoryRoot } = assertDisposableOutput(repository, output);
  mkdirSync(target, { recursive: true });
  assertNoFilesystemAliases(target);
  if (!lstatSync(target).isDirectory()) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap output must be an ordinary directory", { output: target });
  }
  const resolvedTarget = realpathSync(target);
  if (isWithin(repositoryRoot, resolvedTarget)) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap output resolves inside repository state", { output: resolvedTarget });
  }
  for (const name of Object.keys(proposal.artifacts)) {
    const destination = resolve(resolvedTarget, name);
    if (existsSync(destination)) {
      throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap artifact destination already exists", { destination });
    }
  }
  for (const [name, value] of Object.entries(proposal.artifacts)) {
    const destination = resolve(resolvedTarget, name);
    mkdirSync(dirname(destination), { recursive: true });
    assertNoFilesystemAliases(dirname(destination));
    if (realpathSync(dirname(destination)) !== resolvedTarget) {
      throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap artifact parent changed filesystem identity", { destination });
    }
    let descriptor;
    try {
      descriptor = openSync(destination, "wx");
      writeFileSync(descriptor, canonicalJson(value));
    } catch (error) {
      if (error instanceof ControlPlaneError) throw error;
      throw new ControlPlaneError("PRECONDITION_MISMATCH", "Bootstrap artifact could not be created exclusively", { destination });
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
    }
  }
  return { output_directory: resolvedTarget, artifact_hashes: proposal.hashes };
}
