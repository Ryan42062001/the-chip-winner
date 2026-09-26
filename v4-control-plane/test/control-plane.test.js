import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { canonicalJson, normalizeRepositoryPath, sha256 } from "../src/serialization.js";
import { normalizeGitHubRepository, resolveRepository } from "../src/repository.js";
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
  git(root, "remote", "add", "origin", "git@github.com:Ryan42062001/the-chip-winner.git");
  return root;
}
function config(repository, overrides = {}) {
  return validateConfig({ ...structuredClone(DEFAULT_CONFIG), canonical_state_paths: [".ai/shared/A.md", ".ai/shared/B.md"], ...overrides }, repository);
}
function observed(repo, manifest, tracked = { worker_checkpoint_sha: expectedWorker, audit_target_sha: expectedAudit }) {
  return { repository: repo, canonical_manifest_sha256: manifest.canonical_manifest_sha256, tracked_invariants: tracked };
}

test("repository resolver returns exact current commit", () => assert.equal(resolveRepository(projectRoot).commit_sha, git(projectRoot, "rev-parse", "HEAD")));
test("repository resolver ignores supplied fake worker SHA", () => assert.notEqual(resolveRepository(projectRoot).commit_sha, "0".repeat(40)));
test("repository resolver observes GitHub identity", () => assert.equal(resolveRepository(fixture()).repository, "Ryan42062001/the-chip-winner"));
test("common GitHub origin forms normalize identically", () => {
  for (const remote of ["https://github.com/Ryan42062001/the-chip-winner.git", "git@github.com:Ryan42062001/the-chip-winner.git", "ssh://git@github.com/Ryan42062001/the-chip-winner.git", "git://github.com/Ryan42062001/the-chip-winner.git"])
    assert.equal(normalizeGitHubRepository(remote), "Ryan42062001/the-chip-winner");
});
test("unresolvable observed repository identity is rejected", () => { const root=fixture(); git(root,"remote","set-url","origin","https://example.invalid/repo.git"); assert.throws(()=>resolveRepository(root),{code:"REPOSITORY_MISMATCH"}); });
test("manifest generation is deterministic", () => { const r=resolveRepository(fixture()); assert.deepEqual(buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"]),buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"])); });
test("identical inputs keep manifest hash", () => { const r=resolveRepository(fixture()); assert.equal(buildManifest(r,[".ai/shared/A.md"]).canonical_manifest_sha256,buildManifest(r,[".ai/shared/A.md"]).canonical_manifest_sha256); });
test("manifest paths sort lexicographically", () => { const r=resolveRepository(fixture()); assert.deepEqual(buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"]).manifest.entries.map(e=>e.path),[".ai/shared/A.md",".ai/shared/B.md"]); });
test("path traversal is rejected", () => assert.throws(()=>normalizeRepositoryPath("../secret"), { code:"CONFIG_INVALID" }));
test("canonical JSON sorts keys", () => assert.equal(canonicalJson({z:1,a:{d:2,c:3}}).toString(),'{"a":{"c":3,"d":2},"z":1}'));
test("canonical JSON has no trailing newline", () => assert.equal(canonicalJson({a:1}).at(-1),125));
test("clean governed file binds bytes to HEAD blob", () => { const r=resolveRepository(fixture()); const e=buildManifest(r,[".ai/shared/A.md"]).manifest.entries[0]; assert.equal(e.git_blob_oid,git(r.root,"rev-parse","HEAD:.ai/shared/A.md")); assert.equal(e.source_commit_sha,r.commit_sha); });
test("unstaged governed-file modification fails closed", () => { const root=fixture(),r=resolveRepository(root); writeFileSync(join(root,".ai","shared","A.md"),"changed\n"); assert.throws(()=>buildManifest(r,[".ai/shared/A.md"]),{code:"PRECONDITION_MISMATCH"}); });
test("staged governed-file modification fails closed", () => { const root=fixture(),r=resolveRepository(root); writeFileSync(join(root,".ai","shared","A.md"),"changed\n"); git(root,"add",".ai/shared/A.md"); assert.throws(()=>buildManifest(r,[".ai/shared/A.md"]),{code:"PRECONDITION_MISMATCH"}); });
test("staged replacement differing from HEAD fails closed", () => { const root=fixture(),r=resolveRepository(root); rmSync(join(root,".ai","shared","A.md")); writeFileSync(join(root,".ai","shared","A.md"),"replacement\n"); git(root,"add",".ai/shared/A.md"); assert.throws(()=>buildManifest(r,[".ai/shared/A.md"]),{code:"PRECONDITION_MISMATCH"}); });
test("deleted governed file fails closed", () => { const root=fixture(),r=resolveRepository(root); rmSync(join(root,".ai","shared","A.md")); assert.throws(()=>buildManifest(r,[".ai/shared/A.md"]),{code:"PRECONDITION_MISMATCH"}); });
test("untracked replacement of governed path fails closed", () => { const root=fixture(),r=resolveRepository(root); git(root,"rm","--cached","-q",".ai/shared/A.md"); assert.throws(()=>buildManifest(r,[".ai/shared/A.md"]),{code:"PRECONDITION_MISMATCH"}); });
test("symlinked governed path fails closed", (t) => { const root=fixture(),r=resolveRepository(root),path=join(root,".ai","shared","A.md"); rmSync(path); try { symlinkSync(join(root,".ai","shared","B.md"),path,"file"); } catch(error) { if(error.code==="EPERM") return t.skip("file symlinks unavailable on this platform"); throw error; } assert.throws(()=>buildManifest(r,[".ai/shared/A.md"]),{code:"PRECONDITION_MISMATCH"}); });
test("bootstrap state version is exactly one", () => assert.equal(validateBootstrapStateVersion(1),1));
test("agent-supplied state version is rejected", () => assert.throws(()=>validateBootstrapStateVersion(2), { code:"PRECONDITION_MISMATCH" }));
test("worker checkpoint and audit target parse independently", () => assert.deepEqual(parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}]}),{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}));
test("new worker checkpoint does not alter audit target", () => { const one=parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}]}); const two=parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:"1".repeat(40),audit_target_sha:expectedAudit}]}); assert.equal(two.audit_target_sha,one.audit_target_sha); });
test("malformed tracked invariants fail closed", () => assert.throws(()=>parseTrackedInvariants({tasks:[{task_id:"TCW-034",worker_checkpoint_sha:"fake",audit_target_sha:expectedAudit}]}),{code:"CANONICAL_STATE_CONTRADICTION"}));
test("V3/V4 commit contradiction fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,repository:r.repository,mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:"0".repeat(40),canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"CANONICAL_STATE_CONTRADICTION"}); });
test("fake worker checkpoint contradiction fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,repository:r.repository,mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:r.commit_sha,canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:"0".repeat(40),audit_target_sha:expectedAudit}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"CANONICAL_STATE_CONTRADICTION"}); });
test("fake audit target contradiction fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,repository:r.repository,mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:r.commit_sha,canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:expectedWorker,audit_target_sha:"0".repeat(40)}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"CANONICAL_STATE_CONTRADICTION"}); });
test("missing state repository fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:r.commit_sha,canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"SCHEMA_INVALID"}); });
test("contradictory state repository fails closed", () => { const r=resolveRepository(fixture()),m=buildManifest(r,[".ai/shared/A.md"]); const s={schema_version:1,repository:"Other/repo",mode:"V3_COMPAT_SHADOW",state_version:1,canonical_commit_sha:r.commit_sha,canonical_manifest:{canonical_manifest_sha256:m.canonical_manifest_sha256},tracked_invariants:{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}}; assert.throws(()=>validateState(s,observed(r,m)),{code:"CANONICAL_STATE_CONTRADICTION"}); });
test("malformed state fails closed", () => assert.throws(()=>validateState({},{}),{code:"SCHEMA_INVALID"}));
test("malformed config fails closed", () => assert.throws(()=>validateConfig({schema_version:2}),{code:"CONFIG_INVALID"}));
test("expected repository identity is accepted", () => { const r=resolveRepository(fixture()); assert.equal(config(r).repository,r.repository); });
test("caller-supplied repository mismatch is rejected", () => { const r=resolveRepository(fixture()); assert.throws(()=>config(r,{repository:"Other/repo"}),{code:"REPOSITORY_MISMATCH"}); });
test("manifest reorder attempts canonicalize identically", () => { const r=resolveRepository(fixture()); assert.equal(buildManifest(r,[".ai/shared/A.md",".ai/shared/B.md"]).canonical_manifest_sha256,buildManifest(r,[".ai/shared/B.md",".ai/shared/A.md"]).canonical_manifest_sha256); });
test("status is read-only", async () => { const before=git(projectRoot,"status","--porcelain=v1"); const result=await runCli(["status"],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(git(projectRoot,"status","--porcelain=v1"),before); });
test("inspect is read-only", async () => { const before=git(projectRoot,"rev-parse","HEAD"); const result=await runCli(["inspect"],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(git(projectRoot,"rev-parse","HEAD"),before); });
test("bootstrap inspect is read-only", async () => { const result=await runCli(["bootstrap","inspect"],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(result.data.read_only,true); });
test("bootstrap prepare rejects repository output", async () => { const result=await runCli(["bootstrap","prepare","--output",join(projectRoot,".ai","v4")],{cwd:projectRoot}); assert.equal(result.ok,false); assert.equal(result.error.code,"PRECONDITION_MISMATCH"); });
test("bootstrap prepare rejects relative output", async () => { const result=await runCli(["bootstrap","prepare","--output","relative-output"],{cwd:projectRoot}); assert.equal(result.ok,false); assert.equal(result.error.code,"PRECONDITION_MISMATCH"); });
test("bootstrap prepare writes only proposed metadata outside repository", async () => { const out=mkdtempSync(join(tmpdir(),"tcw-v4-output-")); const result=await runCli(["bootstrap","prepare","--output",out],{cwd:projectRoot}); assert.equal(result.ok,true); assert.equal(readdirSync(out).length,5); assert.equal(existsSync(join(projectRoot,".ai","v4")),false); });
test("external alias into repository is rejected without repository changes", () => { const root=fixture(),r=resolveRepository(root),alias=join(mkdtempSync(join(tmpdir(),"tcw-v4-alias-")),"repo-link"),before=git(root,"status","--porcelain=v1"); symlinkSync(root,alias,"junction"); const c=config(r),m=buildManifest(r,c.canonical_state_paths),p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}); assert.throws(()=>writeProposal(r,p,join(alias,"proposal")),{code:"PRECONDITION_MISMATCH"}); assert.equal(git(root,"status","--porcelain=v1"),before); });
test("pre-existing artifact destination is rejected without overwrite", () => { const r=resolveRepository(fixture()),c=config(r),m=buildManifest(r,c.canonical_state_paths),p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}),out=mkdtempSync(join(tmpdir(),"tcw-v4-existing-")),destination=join(out,"CONTROL_PLANE.json"); writeFileSync(destination,"sentinel"); assert.throws(()=>writeProposal(r,p,out),{code:"PRECONDITION_MISMATCH"}); assert.equal(readFileSync(destination,"utf8"),"sentinel"); });
test("pre-existing artifact redirection is rejected", (t) => { const r=resolveRepository(fixture()),c=config(r),m=buildManifest(r,c.canonical_state_paths),p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}),out=mkdtempSync(join(tmpdir(),"tcw-v4-redirect-")),sink=join(out,"sink.json"); writeFileSync(sink,"sentinel"); try { symlinkSync(sink,join(out,"CONTROL_PLANE.json"),"file"); } catch(error) { if(error.code==="EPERM") return t.skip("file symlinks unavailable on this platform"); throw error; } assert.throws(()=>writeProposal(r,p,out),{code:"PRECONDITION_MISMATCH"}); assert.equal(readFileSync(sink,"utf8"),"sentinel"); });
test("repeated preparation is byte-identical", () => { const r=resolveRepository(fixture()); const c=config(r); const m=buildManifest(r,c.canonical_state_paths); const p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}); const a=mkdtempSync(join(tmpdir(),"tcw-v4-a-")),b=mkdtempSync(join(tmpdir(),"tcw-v4-b-")); writeProposal(r,p,a); writeProposal(r,p,b); for(const name of Object.keys(p.artifacts)) assert.deepEqual(readFileSync(join(a,name)),readFileSync(join(b,name))); });
test("proposal state uses observed repository identity", () => { const r=resolveRepository(fixture()),c=config(r),m=buildManifest(r,c.canonical_state_paths),p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}); assert.equal(p.artifacts["STATE.json"].repository,r.repository); });
test("proposal hashes match exact canonical artifact bytes", () => { const r=resolveRepository(fixture()); const c=config(r,{canonical_state_paths:[".ai/shared/A.md"]}); const m=buildManifest(r,c.canonical_state_paths); const p=createBootstrapProposal(r,c,m,{worker_checkpoint_sha:expectedWorker,audit_target_sha:expectedAudit}); for(const [name,value] of Object.entries(p.artifacts)) assert.equal(p.hashes[name],sha256(canonicalJson(value))); });
test("control-plane proposal separates path classes", async () => { const result=await runCli(["bootstrap","inspect"],{cwd:projectRoot}); const cp=result.data.artifacts["CONTROL_PLANE.json"]; assert.notDeepEqual(cp.allowed_mutation_paths,cp.control_plane_metadata_paths); assert.ok(cp.protected_from_automation.length); });
test("no live mutation or transaction execution command exists", async () => { const result=await runCli(["transaction","execute"],{cwd:projectRoot}); assert.equal(result.ok,false); assert.equal(result.error.code,"CONFIG_INVALID"); });
test("live canonical V3 files remain tracked and unchanged", () => assert.equal(git(projectRoot,"diff","--name-only","--",".ai/shared"),""));
test("branch ref does not move during commands", async () => { const before=git(projectRoot,"rev-parse","HEAD"); await runCli(["status"],{cwd:projectRoot}); await runCli(["inspect"],{cwd:projectRoot}); assert.equal(git(projectRoot,"rev-parse","HEAD"),before); });
