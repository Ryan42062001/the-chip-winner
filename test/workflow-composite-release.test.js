import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  SCHEMA, REPOSITORY, SOURCE_PATHS, REQUIRED_CHECK, sha256, releaseTuple, tupleDigest,
  validateLocalContract, validateLedgerTransition, validatePremergeSnapshot,
  validatePostmergeSnapshot, observeStageReadOnly, verifyPremergeReadOnly, verifyPostmergeReadOnly
} from "../scripts/workflow-composite-release.js";

const S = (letter) => letter.repeat(40), H = (letter) => letter.repeat(64);
const NOW = Date.parse("2026-09-20T12:00:00Z");
const stamp = (delta) => new Date(NOW + delta).toISOString();
const clone = (data) => structuredClone(data);
function files() {
  return SOURCE_PATHS.map((name, i) => ({
    path: name, mode: "100644", blob: S("abcd"[i])
  }));
}
function evidence(letter, pr) {
  return {
    repoId: REPOSITORY.id, repoFullName: REPOSITORY.fullName,
    commit: S(letter), tree: S("d"), blob: S("e"),
    ref: "refs/heads/manager/evidence-" + letter, path: ".ai/manager/evidence/approval.md", pr
  };
}
function fixture() {
  const sourceFiles = files();
  const a = {
    schema: SCHEMA,
    repository: clone(REPOSITORY),
    attempt: {
      id: "TCW-053-syntheticAttempt01", nonce: "syntheticNonce123456789012345678901",
      issuedAt: stamp(-600000), expiresAt: stamp(600000), state: "OWNER_APPROVED"
    },
    source: {
      repoId: REPOSITORY.id, repoFullName: REPOSITORY.fullName, taskId: "TCW-047",
      pr: 162, branch: "builder/tcw-047-automated-audit-readiness", sha: S("a"), tree: S("1"),
      historicalCreationBaseline: "7ca2953009d37a014e041cc24f4934bfe61b5cad",
      effectiveScopeBaseline: S("2"),
      packet: {
        sha256: H("a"), head: S("a"), pr: 162,
        branch: "builder/tcw-047-automated-audit-readiness", readyForManagerFreeze: true
      },
      audit: { targetSha: S("a"), verdict: "PASS", evidenceCommit: S("3") },
      files: sourceFiles
    },
    master: { sha: S("b"), tree: S("4") },
    stage: {
      repoId: REPOSITORY.id, repoFullName: REPOSITORY.fullName,
      pr: 201, branch: "refs/heads/manager/composite-test-stage", sha: S("c"), tree: S("5"),
      baseSha: S("b"), mergeMethod: "merge", parents: [S("b")],
      changedFiles: clone(sourceFiles),
      ci: {
        headSha: S("c"), context: "test", integrationId: 15368, appId: 15368,
        mode: "FULL", conclusion: "success", runId: 1201, jobId: 2301,
        checkRunId: 3401, checkSuiteId: 4501, pr: 201
      },
      preview: {
        sha: S("6"), headSha: S("c"), baseSha: S("b"),
        context: "test", integrationId: 15368, conclusion: "success", required: true
      }
    },
    ruleset: {
      id: 22309639, digest: H("b"), strictUpToDate: true, bypass: false,
      mergeMethod: "merge", requiredContext: "test", integrationId: 15368
    },
    auditor: {
      targetSha: S("c"), verdict: "PASS", actorId: 13,
      branch: "refs/heads/auditor/fresh-stage-audit",
      historicalCreationBaseline: S("b"), evidence: evidence("7", 202)
    },
    authority: {
      policy: {
        repoId: REPOSITORY.id, repoFullName: REPOSITORY.fullName,
        commit: S("8"), blob: S("9"), ownerActorId: 11,
        managerActorId: 12, auditorActorId: 13
      },
      plan: {
        actorId: 11, targetSha: S("c"), stagePr: 201,
        nonce: "syntheticNonce123456789012345678901", issuedAt: stamp(-590000),
        evidence: evidence("a", 203)
      },
      installation: {
        actorId: 11, targetSha: S("c"), stagePr: 201,
        nonce: "syntheticNonce123456789012345678901", issuedAt: stamp(-100000),
        evidence: evidence("b", 204)
      }
    },
    rollback: { available: true, operatorId: 14, planCommit: S("f") },
    ledger: {
      repoId: REPOSITORY.id, repoFullName: REPOSITORY.fullName,
      nonce: "syntheticNonce123456789012345678901",
      attemptId: "TCW-053-syntheticAttempt01", tupleDigest: "",
      protected: true, receiptCommit: S("e"), receiptBlob: S("f"),
      state: "OWNER_APPROVED", consumed: false, aborted: false, events: []
    }
  };
  a.ledger.tupleDigest = tupleDigest(a);
  a.ledger.events = [
    { state: "PREPARED", commit: S("6"), previousCommit: null, nonce: a.attempt.nonce,
      tupleDigest: a.ledger.tupleDigest },
    { state: "REVIEWED", commit: S("7"), previousCommit: S("6"), nonce: a.attempt.nonce,
      tupleDigest: a.ledger.tupleDigest },
    { state: "OWNER_APPROVED", commit: S("8"), previousCommit: S("7"),
      nonce: a.attempt.nonce, tupleDigest: a.ledger.tupleDigest }
  ];
  return a;
}
const ok = (a, now = NOW) => validateLocalContract(a, { now });
const fail = (a, pattern) => {
  const out = ok(a);
  assert.equal(out.classification, "FAIL", "fixture unexpectedly passed " + pattern);
  if (pattern) assert.match(out.blockers.join("; "), pattern);
};
test("protected attempt tuple binds original/staged blobs, exact-stage CI, approval timing and operator", () => {
  const baseline = fixture(), originalDigest = baseline.ledger.tupleDigest;
  assert.equal(originalDigest, tupleDigest(baseline));
  for (const mutate of [
    (a) => { a.source.files[0].blob = S("f"); a.stage.changedFiles[0].blob = S("f"); },
    (a) => { a.stage.ci.checkRunId = 3402; },
    (a) => { a.stage.preview.sha = S("9"); },
    (a) => { a.authority.plan.issuedAt = stamp(-580000); },
    (a) => { a.rollback.operatorId = 15; },
    (a) => { a.ruleset.id = 22309640; }
  ]) {
    const altered = clone(baseline);
    mutate(altered);
    assert.notEqual(tupleDigest(altered), originalDigest);
    fail(altered, /ledger immutable tuple binding mismatch/);
  }
});
test("local positive fixture is CONTRACT ONLY and cannot attest actual GitHub authority", () => {
  const a = fixture();
  assert.equal(REQUIRED_CHECK.integrationId, 15368);
  assert.equal(a.ledger.tupleDigest, tupleDigest(a));
  const out = ok(a);
  assert.equal(out.classification, "LOCAL_CONTRACT_PASS", out.blockers.join("; "));
  assert.equal(out.authority, "LOCAL_FIXTURE_ONLY_NOT_GITHUB_AUTHENTICATED");
  assert.equal(out.tupleSha256, a.ledger.tupleDigest);
  assert.notEqual(a.source.sha, a.stage.sha);
  assert.notEqual(a.stage.sha, a.master.sha);
});
test("foreign repository, source PR/branch/baseline, false original-helper packet and audit fail", () => {
  for (const [mutate, pattern] of [
    [(a) => { a.repository.id = 42; }, /repository/],
    [(a) => { a.source.repoId = 42; }, /source A repository/],
    [(a) => { a.source.pr = 163; }, /source A task/],
    [(a) => { a.source.branch = "auditor/fake"; }, /source A task/],
    [(a) => { a.source.historicalCreationBaseline = a.source.effectiveScopeBaseline; }, /creation/],
    [(a) => { a.source.packet.head = a.stage.sha; }, /original helper/],
    [(a) => { a.source.packet.sha256 = "bad"; }, /original helper/],
    [(a) => { a.source.audit.targetSha = a.stage.sha; }, /exact-A audit/],
    [(a) => { a.source.audit.verdict = "PASS WITH NON-BLOCKING FINDINGS"; }, /exact-A audit/]
  ]) { const a = fixture(); mutate(a); fail(a, pattern); }
});
test("four original Git path-mode-blob tuples and exact whole-stage diff fail closed", () => {
  for (const [mutate, pattern] of [
    [(a) => a.stage.changedFiles[0].blob = S("0"), /blob custody/],
    [(a) => a.stage.changedFiles[1].mode = "100755", /mode mismatch/],
    [(a) => a.stage.changedFiles.push({path:"src/unreviewed.js", mode:"100644", blob:S("a")}), /stage complete inventory/],
    [(a) => a.stage.changedFiles[1].path = a.stage.changedFiles[0].path, /duplicated or missing|extra, duplicated/],
    [(a) => a.source.files[0].blob = "not a Git blob", /immutable Git blob/],
    [(a) => a.stage.changedFiles[0].path = ".ai/shared/ACTIVE_TASKS.json", /unauthorized path/]
  ]) { const a=fixture(); mutate(a); fail(a,pattern); }
});
test("stage S/M/A confusion, extra merge parents, source baseline and method cannot pass", () => {
  for (const [mutate, pattern] of [
    [(a) => a.stage.sha = a.source.sha, /distinct immutable S/],
    [(a) => a.stage.sha = a.master.sha, /distinct immutable S/],
    [(a) => a.stage.baseSha = S("f"), /exact M base/],
    [(a) => a.stage.parents = [a.master.sha, a.source.sha], /descend directly/],
    [(a) => a.stage.mergeMethod = "squash", /merge method/],
    [(a) => a.ruleset.mergeMethod = "rebase", /ruleset/],
    [(a) => a.stage.pr = a.source.pr, /separate Manager-owned/]
  ]) { const a=fixture();mutate(a);fail(a,pattern); }
});
test("exact-S FULL required GitHub app/check-run and required preview cannot use older A/S1", () => {
  for (const [mutate, pattern] of [
    [(a) => a.stage.ci.headSha = a.source.sha, /required FULL/],
    [(a) => a.stage.ci.headSha = S("f"), /required FULL/],
    [(a) => a.stage.ci.mode = "DOCS_ONLY", /required FULL/],
    [(a) => a.stage.ci.integrationId = 7, /required FULL/],
    [(a) => a.stage.ci.appId = 7, /required FULL/],
    [(a) => a.stage.ci.context = "test-older", /required FULL/],
    [(a) => a.stage.ci.runId = null, /required FULL/],
    [(a) => a.stage.preview.sha = a.stage.sha, /synthetic merge preview/],
    [(a) => a.stage.preview.headSha = a.source.sha, /synthetic merge preview/],
    [(a) => a.stage.preview.conclusion = "pending", /synthetic merge preview/],
    [(a) => a.stage.preview.integrationId = 7, /synthetic merge preview/],
    [(a) => a.ruleset.strictUpToDate = false, /strict ruleset/],
    [(a) => a.ruleset.bypass = true, /strict ruleset/],
    [(a) => a.ruleset.digest = "bad", /strict ruleset/]
  ]) { const a=fixture(); mutate(a); fail(a, pattern); }
});
test("stale, premature, replayed, consumed or aborted nonce and immutable tuple mismatch fail", () => {
  for (const [mutate, pattern] of [
    [(a) => a.attempt.expiresAt = stamp(-1), /expired/],
    [(a) => a.attempt.issuedAt = stamp(10000), /premature|expired/],
    [(a) => a.attempt.expiresAt = stamp(3600001), /at most one hour/],
    [(a) => a.attempt.nonce = "short", /nonce/],
    [(a) => a.ledger.consumed = true, /consumed/],
    [(a) => a.ledger.aborted = true, /aborted/],
    [(a) => a.attempt.state = "ABORTED", /aborted/],
    [(a) => a.ledger.state = "RELEASED", /transition state mismatch/],
    [(a) => a.ledger.events[1].previousCommit = S("f"), /append-only event/],
    [(a) => a.ledger.events.push(clone(a.ledger.events[2])), /append-only event/],
    [(a) => a.ledger.receiptCommit = "deleted", /protected durable/],
    [(a) => a.stage.tree = S("e"), /ledger immutable tuple/],
    [(a) => a.auditor.evidence.commit = S("f"), /ledger immutable tuple/],
    [(a) => a.authority.installation.evidence.commit = S("f"), /ledger immutable tuple/]
  ]) { const a=fixture();mutate(a);fail(a,pattern); }
});
test("independent external authority, publication and rollback shape rejects forged identities", () => {
  for (const [mutate, pattern] of [
    [(a) => a.authority.policy.ownerActorId = a.authority.policy.auditorActorId, /independent owner/],
    [(a) => a.authority.installation.actorId = 100, /owner plan and installation/],
    [(a) => a.authority.installation.targetSha = a.source.sha, /bind exact S/],
    [(a) => a.authority.installation.stagePr = 999, /stage PR/],
    [(a) => a.authority.installation.evidence.commit = a.authority.plan.evidence.commit, /distinct authenticated/],
    [(a) => a.auditor.targetSha = a.source.sha, /exact-S whole-tree audit/],
    [(a) => a.auditor.evidence.ref = "refs/heads/master", /off master/],
    [(a) => a.auditor.evidence.repoId = 99, /evidence repository/],
    [(a) => a.authority.installation.issuedAt = stamp(-601000), /out of order/],
    [(a) => a.rollback.available = false, /rollback/],
    [(a) => a.rollback.operatorId = a.authority.policy.auditorActorId, /rollback/]
  ]) { const a=fixture();mutate(a);fail(a,pattern); }
});
test("ledger transitions accept local forward/abort contracts, reject replay/reorder/consumed", () => {
  const a=fixture(), old=clone(a.ledger), next=clone(old);
  next.state="RELEASED";next.consumed=true;
  next.events.push({ state:"RELEASED", commit:S("f"), previousCommit:old.events.at(-1).commit,
    nonce:old.nonce, tupleDigest:old.tupleDigest });
  next.receiptCommit = S("9");
  assert.equal(validateLedgerTransition(old,next,a).classification,"LOCAL_TRANSITION_CONTRACT_PASS");
  const replay=clone(next); replay.events.push(clone(next.events.at(-1)));
  assert.equal(validateLedgerTransition(next,replay,a).classification,"FAIL");
  const squash=clone(next);squash.events.pop();
  assert.equal(validateLedgerTransition(old,squash,a).classification,"FAIL");
  const aborted=clone(old);
  aborted.state="ABORTED";aborted.aborted=true;aborted.events.push({
    state:"ABORTED",commit:S("d"),previousCommit:old.events.at(-1).commit,
    nonce:old.nonce,tupleDigest:old.tupleDigest
  });
  assert.equal(validateLedgerTransition(old,aborted,a).classification,"LOCAL_TRANSITION_CONTRACT_PASS");
  const reused=clone(aborted);reused.state="RELEASED";reused.consumed=true;
  assert.equal(validateLedgerTransition(aborted,reused,a).classification,"FAIL");
});
function liveFixture(a) {
  const srcFiles=a.source.files.map((f)=>({filename:f.path,mode:f.mode,sha:f.blob}));
  const staged=a.stage.changedFiles.map((f)=>({filename:f.path,mode:f.mode,sha:f.blob}));
  return {
    repository: {id:REPOSITORY.id,full_name:REPOSITORY.fullName},
    masterRef:{object:{sha:a.master.sha}}, masterCommit:{sha:a.master.sha,tree:{sha:a.master.tree}},
    sourceRef:{object:{sha:a.source.sha}}, sourcePr:{
      number:a.source.pr,head:{sha:a.source.sha,ref:a.source.branch,repo:{id:REPOSITORY.id}},
      state:"open"
    },
    stageRef:{object:{sha:a.stage.sha}},stagePr:{
      number:a.stage.pr,head:{sha:a.stage.sha,ref:a.stage.branch.replace("refs/heads/",""),
        repo:{id:REPOSITORY.id}},
      base:{sha:a.master.sha,ref:"master"},state:"open"
    },
    stageCommit:{sha:a.stage.sha,tree:{sha:a.stage.tree},parents:[{sha:a.master.sha}]},
    sourceFiles:srcFiles,stageChangedFiles:staged,
    ruleset:{id:a.ruleset.id,enforcement:"active",rules:[{type:"required_status_checks",
      parameters:{strict_required_status_checks_policy:true,required_status_checks:[
        {context:"test",integration_id:15368}]}}]},rulesetDigest:a.ruleset.digest,
    ci:clone(a.stage.ci),preview:clone(a.stage.preview),
    auditEvidence:{
      commit:{sha:a.auditor.evidence.commit,tree:{sha:a.auditor.evidence.tree}},
      blob:{sha:a.auditor.evidence.blob},ref:{object:{sha:a.auditor.evidence.commit}},
      report:{targetSha:a.stage.sha,verdict:"PASS"}
    },
    planEvidence:{commit:{sha:a.authority.plan.evidence.commit},ref:{
      object:{sha:a.authority.plan.evidence.commit}}},
    installEvidence:{commit:{sha:a.authority.installation.evidence.commit},ref:{
      object:{sha:a.authority.installation.evidence.commit}}},
    ledgerReceipt:{
      commit:{sha:a.ledger.receiptCommit},blob:{sha:a.ledger.receiptBlob},protected:true,
      nonce:a.attempt.nonce,tupleDigest:tupleDigest(a),consumed:false,aborted:false
    },
    actors:{authenticated:true,permissionsVerified:true,evidencePublicationVerified:true,
      owner:{id:11},manager:{id:12},auditor:{id:13}},
    rollback:{authenticated:true,operatorId:14,availabilityVerified:true}
  };
}
test("local read-only premerge snapshot checks complete A/S/M/evidence joins, never external AUTH", () => {
  const a=fixture(), live=liveFixture(a);
  const result=validatePremergeSnapshot(a,live);
  assert.equal(result.classification,"LOCAL_SNAPSHOT_CONTRACT_PASS", result.blockers.join("; "));
  assert.equal(result.authority,"CALLER_SUPPLIED_SNAPSHOT_NOT_AUTHENTICATED");
  for (const [mutate, pattern] of [
    [(l)=>l.masterRef.object.sha=S("f"),/master M moved/],
    [(l)=>l.sourceRef.object.sha=S("f"),/source Builder/],
    [(l)=>l.stageRef.object.sha=S("f"),/staged PR/],
    [(l)=>l.stagePr.head.sha=S("f"),/staged PR/],
    [(l)=>l.stagePr.base.sha=S("f"),/staged PR/],
    [(l)=>l.stageCommit.tree.sha=S("f"),/stage S tree/],
    [(l)=>l.sourceFiles[0].sha=S("f"),/original source A blob/],
    [(l)=>l.stageChangedFiles.push({filename:"evil",mode:"100644",sha:S("f")}),/complete stage S diff/],
    [(l)=>l.rulesetDigest=H("f"),/ruleset/],
    [(l)=>l.ci.mode="DOCS_ONLY",/FULL test/],
    [(l)=>l.ci.appId=5,/FULL test/],
    [(l)=>l.preview.sha=S("f"),/synthetic merge preview/],
    [(l)=>l.auditEvidence.ref.object.sha=S("f"),/off-master audit/],
    [(l)=>l.installEvidence.ref.object.sha=S("f"),/owner approval/],
    [(l)=>l.ledgerReceipt.consumed=true,/durable nonce/],
    [(l)=>l.actors.permissionsVerified=false,/actor rights/],
    [(l)=>l.rollback.availabilityVerified=false,/rollback operator/]
  ]) {
    const changed=clone(live);mutate(changed);
    const out=validatePremergeSnapshot(a,changed);
    assert.equal(out.classification,"FAIL");
    assert.match(out.blockers.join("; "),pattern);
  }
});
function mergeFixture(a) {
  return {
    observedMergeMethod:"merge",masterRef:{object:{sha:S("d")}},
    mergeCommit:{sha:S("d"),parents:[{sha:a.master.sha},{sha:a.stage.sha}],
      tree:{sha:a.stage.tree}},
    mergedChangedFiles:a.stage.changedFiles.map((x)=>({
      filename:x.path,mode:x.mode,sha:x.blob
    })),
    masterCi:{sha:S("d"),mode:"FULL",conclusion:"success"},
    deployment:{sha:S("d"),productionVerified:true},
    ledgerReceipt:{state:"RELEASED",consumed:true,nonce:a.attempt.nonce}
  };
}
test("two-parent ordered actual protected G/tree/master and full changed path invariants", () => {
  const a=fixture(), good=mergeFixture(a);
  const pass=validatePostmergeSnapshot(a,good);
  assert.equal(pass.classification,"LOCAL_POSTMERGE_CONTRACT_PASS",pass.blockers.join("; "));
  assert.match(pass.authority,/NOT_AUTHENTICATED/);
  for (const [mutate,pattern] of [
    [(g)=>g.observedMergeMethod="squash",/squash, rebase/],
    [(g)=>g.observedMergeMethod="rebase",/squash, rebase/],
    [(g)=>g.mergeCommit.parents.reverse(),/two ordered parents/],
    [(g)=>g.mergeCommit.parents.pop(),/two ordered parents/],
    [(g)=>g.mergeCommit.parents.push({sha:S("f")}),/two ordered parents/],
    [(g)=>g.mergeCommit.tree.sha=S("f"),/audited S/],
    [(g)=>g.masterRef.object.sha=a.master.sha,/protected master/],
    [(g)=>g.mergedChangedFiles[0].sha=S("f"),/merged path/],
    [(g)=>g.masterCi.mode="DOCS_ONLY",/FULL master CI/],
    [(g)=>g.deployment.productionVerified=false,/deployed production/],
    [(g)=>g.ledgerReceipt.consumed=false,/consumed-once ledger/]
  ]) {
    const changed=clone(good);mutate(changed);
    const out=validatePostmergeSnapshot(a,changed);
    assert.equal(out.classification,"FAIL");
    assert.match(out.blockers.join("; "),pattern);
  }
});
test("read-only GitHub stage observation validates original/stage blobs, FULL check and synthetic preview provenance", async () => {
  const a=fixture(), live=liveFixture(a);
  const sourceTree={truncated:false,tree:a.source.files.map((f)=>({
    path:f.path,type:"blob",mode:f.mode,sha:f.blob
  }))};
  const stageTree={truncated:false,tree:a.stage.changedFiles.map((f)=>({
    path:f.path,type:"blob",mode:f.mode,sha:f.blob
  }))};
  const actionRun={id:a.stage.ci.runId,head_sha:a.stage.sha,event:"pull_request",
    conclusion:"success"};
  const requiredStages=[
    "Workflow V3.2 state audit","Dependency audit","Full unit and contract tests",
    "Model evaluation","Static smoke","Browser smoke","Accessibility audit",
    "Readiness audit","Mobile audit","Extension audit","Performance audit","Security scan"
  ];
  const job={id:a.stage.ci.jobId,run_id:a.stage.ci.runId,name:"test",
    conclusion:"success",steps:requiredStages.map((name)=>({name,conclusion:"success"}))};
  const check={id:a.stage.ci.checkRunId,head_sha:a.stage.sha,name:"test",
    conclusion:"success",app:{id:15368},check_suite:{id:a.stage.ci.checkSuiteId}};
  const previewCheck={head_sha:a.stage.preview.sha,name:"test",conclusion:"success",
    app:{id:15368}};
  const previewCommit={sha:a.stage.preview.sha,tree:{sha:a.stage.tree},
    parents:[{sha:a.master.sha},{sha:a.stage.sha}]};
  const responses={
    "":live.repository,
    "/git/ref/heads/master":live.masterRef,
    ["/git/ref/heads/"+a.source.branch]:live.sourceRef,
    ["/git/ref/heads/"+a.stage.branch.replace("refs/heads/","")]:live.stageRef,
    ["/pulls/"+a.stage.pr]:{...live.stagePr,changed_files:4,
      merge_commit_sha:a.stage.preview.sha},
    ["/pulls/"+a.source.pr]:live.sourcePr,
    ["/git/commits/"+a.stage.sha]:live.stageCommit,
    ["/git/commits/"+a.master.sha]:live.masterCommit,
    ["/git/commits/"+a.source.sha]:{sha:a.source.sha,tree:{sha:a.source.tree}},
    ["/rulesets/"+a.ruleset.id]:live.ruleset,
    ["/git/trees/"+a.source.tree+"?recursive=1"]:sourceTree,
    ["/git/trees/"+a.stage.tree+"?recursive=1"]:stageTree,
    ["/pulls/"+a.stage.pr+"/files?per_page=100"]:
      a.stage.changedFiles.map((f)=>({filename:f.path,sha:f.blob,status:"modified"})),
    ["/actions/runs/"+a.stage.ci.runId]:actionRun,
    ["/actions/jobs/"+a.stage.ci.jobId]:job,
    ["/commits/"+a.stage.sha+"/check-runs?check_name=test&per_page=100"]:
      {check_runs:[check]},
    ["/commits/"+a.stage.preview.sha+"/check-runs?check_name=test&per_page=100"]:
      {check_runs:[previewCheck]},
    ["/git/commits/"+a.stage.preview.sha]:previewCommit
  };
  a.ruleset.digest=sha256(JSON.stringify(live.ruleset, Object.keys(live.ruleset).sort()));
  // Attestation ruleset digest must be the actual stable GitHub ruleset JSON.
  a.ruleset.digest=sha256((()=>{const stable=(x)=>Array.isArray(x)?"["+x.map(stable).join(",")+"]":
    x&&typeof x==="object"?"{"+Object.keys(x).sort().map(k=>JSON.stringify(k)+":"+stable(x[k])).join(",")+"}":
    JSON.stringify(x);return stable(live.ruleset);})());
  a.ledger.tupleDigest=tupleDigest(a);
  for(const event of a.ledger.events)event.tupleDigest=a.ledger.tupleDigest;
  live.ledgerReceipt.tupleDigest=a.ledger.tupleDigest;
  const read=async(endpoint)=>{
    assert.ok(Object.hasOwn(responses,endpoint),"unexpected read "+endpoint);
    return clone(responses[endpoint]);
  };
  const observed=await observeStageReadOnly(a,read);
  assert.equal(observed.ci.mode,"FULL");
  assert.equal(observed.ci.appId,15368);
  assert.equal(observed.preview.conclusion,"success");
  assert.equal(observed.rulesetDigest,a.ruleset.digest);
  const local=validatePremergeSnapshot(a,{...observed,
    auditEvidence:live.auditEvidence,planEvidence:live.planEvidence,
    installEvidence:live.installEvidence,ledgerReceipt:live.ledgerReceipt,
    actors:live.actors,rollback:live.rollback});
  assert.equal(local.classification,"LOCAL_SNAPSHOT_CONTRACT_PASS",
    local.blockers.join("; "));
  // Real CLI never accepts this mocked snapshot as a rights/ledger proof.
  const real=await verifyPremergeReadOnly(a,{now:NOW,token:"synthetic-read-only",githubGet:read});
  assert.equal(real.classification,"RELEASE_HOLD");
  assert.match(real.blockers.join(" "),/rights NOT VERIFIED/);
  for(const [mutate,pattern] of [
    [(v)=>v["/actions/jobs/"+a.stage.ci.jobId].steps.find(s=>
      s.name==="Full unit and contract tests").conclusion="skipped",/FULL test/],
    [(v)=>v["/commits/"+a.stage.sha+"/check-runs?check_name=test&per_page=100"]
      .check_runs[0].app.id=999,/FULL test/],
    [(v)=>v["/git/commits/"+a.stage.preview.sha].parents.reverse(),/synthetic merge preview/],
    [(v)=>v["/pulls/"+a.stage.pr+"/files?per_page=100"].push({
      filename:"src/unaudited.js",sha:S("f"),status:"added"}),/inventory/],
    [(v)=>v["/git/trees/"+a.source.tree+"?recursive=1"].truncated=true,/truncated/]
  ]) {
    const changed=clone(responses);mutate(changed);
    const badRead=async(key)=>changed[key];
    const held=await verifyPremergeReadOnly(a,{now:NOW,token:"synthetic-read-only",
      githubGet:badRead});
    assert.equal(held.classification,"RELEASE_HOLD");
    assert.match(held.blockers.join(" "),pattern);
  }
});
test("real premerge and postmerge entrypoints cannot be made ready by caller-provided PASS flags",async()=>{
  const a=fixture(), injected={
    ...a, verified:true, authenticated:true, liveVerified:true, ownerApproved:true,
    ledgerVerified:true, releaseReady:true
  };
  const pre=await verifyPremergeReadOnly(injected,{now:NOW,token:null});
  const post=await verifyPostmergeReadOnly(injected,{token:null});
  assert.equal(pre.classification,"RELEASE_HOLD");
  assert.equal(post.classification,"RELEASE_HOLD");
  assert.match(pre.blockers.join(" "),/authenticated read-only GitHub/);
  const read=await verifyPremergeReadOnly(a,{now:NOW,token:"synthetic-token",
    githubGet:async(resource)=>{
      if(resource==="/rulesets/22309639") throw new Error("GitHub 403 insufficient rights");
      return {};
    }});
  assert.equal(read.classification,"RELEASE_HOLD");
  assert.match(read.blockers.join(" "),/GitHub 403/);
  const forged=await verifyPremergeReadOnly(a,{now:NOW,token:"synthetic-token",
    githubGet:async()=>({})});
  assert.equal(forged.classification,"RELEASE_HOLD");
  assert.ok(forged.blockers.some(x=>/GitHub observation unavailable|truncated/.test(x)));
  assert.equal(forged.liveReadOnly,true);
});
test("CLI local PASS stays explicitly local; premerge without trusted token returns HOLD; no writes",()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),"tcw-053-fixture-"));
  const filepath=path.join(dir,"fixture.json");
  const a=fixture();
  // CLI clock uses actual time, so fix the attempt relative to runtime for CLI assertions.
  const now=Date.now();
  a.attempt.issuedAt=new Date(now-60000).toISOString();
  a.attempt.expiresAt=new Date(now+60000).toISOString();
  a.authority.plan.issuedAt=new Date(now-55000).toISOString();
  a.authority.installation.issuedAt=new Date(now-30000).toISOString();
  a.ledger.tupleDigest=tupleDigest(a);
  a.ledger.events.forEach((e)=>{e.tupleDigest=a.ledger.tupleDigest;});
  writeFileSync(filepath,JSON.stringify(a));
  const script=path.resolve("scripts/workflow-composite-release.js");
  const env={...process.env};
  delete env.GITHUB_TOKEN;
  const validate=spawnSync(process.execPath,[script,"validate","--input",filepath],
    {encoding:"utf8",env});
  assert.equal(validate.status,0,validate.stderr+validate.stdout);
  assert.equal(JSON.parse(validate.stdout).classification,"LOCAL_CONTRACT_PASS");
  const pre=spawnSync(process.execPath,[script,"premerge","--input",filepath],
    {encoding:"utf8",env});
  assert.equal(pre.status,3);
  assert.equal(JSON.parse(pre.stdout).classification,"RELEASE_HOLD");
  const post=spawnSync(process.execPath,[script,"postmerge","--input",filepath],
    {encoding:"utf8",env});
  assert.equal(post.status,3);
  assert.equal(JSON.parse(post.stdout).classification,"RELEASE_HOLD");
  assert.equal(readFileSync(filepath,"utf8"),JSON.stringify(a));
  const corrupt=spawnSync(process.execPath,[script,"validate","--input",filepath+"-missing"],
    {encoding:"utf8",env});
  assert.equal(corrupt.status,2);
  assert.equal(JSON.parse(corrupt.stdout).classification,"FAIL");
});
