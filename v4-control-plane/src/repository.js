import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { ControlPlaneError } from "./errors.js";

function git(root, args) {
  try {
    return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    throw new ControlPlaneError("REPOSITORY_MISMATCH", "Unable to independently resolve repository state", { git_args: args, stderr: error.stderr?.toString().trim() });
  }
}

function optionalGit(root, args) {
  try { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null; }
  catch { return null; }
}

export function resolveRepository(start = process.cwd()) {
  const root = realpathSync(git(start, ["rev-parse", "--show-toplevel"]));
  const commitSha = git(root, ["rev-parse", "HEAD"]);
  const branch = git(root, ["branch", "--show-current"]);
  const remote = optionalGit(root, ["config", "--get", "remote.origin.url"]);
  return { root, commit_sha: commitSha, branch, remote };
}

export function gitBlobOid(repository, path) {
  try { return git(repository.root, ["rev-parse", `HEAD:${path}`]); } catch { return null; }
}
