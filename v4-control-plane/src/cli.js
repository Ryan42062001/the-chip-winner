import { resolveRepository } from "./repository.js";
import { loadConfig } from "./config.js";
import { buildManifest } from "./manifest.js";
import { observeTrackedInvariants } from "./state.js";
import { createBootstrapProposal, writeProposal } from "./bootstrap.js";
import { failure, success, ControlPlaneError } from "./errors.js";

function valueAfter(args, flag) { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; }

export async function runCli(args, options = {}) {
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    if (["--config", "--output"].includes(args[index])) { index += 1; continue; }
    if (!args[index].startsWith("--")) positional.push(args[index]);
  }
  const command = positional.slice(0, 2).join(" ");
  try {
    const repository = resolveRepository(options.cwd || process.cwd());
    const config = loadConfig(repository, valueAfter(args, "--config"));
    const manifest = buildManifest(repository, config.canonical_state_paths);
    const tracked = observeTrackedInvariants(repository);
    const observed = { repository, config, ...manifest, tracked_invariants: tracked };
    if (command === "status") return success("status", { repository, mode: config.mode, read_only: true });
    if (command === "inspect") return success("inspect", observed);
    if (command === "bootstrap inspect") return success("bootstrap inspect", { ...createBootstrapProposal(repository, config, manifest, tracked), read_only: true });
    if (command === "bootstrap prepare") {
      const proposal = createBootstrapProposal(repository, config, manifest, tracked);
      return success("bootstrap prepare", { ...writeProposal(repository, proposal, valueAfter(args, "--output")), proposed_only: true });
    }
    throw new ControlPlaneError("CONFIG_INVALID", "Unknown read-only command", { command });
  } catch (error) { return failure(error); }
}
