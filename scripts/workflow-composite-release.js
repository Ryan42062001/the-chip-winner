/**
 * TCW-053 — Dormant composite protected-release contract (Workflow V3.2).
 * No write API. Local fixtures test predicates, NEVER authenticate a release.
 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const SCHEMA = "TCW_COMPOSITE_RELEASE_ATTESTATION_V1";
export const REPOSITORY = Object.freeze({ id: 1347827094, fullName: "Ryan42062001/the-chip-winner" });
export const SOURCE_PATHS = Object.freeze([
  ".ai/builder/TCW-047_HANDOFF.md",
  ".github/workflows/task-audit-readiness.yml",
  "scripts/workflow-audit-readiness-automation.js",
  "test/workflow-audit-readiness-automation.test.js"
]);
export const REQUIRED_CHECK = Object.freeze({ context: "test", integrationId: 15368 });
export const STATES = Object.freeze(["PREPARED", "REVIEWED", "OWNER_APPROVED", "RELEASED", "ABORTED"]);
const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const NONCE = /^[A-Za-z0-9_-]{24,128}$/;
const REF = /^refs\/heads\/[a-z0-9][a-z0-9/_-]*$/;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const TIME_WINDOW_MS = 60 * 60 * 1000;
const forbiddenKeys = new Set(["__proto__", "constructor", "prototype"]);
const exact = (value) => typeof value === "string" && SHA.test(value);
const goodId = (value) => Number.isSafeInteger(value) && value > 0;
const unique = (items) => new Set(items).size === items.length;
const stable = (obj) => {
  if (Array.isArray(obj)) return "[" + obj.map(stable).join(",") + "]";
  if (obj && typeof obj === "object") return "{" +
    Object.keys(obj).sort().map((key) => {
      if (forbiddenKeys.has(key)) throw new Error("unsafe object key");
      return JSON.stringify(key) + ":" + stable(obj[key]);
    }).join(",") + "}";
  return JSON.stringify(obj);
};
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const eq = (left, right) => stable(left) === stable(right);
const fail = (issues, message) => { issues.push(message); return false; };
const check = (issues, predicate, message) => predicate || fail(issues, message);
const required = (record, property) => record && Object.hasOwn(record, property);
const record = (value) => value && typeof value === "object" && !Array.isArray(value);
const sameRepo = (ref) => ref?.repoId === REPOSITORY.id && ref?.repoFullName === REPOSITORY.fullName;
function validTime(value) { return typeof value === "string" && ISO.test(value) && Number.isFinite(Date.parse(value)); }
const historicalBaseline = "7ca2953009d37a014e041cc24f4934bfe61b5cad";
// Immutable accepted TCW-047/TCW-050 custody anchors, independent of a
// prospective applicant's attestation/tuple, ledger or mutable source PR.
export const FROZEN_SOURCE = Object.freeze({
  sha: "17e5f413f2afd3d743fd28d401f0df421825df2a",
  historicalCreation: historicalBaseline,
  effectiveBaseline: "e0fe6309dc0aaa184bbeef35861f7d49256385b7",
  packetSha256: "f6d59762e3696f91696408e5312013481fb1dc5e9dd24d1ee469b1f590f96894",
  sourcePr: 162, auditPr: 175,
  acceptedAuditHead: "96a6d6dc9e3eb72cd6b54ad679b63bf23cb45bb7",
  acceptedReportPath: ".ai/audit/TCW-050_SYNCED_READINESS_SECURITY_REAUDIT.md",
  acceptedReportBlob: "59d400a4215c9fb308eb0887364557f4a09ea7d8",
  trustedCanonicalMaster: "25706f183e9d4523370748ca5ef8af459601bb60",
  frozenManagerEvidenceBlob: "cb5c0cd8c227bd9faf59057a13d52d4122e996ae",
  originalHelperRunId: 35488171554,
  originalHelperJobId: 106018254992
});
const STAGE_REF = /^refs\/heads\/manager\/[a-z0-9][a-z0-9/_-]*$/;

export function releaseTuple(attestation) {
  const a = attestation;
  // Bind *all* immutable source/stage file tuples, exact required-check and
  // preview evidence, auditor report, distinct owner authorities and rollback
  // custody, not merely their top-level commit references. State is excluded
  // because the protected receipt chain advances through the same attempt.
  return {
    schema: a.schema, repository: a.repository,
    attempt: { id: a.attempt?.id, nonce: a.attempt?.nonce,
      issuedAt: a.attempt?.issuedAt, expiresAt: a.attempt?.expiresAt },
    source: a.source, master: a.master, stage: a.stage,
    ruleset: a.ruleset, auditor: a.auditor, authority: a.authority,
    rollback: a.rollback
  };
}
export const tupleDigest = (a) => sha256(stable(releaseTuple(a)));
function evidenceShape(issues, item, label) {
  check(issues, record(item), label + " evidence object required");
  if (!record(item)) return;
  check(issues, sameRepo(item), label + " wrong evidence repository");
  check(issues, exact(item.commit) && exact(item.tree) && exact(item.blob),
    label + " immutable commit/tree/blob required");
  check(issues, typeof item.ref === "string" && REF.test(item.ref),
    label + " valid full off-master evidence ref required");
  check(issues, item.ref !== "refs/heads/master", label + " must remain off master");
  check(issues, typeof item.path === "string" && item.path.length > 0 && !item.path.includes(".."),
    label + " evidence path invalid");
  check(issues, goodId(item.pr), label + " evidence PR required");
}
function approvalShape(issues, item, label, a) {
  check(issues, record(item), label + " approval required");
  if (!record(item)) return;
  check(issues, goodId(item.actorId), label + " actor ID invalid");
  check(issues, exact(item.targetSha) && item.targetSha === a.stage?.sha,
    label + " must bind exact S");
  check(issues, goodId(item.stagePr) && item.stagePr === a.stage?.pr,
    label + " must bind exact stage PR");
  check(issues, item.nonce === a.attempt?.nonce, label + " nonce mismatch");
  check(issues, validTime(item.issuedAt), label + " approval timestamp invalid");
  evidenceShape(issues, item.evidence, label);
}
function pathTuple(issues, tuple, label) {
  check(issues, record(tuple), label + " tuple required");
  if (!record(tuple)) return;
  check(issues, typeof tuple.path === "string" && SOURCE_PATHS.includes(tuple.path),
    label + " unauthorized path");
  check(issues, tuple.mode === "100644", label + " mode mismatch");
  check(issues, exact(tuple.blob), label + " immutable Git blob required");
}
/** Pure *local* contract predicate; even PASS means LOCAL_CONTRACT_PASS, not release-ready. */
export function validateLocalContract(a, options = {}) {
  const issues = [];
  const now = options.now ?? Date.now();
  check(issues, record(a) && a.schema === SCHEMA, "attestation schema/version mismatch");
  if (!record(a)) return { classification: "FAIL", blockers: issues };
  check(issues, eq(a.repository, REPOSITORY), "foreign or ambiguous repository identity");
  const attempt = a.attempt, source = a.source, stage = a.stage, master = a.master;
  check(issues, record(attempt), "attempt required");
  check(issues, record(source), "source A required");
  check(issues, record(stage), "stage S required");
  check(issues, record(master), "frozen M required");
  if (!record(attempt) || !record(source) || !record(stage) || !record(master)) {
    return { classification: "FAIL", blockers: issues };
  }
  check(issues, typeof attempt.id === "string" && /^TCW-[0-9]{3}-[A-Za-z0-9_-]{8,80}$/.test(attempt.id),
    "release attempt ID invalid");
  check(issues, typeof attempt.nonce === "string" && NONCE.test(attempt.nonce),
    "high-entropy per-attempt nonce required");
  check(issues, validTime(attempt.issuedAt) && validTime(attempt.expiresAt),
    "finite attempt timestamps required");
  if (validTime(attempt.issuedAt) && validTime(attempt.expiresAt)) {
    const issued = Date.parse(attempt.issuedAt), expires = Date.parse(attempt.expiresAt);
    check(issues, expires > issued && expires - issued <= TIME_WINDOW_MS,
      "attempt expiry must be finite and at most one hour");
    check(issues, now >= issued && now < expires && issued <= now + 1000,
      "attempt expired, premature or stale");
  }
  check(issues, STATES.includes(attempt.state) && attempt.state !== "ABORTED" &&
    attempt.state !== "RELEASED", "aborted/consumed release attempt not reusable");
  check(issues, record(a.ledger), "protected attempt ledger required");
  if (record(a.ledger)) {
    const l = a.ledger;
    check(issues, sameRepo(l), "ledger repository mismatch");
    check(issues, l.nonce === attempt.nonce && l.attemptId === attempt.id,
      "ledger nonce/attempt mismatch");
    check(issues, DIGEST.test(l.tupleDigest || "") && l.tupleDigest === tupleDigest(a),
      "ledger immutable tuple binding mismatch");
    check(issues, l.state === attempt.state, "ledger transition state mismatch");
    check(issues, l.consumed === false && l.aborted === false,
      "nonce consumed, aborted or replayed");
    check(issues, l.protected === true && exact(l.receiptCommit) && exact(l.receiptBlob),
      "protected durable ledger receipt required");
    check(issues, Array.isArray(l.events) && l.events.length > 0,
      "durable append-only transition events required");
    if (Array.isArray(l.events)) {
      const statePath = ["PREPARED", "REVIEWED", "OWNER_APPROVED"];
      const progress = statePath.indexOf(attempt.state);
      check(issues, l.events.length === progress + 1 && progress >= 0 &&
        l.events.every((event, i) => event?.state === statePath[i] &&
        exact(event?.commit) && event?.nonce === attempt.nonce &&
        event?.tupleDigest === l.tupleDigest && (i === 0 ? event?.previousCommit === null :
          event?.previousCommit === l.events[i - 1]?.commit)),
      "invalid append-only event chain or illegal transition");
    }
  }
  check(issues, source.taskId === "TCW-047" && source.pr === 162 &&
    source.branch === "builder/tcw-047-automated-audit-readiness",
  "source A task/PR/branch identity mismatch");
  check(issues, sameRepo(source) && source.sha === FROZEN_SOURCE.sha &&
    exact(source.tree), "source A differs from independently frozen TCW-050 checkpoint");
  check(issues, source.historicalCreationBaseline === FROZEN_SOURCE.historicalCreation &&
    source.effectiveScopeBaseline === FROZEN_SOURCE.effectiveBaseline,
    "original source A historical creation/effective baseline differs from accepted independent freeze");
  check(issues, record(source.packet) &&
    source.packet?.sha256 === FROZEN_SOURCE.packetSha256 &&
    source.packet?.head === FROZEN_SOURCE.sha &&
    source.packet?.pr === FROZEN_SOURCE.sourcePr &&
    source.packet?.branch === source.branch &&
    source.packet?.readyForManagerFreeze === true,
    "original helper packet differs from immutable TCW-050 digest/A/PR/branch; self-hash is not authority");
  check(issues, record(source.audit) &&
    source.audit.targetSha === FROZEN_SOURCE.sha &&
    source.audit.verdict === "PASS" &&
    source.audit.evidenceCommit === FROZEN_SOURCE.acceptedAuditHead,
    "TCW-050 accepted exact-A audit/head mismatch; self-reported PASS is not authenticated provenance");
  check(issues, Array.isArray(source.files) && source.files.length === SOURCE_PATHS.length,
    "exact four immutable Builder file tuples required");
  if (Array.isArray(source.files)) {
    source.files.forEach((item, i) => pathTuple(issues, item, "source file " + i));
    check(issues, unique(source.files.map((item) => item?.path)) &&
      eq(source.files.map((item) => item?.path).sort(), [...SOURCE_PATHS].sort()),
    "source A file inventory must contain each approved path exactly once");
  }
  check(issues, exact(master.sha) && exact(master.tree) && master.sha !== source.sha,
    "frozen M SHA/tree invalid or confused with source A");
  check(issues, record(stage.authorization) &&
    /^TCW-[0-9]{3}$/.test(stage.authorization?.taskId || "") &&
    stage.authorization?.taskPath ===
      ".ai/manager/tasks/" + stage.authorization?.taskId + ".md" &&
    stage.authorization?.masterSha === master.sha &&
    stage.authorization?.pr === stage.pr &&
    stage.authorization?.branch === stage.branch,
    "stage task/PR/branch requires separate exact-M Manager assignment; prefix is not authority");
  check(issues, sameRepo(stage) && goodId(stage.pr) && stage.pr !== source.pr &&
    typeof stage.branch === "string" && STAGE_REF.test(stage.branch) &&
    stage.branch !== source.branch && stage.branch !== "refs/heads/master",
  "separate Manager-owned stage PR/ref required");
  check(issues, exact(stage.sha) && exact(stage.tree) && stage.sha !== source.sha &&
    stage.sha !== master.sha && stage.baseSha === master.sha &&
    stage.mergeMethod === "merge", "distinct immutable S, exact M base, merge method required");
  check(issues, Array.isArray(stage.parents) && stage.parents.length === 1 &&
    stage.parents[0] === master.sha,
  "stage must descend directly from frozen M without unexpected parent");
  check(issues, Array.isArray(stage.changedFiles) &&
    stage.changedFiles.length === SOURCE_PATHS.length, "stage complete inventory must have four paths");
  if (Array.isArray(stage.changedFiles)) {
    stage.changedFiles.forEach((item, i) => pathTuple(issues, item, "stage file " + i));
    check(issues, unique(stage.changedFiles.map((item) => item?.path)) &&
      eq(stage.changedFiles.map((item) => item?.path).sort(), [...SOURCE_PATHS].sort()),
    "extra, duplicated or missing stage file");
    for (const staged of stage.changedFiles) {
      const original = source.files?.find((file) => file.path === staged.path);
      check(issues, original && original.mode === staged.mode && original.blob === staged.blob,
        "source A/stage S path-mode-blob custody mismatch: " + staged.path);
    }
  }
  check(issues, record(a.ruleset) && goodId(a.ruleset.id) &&
    DIGEST.test(a.ruleset.digest || "") &&
    DIGEST.test(a.ruleset.effectiveDigest || "") &&
    a.ruleset.strictUpToDate === true &&
    a.ruleset.bypass === false && a.ruleset.mergeMethod === "merge" &&
    a.ruleset.requiredContext === REQUIRED_CHECK.context &&
    a.ruleset.integrationId === REQUIRED_CHECK.integrationId,
  "frozen strict ruleset and exact required-check integration invalid");
  const ci = stage.ci;
  check(issues, record(ci) && ci.headSha === stage.sha && ci.mode === "FULL" &&
    ci.context === REQUIRED_CHECK.context && ci.integrationId === REQUIRED_CHECK.integrationId &&
    ci.conclusion === "success" && goodId(ci.runId) && goodId(ci.jobId) &&
    goodId(ci.checkRunId) && goodId(ci.checkSuiteId) &&
    ci.appId === REQUIRED_CHECK.integrationId && ci.pr === stage.pr,
    "required FULL exact-S Actions test and app/check provenance invalid");
  const preview = stage.preview;
  check(issues, record(preview) && exact(preview.sha) && preview.sha !== stage.sha &&
    preview.baseSha === master.sha && preview.headSha === stage.sha &&
    preview.context === REQUIRED_CHECK.context &&
    preview.integrationId === REQUIRED_CHECK.integrationId &&
    preview.conclusion === "success" && preview.required === true,
    "GitHub-required exact-M/S synthetic merge preview is unverified");
  const auditor = a.auditor;
  check(issues, record(auditor) && auditor.targetSha === stage.sha &&
    auditor.verdict === "PASS" && goodId(auditor.actorId) &&
    auditor.branch !== stage.branch && typeof auditor.branch === "string" &&
    REF.test(auditor.branch) && exact(auditor.historicalCreationBaseline),
    "separate independently authored exact-S whole-tree audit required");
  evidenceShape(issues, auditor?.evidence, "independent Auditor");
  check(issues, auditor?.evidence?.commit !== stage.sha &&
    auditor?.evidence?.commit !== master.sha,
    "off-master audit cannot be stage S or master M");
  const authority = a.authority;
  check(issues, record(authority) && record(authority.policy) &&
    sameRepo(authority.policy) && exact(authority.policy.commit) &&
    exact(authority.policy.blob) && goodId(authority.policy.ownerActorId) &&
    goodId(authority.policy.managerActorId) &&
    goodId(authority.policy.auditorActorId) &&
    unique([authority.policy.ownerActorId, authority.policy.managerActorId,
      authority.policy.auditorActorId]),
    "independent owner/Manager/Auditor actor policy and immutable approval contract required");
  approvalShape(issues, authority?.plan, "separate stage-plan owner", a);
  approvalShape(issues, authority?.installation, "separate exact-S installation owner", a);
  check(issues, authority?.plan?.actorId === authority?.policy?.ownerActorId &&
    authority?.installation?.actorId === authority?.policy?.ownerActorId &&
    authority?.installation?.evidence?.commit !== authority?.plan?.evidence?.commit,
    "owner plan and installation consent must be distinct authenticated records");
  check(issues, record(a.rollback) && a.rollback.available === true &&
    goodId(a.rollback.operatorId) && exact(a.rollback.planCommit) &&
    a.rollback.operatorId !== authority?.policy?.auditorActorId,
    "independently available rollback operator and plan required");
  if (validTime(authority?.plan?.issuedAt) && validTime(authority?.installation?.issuedAt) &&
      validTime(attempt.issuedAt) && validTime(attempt.expiresAt)) {
    check(issues, Date.parse(authority.plan.issuedAt) <= Date.parse(authority.installation.issuedAt) &&
      Date.parse(authority.installation.issuedAt) >= Date.parse(attempt.issuedAt) &&
      Date.parse(authority.installation.issuedAt) < Date.parse(attempt.expiresAt),
    "owner release consent stale, out of order or for older attempt");
  }
  check(issues, attempt.state === "OWNER_APPROVED" || attempt.state === "REVIEWED" ||
    attempt.state === "PREPARED", "invalid premerge state");
  return { schema: SCHEMA, classification: issues.length ? "FAIL" : "LOCAL_CONTRACT_PASS",
    blockers: issues, tupleSha256: issues.length ? null : tupleDigest(a),
    authority: "LOCAL_FIXTURE_ONLY_NOT_GITHUB_AUTHENTICATED" };
}

/** Explicit fail-closed receipt transition. This function NEVER persists a ledger or approves release. */
export function validateLedgerTransition(before, after, a) {
  const blockers = [];
  check(blockers, record(before) && record(after) && before.protected === true &&
    after.protected === true, "protected durable before/after ledger required");
  if (!record(before) || !record(after)) return { classification: "FAIL", blockers };
  const allowed = { PREPARED: "REVIEWED", REVIEWED: "OWNER_APPROVED",
    OWNER_APPROVED: "RELEASED" };
  check(blockers, allowed[before.state] === after.state || after.state === "ABORTED",
    "illegal transition or replay");
  check(blockers, before.consumed === false && before.aborted === false &&
    before.nonce === a.attempt?.nonce && after.nonce === before.nonce &&
    before.attemptId === after.attemptId &&
    before.tupleDigest === after.tupleDigest &&
    before.tupleDigest === tupleDigest(a),
  "nonce/tuple changed or previously consumed/aborted");
  check(blockers, Array.isArray(before.events) && Array.isArray(after.events) &&
    after.events.length === before.events.length + 1 &&
    eq(before.events, after.events.slice(0, -1)),
  "append-only single-event ledger update required");
  const tail = after.events?.at(-1);
  check(blockers, tail?.state === after.state && tail?.previousCommit === before.events?.at(-1)?.commit &&
    tail?.nonce === before.nonce && tail?.tupleDigest === before.tupleDigest &&
    exact(tail?.commit) && exact(after.receiptCommit) && exact(after.receiptBlob),
  "ledger transition receipt/chain invalid");
  check(blockers, after.consumed === (after.state === "RELEASED") &&
    after.aborted === (after.state === "ABORTED"),
  "released or aborted nonce must be irreversibly marked");
  return { classification: blockers.length ? "FAIL" : "LOCAL_TRANSITION_CONTRACT_PASS", blockers };
}
function liveMismatch(blockers, predicate, label) { check(blockers, predicate, "live " + label); }
function actualPaths(files) {
  return (files || []).map((file) => ({
    path: file.filename, mode: file.mode, blob: file.sha
  })).sort((a, b) => a.path.localeCompare(b.path));
}
/**
 * An effective protection snapshot is LOCAL evidence only; the read-only
 * observer must independently obtain the complete effective-list AND each
 * fully expanded applicable rule from GitHub. Never splice a PR rule from a
 * different ruleset onto a strict status-check rule, or accept a self-report
 * bypass:false when the actual rules grant bypass rights.
 */
export function validateEffectiveProtection(a, live) {
  const blockers = [], rules = live?.effectiveRulesets, listed = live?.effectiveRuleList;
  check(blockers, Array.isArray(listed) && listed.length === 1 &&
    Array.isArray(rules) && rules.length === 1 &&
    listed[0]?.id === rules[0]?.id && rules[0]?.id === a.ruleset?.id,
    "complete effective protection list/ruleset identity missing, partial or cross-ruleset");
  const rule = Array.isArray(rules) && rules.length === 1 ? rules[0] : null;
  check(blockers, record(rule) && rule.id === a.ruleset?.id &&
    rule.enforcement === "active" && rule.target === "branch" &&
    rule.source_type === "Repository" && rule.source === REPOSITORY.fullName &&
    eq(rule.conditions?.ref_name?.include, ["~DEFAULT_BRANCH"]) &&
    eq(rule.conditions?.ref_name?.exclude, []) &&
    Array.isArray(rule.bypass_actors) && rule.bypass_actors.length === 0 &&
    rule.current_user_can_bypass === "never",
    "applicable protected master provenance, no-bypass actors/current-user or branch scope unverified");
  const pull = rule?.rules?.filter((entry) => entry.type === "pull_request") || [];
  const status = rule?.rules?.filter((entry) => entry.type === "required_status_checks") || [];
  check(blockers, pull.length === 1 && status.length === 1 &&
    Array.isArray(pull[0]?.parameters?.allowed_merge_methods) &&
    pull[0].parameters.allowed_merge_methods.includes("merge") &&
    a.stage?.mergeMethod === "merge" && a.ruleset?.mergeMethod === "merge",
    "single applicable PR-required rule and explicit permitted merge method unavailable");
  check(blockers, status.length === 1 &&
    status[0].parameters?.strict_required_status_checks_policy === true &&
    status[0].parameters?.required_status_checks?.some((entry) =>
      entry.context === REQUIRED_CHECK.context &&
      entry.integration_id === REQUIRED_CHECK.integrationId),
    "same applicable ruleset strict up-to-date required test/app integration missing");
  check(blockers, rule && sha256(stable(rule)) === a.ruleset?.digest &&
    live?.rulesetDigest === a.ruleset?.digest &&
    sha256(stable(rules)) === a.ruleset?.effectiveDigest &&
    live?.effectiveRulesetDigest === a.ruleset?.effectiveDigest,
    "independently observed live selected/effective ruleset digest mismatch");
  return { classification: blockers.length ? "FAIL" : "LOCAL_PROTECTION_CONTRACT_PASS",
    blockers, authority: "CALLER_SUPPLIED_SNAPSHOT_NOT_AUTHENTICATED" };
}
export function validatePremergeSnapshot(a, live) {
  const blockers = [];
  const l = live || {};
  liveMismatch(blockers, l.repository?.id === REPOSITORY.id &&
    l.repository?.full_name === REPOSITORY.fullName, "repository identity mismatch");
  liveMismatch(blockers, l.masterRef?.object?.sha === a.master?.sha &&
    l.masterCommit?.sha === a.master?.sha &&
    l.masterCommit?.tree?.sha === a.master?.tree,
  "protected master M moved or tree changed");
  liveMismatch(blockers, l.sourceRef?.object?.sha === a.source?.sha &&
    l.sourcePr?.number === a.source?.pr && l.sourcePr?.head?.sha === a.source?.sha &&
    l.sourcePr?.head?.ref === a.source?.branch &&
    l.sourcePr?.head?.repo?.id === REPOSITORY.id &&
    l.sourcePr?.state === "open",
  "source Builder A PR/ref changed");
  liveMismatch(blockers, l.stageRef?.object?.sha === a.stage?.sha &&
    l.stagePr?.number === a.stage?.pr && l.stagePr?.head?.sha === a.stage?.sha &&
    l.stagePr?.head?.ref === a.stage?.branch?.replace("refs/heads/", "") &&
    l.stagePr?.head?.repo?.id === REPOSITORY.id &&
    l.stagePr?.base?.sha === a.master?.sha &&
    l.stagePr?.base?.ref === "master" && l.stagePr?.state === "open",
  "staged PR/head/ref/base mismatch");
  liveMismatch(blockers, l.stageCommit?.sha === a.stage?.sha &&
    l.stageCommit?.tree?.sha === a.stage?.tree &&
    eq(l.stageCommit?.parents?.map((parent) => parent.sha), a.stage?.parents),
  "stage S tree/parentage changed");
  liveMismatch(blockers, l.sourceCustody?.sourceSha === FROZEN_SOURCE.sha &&
    l.sourceCustody?.historicalCreation === FROZEN_SOURCE.historicalCreation &&
    l.sourceCustody?.effectiveBaseline === FROZEN_SOURCE.effectiveBaseline &&
    l.sourceCustody?.packetSha256 === FROZEN_SOURCE.packetSha256 &&
    l.sourceCustody?.originalPacketBytesVerified === true &&
    l.sourceCustody?.auditHead === FROZEN_SOURCE.acceptedAuditHead &&
    l.sourceCustody?.auditReportBlob === FROZEN_SOURCE.acceptedReportBlob &&
    l.sourceCustody?.auditTarget === FROZEN_SOURCE.sha &&
    l.sourceCustody?.auditVerdict === "PASS",
  "immutable original A packet bytes and independent TCW-050 provenance UNVERIFIED");
  liveMismatch(blockers, l.stageAuthority?.verified === true &&
    l.stageAuthority?.masterSha === a.master?.sha &&
    l.stageAuthority?.taskId === a.stage?.authorization?.taskId &&
    l.stageAuthority?.taskPath === a.stage?.authorization?.taskPath &&
    l.stageAuthority?.branch === a.stage?.branch &&
    l.stageAuthority?.pr === a.stage?.pr &&
    l.stageAuthority?.owner === "Manager",
  "independently assigned Manager stage task/branch/PR authority UNVERIFIED");
  liveMismatch(blockers, eq(actualPaths(l.sourceFiles), a.source?.files?.slice().sort((x, y) =>
    x.path.localeCompare(y.path))), "original source A blob/mode inventory mismatch");
  liveMismatch(blockers, eq(actualPaths(l.stageChangedFiles), a.stage?.changedFiles?.slice().sort((x, y) =>
    x.path.localeCompare(y.path))), "complete stage S diff or source blob mismatch");
  const protection = validateEffectiveProtection(a, l);
  blockers.push(...protection.blockers.map((issue) => "live " + issue));
  liveMismatch(blockers, l.ci?.headSha === a.stage?.sha &&
    l.ci?.context === REQUIRED_CHECK.context &&
    l.ci?.integrationId === REQUIRED_CHECK.integrationId &&
    l.ci?.mode === "FULL" && l.ci?.conclusion === "success" &&
    l.ci?.runId === a.stage?.ci?.runId &&
    l.ci?.jobId === a.stage?.ci?.jobId &&
    l.ci?.checkRunId === a.stage?.ci?.checkRunId &&
    l.ci?.checkSuiteId === a.stage?.ci?.checkSuiteId &&
    l.ci?.appId === REQUIRED_CHECK.integrationId,
  "required exact-S FULL test/check app/provenance not independently verified");
  liveMismatch(blockers, l.preview?.sha === a.stage?.preview?.sha &&
    l.preview?.headSha === a.stage?.sha &&
    l.preview?.baseSha === a.master?.sha &&
    l.preview?.context === REQUIRED_CHECK.context &&
    l.preview?.integrationId === REQUIRED_CHECK.integrationId &&
    l.preview?.conclusion === "success",
  "required exact-stage synthetic merge preview not verified");
  liveMismatch(blockers, l.auditEvidence?.commit?.sha === a.auditor?.evidence?.commit &&
    l.auditEvidence?.commit?.tree?.sha === a.auditor?.evidence?.tree &&
    l.auditEvidence?.blob?.sha === a.auditor?.evidence?.blob &&
    l.auditEvidence?.ref?.object?.sha === a.auditor?.evidence?.commit &&
    l.auditEvidence?.report?.targetSha === a.stage?.sha &&
    l.auditEvidence?.report?.verdict === "PASS",
  "independent exact-S off-master audit evidence/provenance missing");
  liveMismatch(blockers, l.planEvidence?.commit?.sha === a.authority?.plan?.evidence?.commit &&
    l.installEvidence?.commit?.sha === a.authority?.installation?.evidence?.commit &&
    l.planEvidence?.ref?.object?.sha === a.authority?.plan?.evidence?.commit &&
    l.installEvidence?.ref?.object?.sha === a.authority?.installation?.evidence?.commit,
  "distinct immutable owner approval evidence ref moved or unavailable");
  liveMismatch(blockers, l.ledgerReceipt?.commit?.sha === a.ledger?.receiptCommit &&
    l.ledgerReceipt?.blob?.sha === a.ledger?.receiptBlob &&
    l.ledgerReceipt?.protected === true &&
    l.ledgerReceipt?.nonce === a.attempt?.nonce &&
    l.ledgerReceipt?.tupleDigest === tupleDigest(a) &&
    l.ledgerReceipt?.consumed === false && l.ledgerReceipt?.aborted === false,
  "protected durable nonce/ledger receipt missing or changed");
  liveMismatch(blockers, l.actors?.authenticated === true &&
    l.actors?.owner?.id === a.authority?.policy?.ownerActorId &&
    l.actors?.manager?.id === a.authority?.policy?.managerActorId &&
    l.actors?.auditor?.id === a.authority?.policy?.auditorActorId &&
    l.actors?.permissionsVerified === true &&
    l.actors?.evidencePublicationVerified === true,
  "owner/Manager/Auditor GitHub actor rights and publication not authenticated");
  liveMismatch(blockers, l.rollback?.authenticated === true &&
    l.rollback?.operatorId === a.rollback?.operatorId &&
    l.rollback?.availabilityVerified === true,
  "rollback operator/plan not independently authenticated");
  return { classification: blockers.length ? "FAIL" : "LOCAL_SNAPSHOT_CONTRACT_PASS",
    blockers, authority: "CALLER_SUPPLIED_SNAPSHOT_NOT_AUTHENTICATED" };
}
export function validatePostmergeSnapshot(a, live) {
  const blockers = [];
  const g = live?.mergeCommit;
  check(blockers, a?.stage?.mergeMethod === "merge" && a?.ruleset?.mergeMethod === "merge" &&
    live?.observedMergeMethod === "merge", "squash, rebase or unverified merge method forbidden");
  check(blockers, exact(g?.sha) && g.sha !== a?.source?.sha &&
    g.sha !== a?.stage?.sha && g.sha !== a?.master?.sha,
  "G must be a distinct actual protected integration commit");
  check(blockers, Array.isArray(g?.parents) && g.parents.length === 2 &&
    g.parents[0]?.sha === a?.master?.sha && g.parents[1]?.sha === a?.stage?.sha,
  "G must have exactly two ordered parents: frozen M, audited S");
  check(blockers, g?.tree?.sha === a?.stage?.tree && live?.masterRef?.object?.sha === g?.sha,
  "actual merged G tree must equal audited S and protected master must equal G");
  check(blockers, eq(actualPaths(live?.mergedChangedFiles),
    a?.stage?.changedFiles?.slice().sort((x, y) => x.path.localeCompare(y.path))),
  "actual merged path/mode/blob inventory differs from independently audited stage");
  check(blockers, live?.masterCi?.sha === g?.sha && live?.masterCi?.mode === "FULL" &&
    live?.masterCi?.conclusion === "success" &&
    live?.deployment?.sha === g?.sha && live?.deployment?.productionVerified === true,
  "post-merge FULL master CI and deployed production evidence not established");
  check(blockers, live?.ledgerReceipt?.state === "RELEASED" &&
    live?.ledgerReceipt?.consumed === true &&
    live?.ledgerReceipt?.nonce === a?.attempt?.nonce,
  "postmerge protected consumed-once ledger receipt not established");
  return { classification: blockers.length ? "FAIL" : "LOCAL_POSTMERGE_CONTRACT_PASS",
    blockers, authority: "CALLER_SUPPLIED_SNAPSHOT_NOT_AUTHENTICATED" };
}

function sanitize(error) {
  return String(error?.message || error || "unavailable")
    .replace(/(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|Bearer\s+\S+)/gi,
      "[REDACTED]").replace(/[\r\n]+/g, " ").slice(0, 500);
}
async function githubGet(resource, token) {
  const response = await fetch("https://api.github.com/repos/" + REPOSITORY.fullName + resource, {
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("GitHub read-only verification HTTP " + response.status);
  return response.json();
}
const encodeRef = (ref) => ref.split("/").map(encodeURIComponent).join("/");
function requireTreeTuples(tree, paths, label) {
  if (tree?.truncated !== false || !Array.isArray(tree.tree))
    throw new Error(label + " complete Git tree unavailable or truncated");
  return paths.map((file) => {
    const matched = tree.tree.filter((entry) =>
      entry.path === file && entry.type === "blob");
    if (matched.length !== 1 || !exact(matched[0].sha))
      throw new Error(label + " expected source file blob unavailable: " + file);
    return { filename: file, mode: matched[0].mode, sha: matched[0].sha };
  });
}
function requiredCheckFromGitHub(a, run, job, checks, previewChecks, previewCommit, stagePr) {
  const requiredStages = [
    "Workflow V3.2 state audit", "Dependency audit", "Full unit and contract tests",
    "Model evaluation", "Static smoke", "Browser smoke", "Accessibility audit",
    "Readiness audit", "Mobile audit", "Extension audit", "Performance audit",
    "Security scan"
  ];
  const full = run?.head_sha === a.stage.sha && run?.event === "pull_request" &&
    run?.conclusion === "success" && job?.run_id === a.stage.ci.runId &&
    job?.name === "test" && job?.conclusion === "success" &&
    requiredStages.every((name) => job?.steps?.some((step) =>
      step.name === name && step.conclusion === "success"));
  const check = checks?.check_runs?.find((entry) =>
    entry.id === a.stage.ci.checkRunId &&
    entry.head_sha === a.stage.sha &&
    entry.name === REQUIRED_CHECK.context && entry.conclusion === "success" &&
    entry.app?.id === REQUIRED_CHECK.integrationId &&
    entry.check_suite?.id === a.stage.ci.checkSuiteId);
  const previewCheck = previewChecks?.check_runs?.find((entry) =>
    entry.head_sha === a.stage.preview.sha &&
    entry.name === REQUIRED_CHECK.context && entry.conclusion === "success" &&
    entry.app?.id === REQUIRED_CHECK.integrationId);
  const previewParents = previewCommit?.parents?.map((p) => p.sha);
  const previewClean = stagePr?.merge_commit_sha === a.stage.preview.sha &&
    Array.isArray(previewParents) && previewParents.length === 2 &&
    previewParents[0] === a.master.sha && previewParents[1] === a.stage.sha &&
    previewCommit?.tree?.sha === a.stage.tree;
  return {
    ci: {
      headSha: run?.head_sha, context: check?.name, integrationId: check?.app?.id,
      mode: full ? "FULL" : "UNVERIFIED", conclusion: full && check ? "success" : "unverified",
      runId: run?.id, jobId: job?.id, checkRunId: check?.id,
      checkSuiteId: check?.check_suite?.id, appId: check?.app?.id
    },
    preview: {
      sha: previewCommit?.sha, headSha: previewClean ? a.stage.sha : null,
      baseSha: previewClean ? a.master.sha : null,
      context: previewCheck?.name, integrationId: previewCheck?.app?.id,
      conclusion: previewClean && previewCheck ? "success" : "unverified"
    }
  };
}
/**
 * Read-only GitHub observation of S/A/M, complete PR file inventory and exact
 * actual required test/check/preview provenance. The caller must still NOT use
 * these observations as owner/audit/ledger authentication or merge authority.
 */
export async function observeStageReadOnly(a, read) {
  const [repo, masterRef, sourceRef, stageRef, stagePr, sourcePr, stageCommit,
    masterCommit, sourceCommit, ruleset, sourceTree, stageTree, stagePrFiles,
    run, job, checks, previewChecks, previewCommit] = await Promise.all([
    read(""),
    read("/git/ref/heads/master"),
    read("/git/ref/heads/" + encodeRef(a.source.branch)),
    read("/git/ref/heads/" + encodeRef(a.stage.branch.replace("refs/heads/", ""))),
    read("/pulls/" + a.stage.pr),
    read("/pulls/" + a.source.pr),
    read("/git/commits/" + a.stage.sha),
    read("/git/commits/" + a.master.sha),
    read("/git/commits/" + a.source.sha),
    read("/rulesets/" + a.ruleset.id),
    read("/git/trees/" + a.source.tree + "?recursive=1"),
    read("/git/trees/" + a.stage.tree + "?recursive=1"),
    read("/pulls/" + a.stage.pr + "/files?per_page=100"),
    read("/actions/runs/" + a.stage.ci.runId),
    read("/actions/jobs/" + a.stage.ci.jobId),
    read("/commits/" + a.stage.sha + "/check-runs?check_name=test&per_page=100"),
    read("/commits/" + a.stage.preview.sha + "/check-runs?check_name=test&per_page=100"),
    read("/git/commits/" + a.stage.preview.sha)
  ]);
  if (sourceCommit?.tree?.sha !== a.source.tree)
    throw new Error("independent source A Git tree mismatch");
  if (!Array.isArray(stagePrFiles) || stagePrFiles.length !== SOURCE_PATHS.length ||
      stagePr?.changed_files !== SOURCE_PATHS.length ||
      !eq(stagePrFiles.map((file) => file.filename).sort(), [...SOURCE_PATHS].sort()))
    throw new Error("complete stage PR changed-file inventory missing or unauthorized");
  const sourceFiles = requireTreeTuples(sourceTree, SOURCE_PATHS, "source A");
  const stageTreeFiles = requireTreeTuples(stageTree, SOURCE_PATHS, "stage S");
  const changedFiles = stagePrFiles.map((file) => {
    const tree = stageTreeFiles.find((entry) => entry.filename === file.filename);
    if (!tree || file.sha !== tree.sha || !["added", "modified"].includes(file.status))
      throw new Error("stage PR changed blob/status not equal immutable S tree");
    return tree;
  });
  const checksData = requiredCheckFromGitHub(a, run, job, checks, previewChecks,
    previewCommit, stagePr);
  return {
    repository: repo, masterRef, sourceRef, stageRef, stagePr, sourcePr,
    stageCommit, masterCommit, sourceFiles, stageChangedFiles: changedFiles,
    ruleset, rulesetDigest: sha256(stable(ruleset)),
    ci: { ...checksData.ci, pr: stagePr.number },
    preview: checksData.preview
  };
}
/**
 * Actual CLI premerge intentionally holds unless every required live verification
 * (including protected ledger and actor-rights proof) is available. It never
 * accepts a caller-supplied "authenticated" JSON snapshot as live authority.
 */
export async function verifyPremergeReadOnly(a, options = {}) {
  const local = validateLocalContract(a, { now: options.now });
  if (local.classification !== "LOCAL_CONTRACT_PASS") return { classification: "FAIL", blockers: local.blockers };
  const token = options.token ?? process.env.GITHUB_TOKEN;
  if (!token) return { classification: "RELEASE_HOLD", blockers:
    ["authenticated read-only GitHub credential unavailable; owner/actor and protected ledger NOT VERIFIED"] };
  const blockers = [];
  const read = options.githubGet || ((resource) => githubGet(resource, token));
  try {
    const observed = await observeStageReadOnly(a, read);
    const snapshot = validatePremergeSnapshot(a, observed);
    blockers.push(...snapshot.blockers);
    // Independent GitHub reads can establish immutable file and CI observation;
    // they do NOT prove an externally protected release ledger, actor rights,
    // owner approval or independently available rollback operator.
    blockers.push("authenticated owner/Manager/Auditor publication and rights NOT VERIFIED");
    blockers.push("protected durable nonce ledger and consumed/aborted receipt NOT VERIFIED");
    if (snapshot.blockers.some((issue) => /FULL test|synthetic merge preview|stage S diff|source A blob|ruleset/.test(issue)))
      blockers.push("exact-S FULL check, required synthetic preview, source blob or ruleset NOT VERIFIED");
    blockers.push("immutable independent off-master stage audit, exact-S owner consent and rollback operator NOT VERIFIED");
    return { classification: "RELEASE_HOLD", blockers, liveReadOnly: true };
  } catch (error) {
    return { classification: "RELEASE_HOLD",
      blockers: ["read-only authenticated GitHub observation unavailable: " + sanitize(error)],
      liveReadOnly: true };
  }
}
export async function verifyPostmergeReadOnly(a, options = {}) {
  const token = options.token ?? process.env.GITHUB_TOKEN;
  if (!token) return { classification: "RELEASE_HOLD",
    blockers: ["authenticated postmerge GitHub reads and protected consumed ledger unavailable"] };
  const read = options.githubGet || ((resource) => githubGet(resource, token));
  try {
    const masterRef = await read("/git/ref/heads/master");
    const g = masterRef?.object?.sha;
    if (!exact(g)) return { classification: "RELEASE_HOLD", blockers: ["protected master G unavailable"] };
    const mergeCommit = await read("/git/commits/" + g);
    const result = validatePostmergeSnapshot(a, { masterRef, mergeCommit });
    return { classification: "RELEASE_HOLD",
      blockers: result.blockers.concat(
        "actual protected merge method, full merged inventory, live master CI/deploy and consumed nonce ledger NOT VERIFIED"),
      liveReadOnly: true };
  } catch (error) {
    return { classification: "RELEASE_HOLD",
      blockers: ["read-only postmerge GitHub observation unavailable: " + sanitize(error)] };
  }
}
function parseCli(args) {
  if (!["validate", "premerge", "postmerge"].includes(args[0]) ||
      args.length !== 3 || args[1] !== "--input" || !args[2])
    throw new Error("Usage: node scripts/workflow-composite-release.js validate|premerge|postmerge --input local-attestation.json");
  return { command: args[0], location: args[2] };
}
async function main(args = process.argv.slice(2)) {
  let answer;
  try {
    const { command, location } = parseCli(args);
    const a = JSON.parse(readFileSync(path.resolve(location), "utf8"));
    answer = command === "validate" ? validateLocalContract(a) :
      command === "premerge" ? await verifyPremergeReadOnly(a) :
        await verifyPostmergeReadOnly(a);
  } catch (error) {
    answer = { classification: "FAIL", blockers: ["invalid input or local contract: " + sanitize(error)] };
  }
  console.log(JSON.stringify(answer, null, 2));
  if (answer.classification === "FAIL") process.exitCode = 2;
  else if (answer.classification === "RELEASE_HOLD") process.exitCode = 3;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
