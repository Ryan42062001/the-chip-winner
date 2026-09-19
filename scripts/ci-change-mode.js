import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SHA_RE = /^[0-9a-f]{40}$/i;
const ALLOWED_STATUSES = new Set(["A", "M", "D"]);

export function normalizeRepoPath(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replaceAll("\\", "/").trim();
  if (!normalized || normalized.startsWith("/") || normalized.includes("\0")) return null;
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  return normalized;
}

export function isDocumentationPath(value) {
  const normalized = normalizeRepoPath(value);
  if (!normalized) return false;
  if (/^[^/]+\.md$/.test(normalized)) return true;
  if (/^\.ai\/.+\.md$/.test(normalized)) return true;
  if (/^docs\/.+\.md$/.test(normalized)) return true;
  return false;
}

export function parseNameStatus(diffText) {
  if (typeof diffText !== "string" || !diffText.trim()) return { ok: false, reason: "empty-change-evidence", records: [] };
  const records = [];
  for (const rawLine of diffText.split(/\r?\n/)) {
    if (!rawLine) continue;
    const parts = rawLine.split("\t");
    if (parts.length !== 2) return { ok: false, reason: "malformed-change-evidence", records: [] };
    const [status, rawPath] = parts;
    if (!ALLOWED_STATUSES.has(status)) return { ok: false, reason: `unsupported-change-status:${status || "empty"}`, records: [] };
    const repoPath = normalizeRepoPath(rawPath);
    if (!repoPath) return { ok: false, reason: "invalid-change-path", records: [] };
    records.push({ status, path: repoPath });
  }
  if (!records.length) return { ok: false, reason: "empty-change-evidence", records: [] };
  return { ok: true, reason: "parsed", records };
}

export function classifyRecords(records) {
  if (!Array.isArray(records) || records.length === 0) return { mode: "FULL", reason: "empty-change-evidence", records: [] };
  for (const record of records) {
    if (!record || !ALLOWED_STATUSES.has(record.status)) return { mode: "FULL", reason: "unsupported-change-status", records };
    if (!isDocumentationPath(record.path)) return { mode: "FULL", reason: `non-doc-change:${record.status}:${record.path}`, records };
  }
  return { mode: "DOCS_ONLY", reason: "all-changes-match-doc-allowlist", records };
}

export function selectDiffRange({ eventName, action, baseSha, headSha, eventBefore, eventAfter }) {
  if (eventName === "workflow_dispatch") return { forcedMode: "FULL", reason: "manual-dispatch", scope: "manual-dispatch", startSha: null, endSha: null, requiresPredecessor: false, predecessorSha: null };
  if (eventName !== "pull_request") return { forcedMode: "FULL", reason: `non-pr-event:${eventName || "empty"}`, scope: "non-pr-event", startSha: null, endSha: null, requiresPredecessor: false, predecessorSha: null };
  if (!SHA_RE.test(baseSha ?? "") || !SHA_RE.test(headSha ?? "")) return { forcedMode: "FULL", reason: "missing-or-invalid-pr-sha", scope: "invalid-pr-sha", startSha: null, endSha: null, requiresPredecessor: false, predecessorSha: null };
  if (action === "synchronize") {
    if (!SHA_RE.test(eventBefore ?? "") || !SHA_RE.test(eventAfter ?? "")) return { forcedMode: "FULL", reason: "missing-or-invalid-synchronize-sha", scope: "synchronize-invalid", startSha: null, endSha: null, requiresPredecessor: false, predecessorSha: null };
    if (eventAfter.toLowerCase() !== headSha.toLowerCase()) return { forcedMode: "FULL", reason: "synchronize-after-head-mismatch", scope: "synchronize-invalid", startSha: eventBefore, endSha: eventAfter, requiresPredecessor: false, predecessorSha: null };
    return { forcedMode: null, reason: null, scope: "synchronize-delta", startSha: eventBefore, endSha: eventAfter, requiresPredecessor: true, predecessorSha: eventBefore };
  }
  if (action === "opened" || action === "reopened") return { forcedMode: null, reason: null, scope: "cumulative-pr", startSha: baseSha, endSha: headSha, requiresPredecessor: false, predecessorSha: null };
  return { forcedMode: "FULL", reason: `unsupported-pr-action:${action || "empty"}`, scope: "unsupported-pr-action", startSha: null, endSha: null, requiresPredecessor: false, predecessorSha: null };
}

function sanitizeReason(value) { return String(value).replace(/[\r\n\t]+/g, " ").slice(0, 240); }

export function classifyEvent({ eventName, action = "", baseSha, headSha, eventBefore = "", eventAfter = "", diffText, diffError = null }) {
  const range = selectDiffRange({ eventName, action, baseSha, headSha, eventBefore, eventAfter });
  if (range.forcedMode) return { mode: range.forcedMode, reason: range.reason, records: [], ...range };
  if (diffError) return { ...range, mode: "FULL", reason: `classifier-error:${sanitizeReason(diffError)}`, records: [], requiresPredecessor: false, predecessorSha: null };
  const parsed = parseNameStatus(diffText);
  if (!parsed.ok) return { ...range, mode: "FULL", reason: parsed.reason, records: parsed.records, requiresPredecessor: false, predecessorSha: null };
  const classified = classifyRecords(parsed.records);
  return { ...range, ...classified, requiresPredecessor: classified.mode === "DOCS_ONLY" && range.requiresPredecessor, predecessorSha: classified.mode === "DOCS_ONLY" && range.requiresPredecessor ? range.predecessorSha : null };
}

export function selectSuccessfulPredecessorRun(runs, { predecessorSha, prNumber, workflowName = "Deploy website" }) {
  if (!Array.isArray(runs) || !SHA_RE.test(predecessorSha ?? "")) return null;
  const expectedPr = Number(prNumber);
  if (!Number.isInteger(expectedPr) || expectedPr <= 0) return null;
  const matches = runs.filter((run) => run?.name === workflowName && run?.event === "pull_request" && run?.status === "completed" && run?.conclusion === "success" && String(run?.head_sha ?? "").toLowerCase() === predecessorSha.toLowerCase() && Array.isArray(run?.pull_requests) && run.pull_requests.some((pr) => Number(pr?.number) === expectedPr));
  matches.sort((a, b) => Number(b.run_number ?? 0) - Number(a.run_number ?? 0));
  return matches[0] ?? null;
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeGithubOutput(name, value) { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value ?? "").replace(/[\r\n]+/g, " ")}\n`, "utf8"); }
function appendSummary(lines) { if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`, "utf8"); }
function getGitDiff(startSha, endSha) {
  const result = spawnSync("git", ["diff", "--no-renames", "--name-status", startSha, endSha], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.error) return { diffText: "", diffError: result.error.message };
  if (result.status !== 0) return { diffText: result.stdout ?? "", diffError: `git-diff-exit-${result.status}:${sanitizeReason(result.stderr ?? "")}` };
  return { diffText: result.stdout ?? "", diffError: null };
}

async function verifyPredecessor() {
  const evidenceDir = process.env.CI_EVIDENCE_DIR || "ci-evidence";
  ensureDir(evidenceDir);
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const predecessorSha = process.env.CI_PREDECESSOR_SHA ?? "";
  const prNumber = process.env.CI_PR_NUMBER ?? "";
  const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
  const token = process.env.GITHUB_TOKEN ?? "";
  if (!repository || !SHA_RE.test(predecessorSha) || !token) throw new Error("missing predecessor verification inputs");
  const url = new URL(`/repos/${repository}/actions/workflows/deploy-pages.yml/runs`, apiUrl);
  url.searchParams.set("head_sha", predecessorSha);
  url.searchParams.set("event", "pull_request");
  url.searchParams.set("status", "completed");
  url.searchParams.set("per_page", "100");
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" } });
  if (!response.ok) throw new Error(`predecessor API HTTP ${response.status}`);
  const payload = await response.json();
  const selected = selectSuccessfulPredecessorRun(payload?.workflow_runs, { predecessorSha, prNumber });
  if (!selected) throw new Error("no successful predecessor Deploy website run for same PR/head");
  const evidence = { predecessorSha, prNumber: Number(prNumber), workflowName: "Deploy website", runId: selected.id, runNumber: selected.run_number, conclusion: selected.conclusion, htmlUrl: selected.html_url ?? null };
  fs.writeFileSync(path.join(evidenceDir, "predecessor-continuity.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  writeGithubOutput("verified", "true");
  writeGithubOutput("run_id", selected.id);
  appendSummary(["", "## Predecessor validation continuity", "", `- Predecessor SHA: \`${predecessorSha}\``, `- Successful prior Deploy website run: #${selected.run_number} / \`${selected.id}\``]);
  console.log(`Predecessor continuity PASS: run #${selected.run_number} / ${selected.id}`);
}

function classifyMain() {
  const evidenceDir = process.env.CI_EVIDENCE_DIR || "ci-evidence";
  ensureDir(evidenceDir);
  const eventName = process.env.GITHUB_EVENT_NAME ?? "";
  const action = process.env.CI_PR_ACTION ?? "";
  const baseSha = process.env.CI_BASE_SHA ?? "";
  const headSha = process.env.CI_HEAD_SHA ?? "";
  const eventBefore = process.env.CI_EVENT_BEFORE ?? "";
  const eventAfter = process.env.CI_EVENT_AFTER ?? "";
  const range = selectDiffRange({ eventName, action, baseSha, headSha, eventBefore, eventAfter });
  let diffText = ""; let diffError = null;
  if (!range.forcedMode && range.startSha && range.endSha) ({ diffText, diffError } = getGitDiff(range.startSha, range.endSha));
  const result = classifyEvent({ eventName, action, baseSha, headSha, eventBefore, eventAfter, diffText, diffError });
  const changedLines = result.records.length ? result.records.map((record) => `${record.status}\t${record.path}`) : ["# no parsed PR change records"];
  fs.writeFileSync(path.join(evidenceDir, "changed-paths.tsv"), `${changedLines.join("\n")}\n`, "utf8");
  const evidence = { mode: result.mode, reason: result.reason, eventName, action: action || null, scope: result.scope, classificationStartSha: result.startSha, classificationEndSha: result.endSha, requiresPredecessor: result.requiresPredecessor, predecessorSha: result.predecessorSha, repository: process.env.GITHUB_REPOSITORY || null, prNumber: process.env.CI_PR_NUMBER || null, baseSha: baseSha || null, headSha: headSha || null, testedSha: process.env.GITHUB_SHA || null, runId: process.env.GITHUB_RUN_ID || null, runNumber: process.env.GITHUB_RUN_NUMBER || null, runAttempt: process.env.GITHUB_RUN_ATTEMPT || null, job: "test" };
  fs.writeFileSync(path.join(evidenceDir, "classification.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  for (const [name, value] of Object.entries({ mode: result.mode, reason: result.reason, scope: result.scope, start_sha: result.startSha ?? "", end_sha: result.endSha ?? "", requires_predecessor: result.requiresPredecessor ? "true" : "false", predecessor_sha: result.predecessorSha ?? "" })) writeGithubOutput(name, value);
  appendSummary(["## CI change classification", "", `- Mode: **${result.mode}**`, `- Reason: \`${result.reason}\``, `- Scope: \`${result.scope}\``, `- Range: \`${result.startSha || "n/a"} -> ${result.endSha || "n/a"}\``, `- Requires predecessor: \`${result.requiresPredecessor}\``]);
  console.log(`CI mode: ${result.mode}; reason=${result.reason}; scope=${result.scope}`);
  for (const line of changedLines) console.log(line);
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  try {
    if (process.argv.includes("--verify-predecessor")) await verifyPredecessor();
    else classifyMain();
  } catch (error) {
    const evidenceDir = process.env.CI_EVIDENCE_DIR || "ci-evidence";
    try { ensureDir(evidenceDir); fs.writeFileSync(path.join(evidenceDir, process.argv.includes("--verify-predecessor") ? "predecessor-continuity-error.txt" : "classifier-fatal-error.txt"), `${sanitizeReason(error?.stack ?? error)}\n`, "utf8"); } catch {}
    console.error(error);
    process.exit(1);
  }
}
