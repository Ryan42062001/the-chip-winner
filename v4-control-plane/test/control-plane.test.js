import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { canonicalJson, normalizeRepositoryPath, sha256 } from "../src/serialization.js";
import { resolveRepository } from "../src/repository.js";
import { buildManifest } from "../src/manifest.js";
import { DEFAULT_CONFIG, validateConfig } from "../src/config.js";
import { parseTrackedInvariants, validateBootstrapStateVersion, validateState } from "../src/state.js";
import { createBootstrapProposal, writeProposal } from "../src/bootstrap.js";
import { runCli } from "../src/cli.js";

const projectRoot = resolve(import.meta.dirname, "..", "..");
const expectedWorker = "22838ac515152db32789e97850f25e1e4576cb82";
const expectedAudit = "e63b198d089a7cd8259f6a30ff77236f8d68bb28";

function git(cwd, ...args) { return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim(); }
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "tcw-v4-fixture-"));
  git(root, "init", "-q"); git(root, "config", "user.email", "fixture@example.invalid"); git(root, "config", "user.name", "Fixture");
  mkdirSync(join(root, ".ai", "shared"), { recursive: true });
  writeFileSync(join(root, ".ai", "shared", "A.md"), "alpha\n");
  writeFileSync(join(root, ".ai", "shared", "B.md"), "beta\n");
  git(root, "add", "."); git(root, "commit", "-qm", "fixture");
  return root;
}
function observed(repo, manifest, tracked = { worker_checkpoint_sha: expectedWorker, audit_target_sha: expectedAudit }) {
  return { repository: repo, canonical_manifest_sha256: manifest.canonical_manifest_sha256, tracked_invariants: tracked };
}

test("repository resolver returns exact current commit", () => assert.equal(resolveRepository(projectRoot).commit_sha, git(projectRoot, "rev-parse", "HEAD")));
test("repository resolver ignores supplied fake worker SHA", () => assert.notEqual(resolveRepository(projectRoot).commit_sha, "0".repeat(40)));
test("manifest generation is deterministic", () => { const r=resolveRepository(fixture()); assert.deepEqual(buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"]),buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"])); });
test("identical inputs keep manifest hash", () => { const r=resolveRepository(fixture()); assert.equal(buildManifest(r,[".ai/shared/A.md"]).canonical_manifest_sha256,buildManifest(r,[".ai/shared/A.md"]).canonical_manifest_sha256); });
test("manifest paths sort lexicographically", () => { const r=resolveRepository(fixture()); assert.deepEqual(buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"]).manifest.entries.map(e=>e.path),[".ai/shared/A.md",".ai/shared/B.md"]); });
test("path traversal is rejected", () => assert.throws(()=>normalizeRepositoryPath("../secret"), { code:"CONFIG_INVALID" }));
test("canonical JSON sorts keys", () => assert.equal(canonicalJson({z:1,a:{d:2,c:3}}).toString(),'{"a":{"c":3,"d":2},"z":1}'));
test("canonical JSON has no trailing newline", () => assert.equal(canonicalJson({a:1}).at(-1),125));
test("one-byte modification changes file and manifest hash", () => { const root=fixture(); const r=resolveRepository(root); const a=buildManifest(r,[".ai/shared/A.md"]); writeFileSync(join(root,".ai","shared","A.md"),"alphb\n"); const b=buildManifest(r,[".ai/shared/A.md"]); assert.notEqual(a.manifest.entries[0].sha256,b.manifest.entries[0].sha256); assert.notEqual(a.canonical_manifest_sha256,b.canonical_manifest_sha256); });
test("bootstrap state version is exactly one", () => assert.equal(validateBootstrapStateVersion(1),1));
test("agent-supplied state version is rejected", () => assert.throws(()=>validateBootstrapStateVersion(2), { code:"PRECONDITION_MISMATCH" }));
test("worker checkpoint and audit target parse independently", () => assert.deepEqual(parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}]}),{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}));
test("new worker checkpoint does not alter audit target", () => { const one=parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}]}); const two=parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:"1".repeat(40),audit_target_sha:expectedAudit}]}); assert.equal(two.audit_target_sha,one.audit_target_sha); });
test("malformed tracked invariants fail closed", () => assert.throws(()=>parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:"fake",audit_target_sha:expectedAudit}]}),{code:"CANONICAL_STATE_CONTRADICTION"}));
test("V3/V4 commit contradiction fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:"0".repeat(40),canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"CANONICAL_STATE_CONTRADICTION"}); });
test("fake worker checkpoint contradiction fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:r.commit_sha,canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:"0".repeat(40),audit_target_sha:expectedAudit}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"CANONICAL_STATE_CONTRADICTION"}); });
test("fake audit target contradiction fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:r.commit_sha,canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:expectedWorker,audit_target_sha:"0".repeat(40)}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"CANONICAL_STATE_CONTRADICTION"}); });
test("malformed state fails closed", () => assert.throws(()=>validateState({},{}),{code:"SCHEMA_INVALID"}));
test("malformed config fails closed", () => assert.throws(()=>validateConfig({schema_version:2}),{code:"CONFIG_INVALID"}));
test("manifest reorder attempts canonicalize identically", () => { const r=resolveRepository(fixture()); assert.equal(buildManifest(r,[".ai/shared/A.md",".ai/shared/B.md"]).canonical_manifest_sha256,buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"]).canonical_manifest_sha256); });
test("status is read-only", async () => { const before=git(projectRoot,"status","--porcelain=v1"); const result=await runCli(["status"],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(git(projectRoot,"status","--porcelain=v1"),before); });
test("inspect is read-only", async () => { const before=git(projectRoot,"rev-parse","HEAD"); const result=await runCli(["inspect"],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(git(projectRoot,"rev-parse","HEAD"),before); });
test("bootstrap inspect is read-only", async () => { const result=await runCli(["bootstrap","inspect"],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(result.data.read_only,true); });
test("bootstrap prepare rejects repository output", async () => { const result=await runCli(["bootstrap","prepare","--output",join(projectRoot,".ai","v4")],{cwd:projectRoot}); assert.equal(result.ok,false); assert.equal(result.error.code,"PRECONDITION_MISMATCH"); });
test("bootstrap prepare writes only proposed metadata outside repository", async () => { const out=mkdtempSync(join(tmpdir(),"tcw-v4-output-")); const result=await runCli(["bootstrap","prepare","--output",out],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(readdirSync(out).length,5); assert.equal(existsSync(join(projectRoot,".ai","v4")),false); });
test("repeated preparation is byte-identical", () => { const r=resolveRepository(fixture()); const c=validateConfig({...structuredClone(DEFAULT_CONFIG),canonical_state_paths:[".ai/shared/A.md",".ai/shared/B.md"]}); const m=buildManifest(r,c.canonical_state_paths); const p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}); const a=mkdtempSync(join(tmpdir(),"tcw-v4-a-")),b=mkdtempSync(join(tmpdir(),"tcw-v4-b-")); writeProposal(r,p,a); writeProposal(r,p,b); for(const name of Object.keys(p.artifacts)) assert.deepEqual(readFileSync(join(a,name)),readFileSync(join(b,name))); });
test("proposal hashes match exact canonical artifact bytes", () => { const r=resolveRepository(fixture()); const c=validateConfig({...structuredClone(DEFAULT_CONFIG),canonical_state_paths:[".ai/shared/A.md"]}); const m=buildManifest(r,c.canonical_state_paths); const p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}); for(const [name,value] of Object.entries(p.artifacts)) assert.equal(p.hashes[name],sha256(canonicalJson(value))); });
test("control-plane proposal separates path classes", async () => { const result=await runCli(["bootstrap","inspect"],{cwd:projectRoot}); const cp=result.data.artifacts["CONTROL_PLANE.json"]; assert.notDeepEqual(cp.allowed_mutation_paths,cp.control_plane_metadata_paths); assert.ok(cp.protected_from_automation.length); });
test("no live mutation or transaction execution command exists", async () => { const result=await runCli(["transaction","execute"],{cwd:projectRoot}); assert.equal(result.ok,false); assert.equal(result.error.code,"CONFIG_INVALID"); });
test("live canonical V3 files remain tracked and unchanged", () => assert.equal(git(projectRoot,"diff","--name-only","--",".ai/shared"),""));
test("branch ref does not move during commands", async () => { const before=git(projectRoot,"rev-parse","HEAD"); await runCli(["status"],{cwd:projectRoot}); await runCli(["inspect"],{cwd:projectRoot}); assert.equal(git(projectRoot,"rev-parse","HEAD"),before); });
