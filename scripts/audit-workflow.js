import { access, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWED_STATUSES = Object.freeze(["PLANNED","WAITING_EXTERNAL_EVIDENCE","BLOCKED","ASSIGNED","IN_PROGRESS","MANAGER_REVIEW_READY","AUDIT_READY","MERGE_READY","REWORK_REQUIRED","MERGED","VERIFYING_MASTER","CLOSED"]);
const ACTIVE_REGISTRY_STATUSES = new Set(ALLOWED_STATUSES.filter((item) => item !== "CLOSED"));
const ACTIVE_STALE_STATUSES = new Set(["ASSIGNED","IN_PROGRESS","MANAGER_REVIEW_READY","AUDIT_READY","MERGE_READY","REWORK_REQUIRED"]);
const RUNNABLE_STATUSES = new Set(["ASSIGNED","IN_PROGRESS","MANAGER_REVIEW_READY","AUDIT_READY","MERGE_READY","REWORK_REQUIRED"]);
const OWNERS = new Set(["Manager","Builder","Auditor","R&D","Strategy","Troubleshooting"]);
const DEPENDENCIES = new Set(["INDEPENDENT","SOFT","HARD"]);
const EXECUTION_MODES = new Set(["STANDARD_CHAT_HIGH","WORK_MODE"]);
const REFRESH_MODES = new Set(["FAST_REFRESH","BOUNDED_REMEDIATION_REFRESH","FULL_REFRESH"]);
const BLOCKER_TYPES = new Set(["NONE","USER_ACTION","UPSTREAM_TASK","EXTERNAL_SERVICE","EXTERNAL_EVIDENCE","TECHNICAL","AUDIT"]);
const TARGET_ADVANCEMENT = new Set(["CONTROL_PLANE_ONLY","NON_OVERLAPPING","OVERLAPPING_RISK"]);
const TASK_ID_RE = /^TCW-(?:PW-)?\d{3}$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const BRANCH_PREFIX = Object.freeze({ Manager:"manager/", Builder:"builder/", Auditor:"auditor/", "R&D":"rnd/", Strategy:"strategy/", Troubleshooting:"troubleshooting/" });
const CANONICAL_NEXT_ACTIVATION_ROLES = Object.freeze([
  "Manager / Architect",
  "Implementation Engineer / Builder",
  "In-Season Strategy & Decision Intelligence Analyst",
  "Research & Development (R&D)",
  "Independent Auditor / QA",
  "Troubleshooting & Root Cause Engineer — on-demand"
]);
const CLOSEOUT_AUDIT_VERDICTS = new Set(["PASS","PASS WITH NON-BLOCKING FINDINGS","NOT_APPLICABLE"]);
const CLOSEOUT_CANARY_RESULTS = new Set(["PASS","NOT_APPLICABLE"]);

function add(errors, condition, message) { if (!condition) errors.push(message); }
function field(text, name) {
  const prefix = `${name}:`;
  const line = String(text || "").split(/\r?\n/).find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()));
  return line ? line.slice(prefix.length).trim() : null;
}
function prefixOverlap(a,b) {
  if (!a || !b) return null;
  if (a === b) return a;
  if (a.endsWith("/") && b.startsWith(a)) return b;
  if (b.endsWith("/") && a.startsWith(b)) return a;
  return null;
}
function wholePrefixForbidden(task,prefix) { return (task.forbidden_path_prefixes || []).some((forbidden) => forbidden === prefix || (forbidden.endsWith("/") && prefix.startsWith(forbidden))); }
function effectiveWriteOverlap(a,b) {
  for (const left of a.allowed_path_prefixes || []) for (const right of b.allowed_path_prefixes || []) {
    const overlap = prefixOverlap(left,right);
    if (!overlap) continue;
    if (wholePrefixForbidden(a,overlap) || wholePrefixForbidden(b,overlap)) continue;
    return overlap;
  }
  return null;
}
function explicitlySerializedHardPair(a,b) {
  return (a.dependency === "HARD" && (a.blocked_on_tasks || []).includes(b.task_id)) || (b.dependency === "HARD" && (b.blocked_on_tasks || []).includes(a.task_id));
}

export function validateTaskSpecContract(task,text) {
  const errors=[];
  const expected=[["Schema","TCW_TASK_V2"],["ROLE ROUTING",task.role_label],["STATUS",task.status],["DEPENDENCY",task.dependency],["EXECUTION MODE",task.execution_mode],["REFRESH MODE",task.refresh_mode],["BLOCKER TYPE",task.blocker_type],["USER ACTION REQUIRED",String(task.user_action_required)]];
  for (const [name,value] of expected) {
    if (value == null) continue;
    add(errors, field(text,name) === String(value), `${task.task_id}: task spec ${name} must equal registry value ${value}.`);
  }
  add(errors, String(text).includes(`# ${task.task_id} —`) || String(text).includes(`# ${task.task_id} -`), `${task.task_id}: task spec heading must identify task.`);
  for (const name of ["PRODUCTION_SHA","VALIDATED_CI","HANDOFF_SHA","INTEGRATION_SHA","MANAGER_VERDICT","AUDIT_STATUS"]) add(errors, Boolean(field(text,name)), `${task.task_id}: TCW_TASK_V2 task spec missing ${name}.`);
  if (task.refresh_mode === "FULL_REFRESH") add(errors, Boolean(field(text,"REFRESH REASON") && field(text,"REFRESH REASON") !== "N/A"), `${task.task_id}: FULL_REFRESH task spec requires REFRESH REASON.`);
  return errors;
}

export function validateRegistryShape(registry) {
  const errors=[]; const warnings=[];
  add(errors, registry?.schema_version === 3, "ACTIVE_TASKS schema_version must be 3 for Workflow V3.2.");
  add(errors, registry?.workflow_version === "V3.2", "workflow_version must be V3.2.");
  add(errors, registry?.workflow_overlay === ".ai/shared/WORKFLOW_V3_2.md", "workflow_overlay must point to Workflow V3.2.");
  add(errors, registry?.canonical_branch === "master", "canonical_branch must be master.");
  add(errors, registry?.manager_owned === true, "ACTIVE_TASKS must remain Manager-owned.");
  add(errors, registry?.active_only === true, "ACTIVE_TASKS must declare active_only true.");
  add(errors, Array.isArray(registry?.tasks), "tasks must be an array.");
  const ids=new Set(); const branches=new Map(); const prs=new Map(); const slots=new Map();
  function claimUnique(map,value,label,kind) { if (value == null || value === "") return; if (map.has(value)) errors.push(`${label}: ${kind} duplicates ${map.get(value)} (${value}).`); else map.set(value,label); }

  for (const task of registry?.tasks || []) {
    const id=task?.task_id || "<missing>";
    add(errors,TASK_ID_RE.test(id),`Invalid task_id: ${id}`);
    if (ids.has(id)) errors.push(`Duplicate task_id in ACTIVE_TASKS: ${id}`);
    ids.add(id);
    add(errors,OWNERS.has(task?.owner),`${id}: invalid owner ${task?.owner}`);
    add(errors,ACTIVE_REGISTRY_STATUSES.has(task?.status),`${id}: active-only registry cannot contain status ${task?.status}`);
    add(errors,DEPENDENCIES.has(task?.dependency),`${id}: invalid dependency ${task?.dependency}`);
    add(errors,EXECUTION_MODES.has(task?.execution_mode),`${id}: execution_mode must be STANDARD_CHAT_HIGH or WORK_MODE`);
    add(errors,REFRESH_MODES.has(task?.refresh_mode),`${id}: invalid refresh_mode ${task?.refresh_mode}`);
    if (task?.refresh_mode === "FULL_REFRESH") add(errors,typeof task.refresh_reason === "string" && task.refresh_reason.trim().length > 0,`${id}: FULL_REFRESH requires refresh_reason`);
    if (task?.refresh_mode === "BOUNDED_REMEDIATION_REFRESH") add(errors,typeof task.refresh_reason === "string" && task.refresh_reason.trim().length > 0,`${id}: BOUNDED_REMEDIATION_REFRESH requires refresh_reason`);
    add(errors,task?.merge_authority === "Manager",`${id}: merge_authority must be Manager`);
    add(errors,BLOCKER_TYPES.has(task?.blocker_type),`${id}: invalid blocker_type ${task?.blocker_type}`);
    add(errors,typeof task?.user_action_required === "boolean",`${id}: user_action_required must be boolean`);
    add(errors,Array.isArray(task?.blocked_on_tasks),`${id}: blocked_on_tasks must be an array`);
    add(errors,Array.isArray(task?.blocked_on),`${id}: blocked_on must be an array`);
    add(errors,Array.isArray(task?.allowed_path_prefixes) && task.allowed_path_prefixes.length > 0,`${id}: allowed_path_prefixes must be non-empty array`);
    add(errors,Array.isArray(task?.forbidden_path_prefixes),`${id}: forbidden_path_prefixes must be an array`);
    add(errors,typeof task?.audit_required === "boolean",`${id}: audit_required must be boolean`);
    add(errors,typeof task?.post_merge_canary_required === "boolean",`${id}: post_merge_canary_required must be boolean`);
    if (task?.closeout_evidence != null) {
      const closeout = task.closeout_evidence;
      add(errors,closeout && typeof closeout === "object" && !Array.isArray(closeout),`${id}: closeout_evidence must be an object`);
      if (closeout && typeof closeout === "object" && !Array.isArray(closeout)) {
        add(errors,closeout.manager_verdict === "ACCEPTED",`${id}: closeout_evidence.manager_verdict must be ACCEPTED`);
        add(errors,closeout.integration_verification === "PASS",`${id}: closeout_evidence.integration_verification must be PASS`);
        add(errors,closeout.master_verification === "PASS",`${id}: closeout_evidence.master_verification must be PASS`);
        add(errors,CLOSEOUT_AUDIT_VERDICTS.has(closeout.audit_verdict),`${id}: invalid closeout_evidence.audit_verdict`);
        add(errors,CLOSEOUT_CANARY_RESULTS.has(closeout.canary_verification),`${id}: invalid closeout_evidence.canary_verification`);
      }
    }
    add(errors,SHA_RE.test(task?.assignment_master_sha || ""),`${id}: assignment_master_sha must be full SHA`);
    add(errors,typeof task?.task_file === "string" && task.task_file.startsWith(".ai/manager/tasks/"),`${id}: task_file must be Manager task path`);
    add(errors,typeof task?.role_handoff === "string" && task.role_handoff.startsWith(".ai/"),`${id}: role_handoff must be .ai path`);

    if (["BLOCKED","REWORK_REQUIRED"].includes(task.status)) add(errors,task.blocker_type !== "NONE",`${id}: ${task.status} requires non-NONE blocker_type`);
    else if (task.status !== "WAITING_EXTERNAL_EVIDENCE") add(errors,task.blocker_type === "NONE",`${id}: blocker_type must be NONE while status is ${task.status}`);
    if (task.status === "WAITING_EXTERNAL_EVIDENCE") add(errors,["EXTERNAL_EVIDENCE","USER_ACTION","EXTERNAL_SERVICE"].includes(task.blocker_type),`${id}: WAITING_EXTERNAL_EVIDENCE requires external blocker type`);
    if (task.user_action_required) add(errors,["USER_ACTION","EXTERNAL_SERVICE","EXTERNAL_EVIDENCE"].includes(task.blocker_type),`${id}: user_action_required needs an external/user blocker type`);

    if (task.branch) add(errors,task.branch.startsWith(BRANCH_PREFIX[task.owner] || ""),`${id}: branch ${task.branch} does not match owner ${task.owner}`);
    if (task.pr != null) add(errors,Number.isInteger(task.pr) && task.pr > 0,`${id}: pr must be positive integer or null`);
    if (task.worker_checkpoint_sha != null) add(errors,SHA_RE.test(task.worker_checkpoint_sha),`${id}: worker_checkpoint_sha must be full SHA or null`);
    if (task.worker_slot != null) add(errors,typeof task.worker_slot === "string" && task.worker_slot.length > 0,`${id}: worker_slot must be string or null`);
    claimUnique(branches,task.branch,id,"branch"); claimUnique(prs,task.pr,id,"pr"); claimUnique(slots,task.worker_slot,id,"worker_slot");

    if (task.owner === "Auditor" && RUNNABLE_STATUSES.has(task.status)) {
      add(errors,TASK_ID_RE.test(task.audit_target_task || ""),`${id}: active Auditor requires audit_target_task`);
      add(errors,Number.isInteger(task.audit_target_pr) && task.audit_target_pr > 0,`${id}: active Auditor requires audit_target_pr`);
      add(errors,typeof task.audit_target_branch === "string" && task.audit_target_branch.length > 0,`${id}: active Auditor requires audit_target_branch`);
      add(errors,SHA_RE.test(task.audit_target_sha || ""),`${id}: active Auditor requires exact audit_target_sha`);
    }
    if (task.target_advancement) {
      add(errors,TARGET_ADVANCEMENT.has(task.target_advancement.classification),`${id}: invalid target_advancement classification`);
      add(errors,SHA_RE.test(task.target_advancement.checked_at_sha || ""),`${id}: target_advancement.checked_at_sha must be full SHA`);
    }
  }

  for (const task of registry?.tasks || []) for (const dep of task.blocked_on_tasks || []) {
    if (dep === task.task_id) errors.push(`${task.task_id}: cannot block on itself`);
    if (!ids.has(dep)) errors.push(`${task.task_id}: blocked_on_tasks references non-active ${dep}`);
  }
  const graph=new Map((registry?.tasks || []).map((task)=>[task.task_id,task.blocked_on_tasks || []]));
  const visiting=new Set(); const visited=new Set();
  function visit(id,trail=[]) {
    if (visiting.has(id)) { errors.push(`dependency cycle: ${[...trail,id].join(" -> ")}`); return; }
    if (visited.has(id)) return;
    visiting.add(id); for (const dep of graph.get(id) || []) if (graph.has(dep)) visit(dep,[...trail,id]); visiting.delete(id); visited.add(id);
  }
  for (const id of graph.keys()) visit(id);
  const tasks=registry?.tasks || [];
  for (let i=0;i<tasks.length;i+=1) for (let j=i+1;j<tasks.length;j+=1) {
    const a=tasks[i], b=tasks[j];
    if (!RUNNABLE_STATUSES.has(a.status) || !RUNNABLE_STATUSES.has(b.status) || explicitlySerializedHardPair(a,b)) continue;
    const overlap=effectiveWriteOverlap(a,b);
    if (overlap) errors.push(`${a.task_id}/${b.task_id}: unsafe parallel write overlap at ${overlap}; serialize or narrow scopes`);
  }
  return { errors,warnings };
}

export async function validateRegistryFiles(registry,rootDir=process.cwd()) {
  const errors=[];
  const dashboardTargets=new Map([[".ai/manager/HANDOFF.md",{ label:"Manager handoff", allowActivateNow:true }]]);
  for (const task of registry?.tasks || []) {
    for (const [label,rel] of [["task_file",task.task_file],["role_handoff",task.role_handoff]]) {
      if (!rel) continue; try { await access(path.join(rootDir,rel)); } catch { errors.push(`${task.task_id}: ${label} does not exist: ${rel}`); }
    }
    if (task.task_file) { try { const text=await readFile(path.join(rootDir,task.task_file),"utf8"); errors.push(...validateTaskSpecContract(task,text)); } catch {} }
    if (task.role_handoff && path.basename(task.role_handoff) !== "HANDOFF.md") {
      dashboardTargets.set(task.role_handoff,{ label:`${task.task_id} handoff`, allowActivateNow:task.owner === "Manager" });
    }
  }
  for (const [rel,options] of dashboardTargets) {
    try {
      const text=await readFile(path.join(rootDir,rel),"utf8");
      errors.push(...validateNextActivationDashboard(text,options));
    } catch {
      // Missing task-scoped handoffs are already reported above; Manager handoff existence is a repository invariant.
      if (rel === ".ai/manager/HANDOFF.md") errors.push("Manager handoff does not exist: .ai/manager/HANDOFF.md");
    }
  }
  return errors;
}

export function taskIdFromPullRequest(pr) {
  const text=`${pr?.title || ""}\n${pr?.body || ""}`;
  return text.match(/^Task-ID:\s*(TCW-(?:PW-)?\d{3})\s*$/im)?.[1] || text.match(/\bTCW-(?:PW-)?\d{3}\b/)?.[0] || null;
}

export function validateNextActivationDashboard(text,{ label="handoff", allowActivateNow=false }={}) {
  const errors=[];
  const section=String(text || "").match(/(?:^|\n)## Next Activation\s*\n([\s\S]*?)(?=\n##\s|$)/)?.[1] || "";
  if (!section) return [`${label}: missing ## Next Activation dashboard`];
  const rows=section.split(/\r?\n/)
    .filter((line)=>/^\|\s*\d+\s*\|/.test(line))
    .map((line)=>line.split("|").slice(1,-1).map((cell)=>cell.trim()));
  add(errors,rows.length === CANONICAL_NEXT_ACTIVATION_ROLES.length,`${label}: Next Activation must contain exactly six role rows`);
  for (let i=0;i<CANONICAL_NEXT_ACTIVATION_ROLES.length;i+=1) {
    add(errors,rows[i]?.[1] === CANONICAL_NEXT_ACTIVATION_ROLES[i],`${label}: Next Activation row ${i+1} must be ${CANONICAL_NEXT_ACTIVATION_ROLES[i]}`);
  }
  if (!allowActivateNow && rows.some((row)=>row[2] === "ACTIVATE NOW")) errors.push(`${label}: worker handoff cannot use ACTIVATE NOW`);
  return errors;
}

function supersedesPrNumbers(pr) {
  const text=`${pr?.title || ""}\n${pr?.body || ""}`;
  return [...text.matchAll(/^Supersedes-PR:\s*#?(\d+)\s*$/gim)].map((match)=>Number(match[1]));
}

export function detectDuplicateTaskPullRequests(prs) {
  const groups=new Map();
  for (const pr of prs || []) {
    const id=taskIdFromPullRequest(pr);
    if (!id) continue;
    const group=groups.get(id) || [];
    group.push(pr);
    groups.set(id,group);
  }
  const errors=[]; const warnings=[];
  for (const [id,group] of groups) {
    if (group.length < 2) continue;
    const byNumber=new Map(group.map((pr)=>[Number(pr.number),pr]));
    const edges=new Map([...byNumber.keys()].map((number)=>[number,[]]));
    const incoming=new Map([...byNumber.keys()].map((number)=>[number,0]));
    let unsafe=false;

    for (const pr of group) {
      const from=Number(pr.number);
      for (const target of supersedesPrNumbers(pr)) {
        if (target === from) {
          errors.push(`${id}: PR #${from} cannot supersede itself`);
          unsafe=true;
          continue;
        }
        if (!byNumber.has(target)) {
          errors.push(`${id}: PR #${from} has unsafe unknown Supersedes-PR #${target}`);
          unsafe=true;
          continue;
        }
        if (!edges.get(from).includes(target)) {
          edges.get(from).push(target);
          incoming.set(target,incoming.get(target)+1);
        }
      }
    }

    const visiting=new Set(); const visited=new Set();
    function visit(number,trail=[]) {
      if (visiting.has(number)) {
        errors.push(`${id}: supersession cycle detected: ${[...trail,number].map((n)=>`#${n}`).join(" -> ")}`);
        unsafe=true;
        return;
      }
      if (visited.has(number)) return;
      visiting.add(number);
      for (const next of edges.get(number) || []) visit(next,[...trail,number]);
      visiting.delete(number);
      visited.add(number);
    }
    for (const number of byNumber.keys()) visit(number);

    const survivors=[...byNumber.keys()].filter((number)=>incoming.get(number) === 0);
    if (survivors.length !== 1) {
      errors.push(`${id}: same-task open PRs require exactly one current survivor; found ${survivors.length}`);
      unsafe=true;
    }

    if (!unsafe && survivors.length === 1) {
      const covered=new Set(); const stack=[survivors[0]];
      while (stack.length) {
        const number=stack.pop();
        if (covered.has(number)) continue;
        covered.add(number);
        for (const next of edges.get(number) || []) stack.push(next);
      }
      if (covered.size !== byNumber.size) {
        const missing=[...byNumber.keys()].filter((number)=>!covered.has(number));
        errors.push(`${id}: supersession coverage from survivor #${survivors[0]} does not reach ${missing.map((n)=>`#${n}`).join(", ")}`);
        unsafe=true;
      }
    }

    if (!unsafe && survivors.length === 1) warnings.push(`${id}: multiple open PRs form one coherent supersession chain with survivor #${survivors[0]}; close superseded PRs promptly`);
  }
  return { errors,warnings };
}

function gitCommitCount(fromSha,targetRef,cwd=process.cwd()) {
  try {
    execFileSync("git",["cat-file","-e",`${fromSha}^{commit}`],{cwd,stdio:"ignore"});
    execFileSync("git",["cat-file","-e",`${targetRef}^{commit}`],{cwd,stdio:"ignore"});
    return Number(execFileSync("git",["rev-list","--count",`${fromSha}..${targetRef}`],{cwd,encoding:"utf8"}).trim());
  } catch { return null; }
}
export function checkAssignmentStaleness(registry,{rootDir=process.cwd(),threshold=3,targetRef="HEAD"}={}) {
  const errors=[]; const warnings=[];
  for (const task of registry?.tasks || []) {
    if (!ACTIVE_STALE_STATUSES.has(task.status)) continue;
    const count=gitCommitCount(task.assignment_master_sha,targetRef,rootDir);
    if (count === null) { warnings.push(`${task.task_id}: assignment drift unavailable; perform Fast Refresh manually`); continue; }
    if (count <= threshold) continue;
    if (!task.target_advancement) errors.push(`${task.task_id}: assignment is ${count} commits behind target; refresh/update or classify target advancement`);
    else warnings.push(`${task.task_id}: assignment is ${count} commits behind target; recheck ${task.target_advancement.classification} before merge`);
  }
  return { errors,warnings };
}

async function fetchOpenPullRequests(repository) {
  const headers={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
  if (process.env.GITHUB_TOKEN) headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
  const response=await fetch(`https://api.github.com/repos/${repository}/pulls?state=open&per_page=100`,{headers});
  if (!response.ok) throw new Error(`GitHub PR query failed HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const rootDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
  const registry=JSON.parse(await readFile(path.join(rootDir,".ai/shared/ACTIVE_TASKS.json"),"utf8"));
  const shape=validateRegistryShape(registry);
  const fileErrors=await validateRegistryFiles(registry,rootDir);
  const ciMode=process.argv.includes("--ci");
  const targetRef=process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "HEAD";
  const stale=ciMode ? checkAssignmentStaleness(registry,{rootDir,targetRef}) : {errors:[],warnings:[]};
  const errors=[...shape.errors,...fileErrors,...stale.errors]; const warnings=[...shape.warnings,...stale.warnings];
  if (ciMode && process.env.GITHUB_REPOSITORY) {
    try { const duplicate=detectDuplicateTaskPullRequests(await fetchOpenPullRequests(process.env.GITHUB_REPOSITORY)); errors.push(...duplicate.errors); warnings.push(...duplicate.warnings); }
    catch (error) { warnings.push(`Open-PR duplicate check unavailable: ${error.message}`); }
  }
  console.log(`Workflow V3.2 audit · ${registry.tasks.length} active task${registry.tasks.length === 1 ? "" : "s"}`);
  for (const warning of warnings) console.warn(`WARN ${warning}`);
  for (const error of errors) console.error(`ERROR ${error}`);
  if (errors.length) process.exitCode=1; else console.log("PASS workflow registry/state/collision checks.");
}

const invoked=process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) await main();
