import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalJson, normalizeRepositoryPath, sha256 } from "./serialization.js";
import { gitBlobOid } from "./repository.js";
import { ControlPlaneError } from "./errors.js";

export function buildManifest(repository, paths) {
  const entries = paths.map(normalizeRepositoryPath).sort().map((path) => {
    let bytes;
    try { bytes = readFileSync(resolve(repository.root, path)); }
    catch { throw new ControlPlaneError("PRECONDITION_MISMATCH", "Governed canonical file is missing", { path }); }
    return { path, source_commit_sha: repository.commit_sha, git_blob_oid: gitBlobOid(repository, path), sha256: sha256(bytes), byte_size: bytes.length };
  });
  const manifest = { schema_version: 1, entries };
  return { manifest, canonical_manifest_sha256: sha256(canonicalJson(manifest)) };
}
