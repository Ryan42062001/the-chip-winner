import { execFileSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
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

export function normalizeGitHubRepository(remote) {
  if (typeof remote !== "string") return null;
  const value = remote.trim();
  const match = value.match(/^(?:https?:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/|git:\/\/github\.com\/)([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

export function resolveRepository(start = process.cwd()) {
  const root = realpathSync(git(start, ["rev-parse", "--show-toplevel"]));
  const commitSha = git(root, ["rev-parse", "HEAD"]);
  const branch = git(root, ["branch", "--show-current"]);
  const remote = optionalGit(root, ["config", "--get", "remote.origin.url"]);
  const repository = normalizeGitHubRepository(remote);
  if (!repository) {
    throw new ControlPlaneError("REPOSITORY_MISMATCH", "Unable to establish GitHub repository identity from origin", { remote });
  }
  return { root, commit_sha: commitSha, branch, remote, repository };
}

export function gitBlobOid(repository, path) {
  try { return git(repository.root, ["rev-parse", `HEAD:${path}`]); } catch { return null; }
}

export function readGovernedGitFile(repository, path) {
  const absolute = resolve(repository.root, path);
  const inside = relative(repository.root, absolute);
  if (inside === "" || inside.startsWith("..") || isAbsolute(inside)) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Governed canonical path escapes repository", { path });
  }

  let stat;
  try { stat = lstatSync(absolute); }
  catch { throw new ControlPlaneError("PRECONDITION_MISMATCH", "Governed canonical file is missing", { path }); }
  if (!stat.isFile() || stat.isSymbolicLink() || realpathSync(absolute) !== absolute) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Governed canonical path is not a regular repository file", { path });
  }

  const status = optionalGit(repository.root, ["status", "--porcelain=v1", "--untracked-files=all", "--", path]);
  if (status) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Governed canonical file differs from the claimed Git source", { path, status });
  }

  const gitBlobOid = optionalGit(repository.root, ["rev-parse", `${repository.commit_sha}:${path}`]);
  const index = optionalGit(repository.root, ["ls-files", "--stage", "--", path]);
  const indexMatch = index?.match(/^(100644|100755) ([0-9a-f]{40,64}) 0\t/);
  if (!gitBlobOid || !indexMatch || indexMatch[2] !== gitBlobOid) {
    throw new ControlPlaneError("PRECONDITION_MISMATCH", "Governed canonical file is not bound to the claimed Git object", { path });
  }

  let bytes;
  try { bytes = execFileSync("git", ["-C", repository.root, "cat-file", "blob", gitBlobOid], { encoding: null, stdio: ["ignore", "pipe", "pipe"] }); }
  catch { throw new ControlPlaneError("REPOSITORY_MISMATCH", "Unable to read governed Git object", { path, git_blob_oid: gitBlobOid }); }
  return { bytes, git_blob_oid: gitBlobOid };
}
