import { canonicalJson, normalizeRepositoryPath, sha256 } from "./serialization.js";
import { readGovernedGitFile } from "./repository.js";

export function buildManifest(repository, paths) {
  const entries = paths.map(normalizeRepositoryPath).sort().map((path) => {
    const { bytes, git_blob_oid } = readGovernedGitFile(repository, path);
    return { path, source_commit_sha: repository.commit_sha, git_blob_oid, sha256: sha256(bytes), byte_size: bytes.length };
  });
  const manifest = { schema_version: 1, entries };
  return { manifest, canonical_manifest_sha256: sha256(canonicalJson(manifest)) };
}
