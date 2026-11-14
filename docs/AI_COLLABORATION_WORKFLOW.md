# The Chip Winner — Claude Code + ChatGPT Work collaboration

**Owner-directed role allocation proposed 2026-11-13.** Effective only after reviewed, Owner-authorized governance merge. Use current `AGENTS.md`, `docs/WORKFLOW.md`, `docs/PROGRESS_FIRST_POLICY.md`, `.ai/CURRENT_PHASE.md`, `.ai/DECISIONS.md`, and verified repository evidence. If AGENTS refers to an unavailable historical `.ai/shared/*` file, do not invent its content; identify the discrepancy and use present canonical sources. The existing protected `master`, phase/freeze rules, provider/PII boundaries, audit and deployment controls remain unchanged.

## Roles

| Role | Default tool | Duties and authority |
| --- | --- | --- |
| Product Owner | Ryan | Prioritize scope, authorize protected merges and separate production deployment, provider/ESPN private session access, any real data |
| Primary Builder | **Claude Code** | Single phase branch source owner, implements feature/tests, CI and QA bug fixes; no simultaneous second builder on branch |
| Fallback Builder | **ChatGPT Codex**, fresh coding session | Only on explicit non-overlapping handoff when Claude credits unavailable; reverify SHA and branch before changes |
| Browser QA | **ChatGPT Work Cloud Browser** | Test only authorized synthetic/mock web Preview against `docs/workflow/QA_CHECKLIST.md`; issue reproducible findings; no code or provider interaction |
| Independent Auditor | **Fresh AI session different from Builder**, ChatGPT preferred for high-risk ESPN/privacy/financial recommendation logic | Risk-based exact-head changed-scope audit; independent evidence, never self-approval |
| Manager | ChatGPT regular Chat | PR/CI/issue oversight, evidence reconciliation and recommendations; Ryan's release decision retained |

Old "regular Chat as Builder" and "Work only as Super Builder" wording is superseded **only by the approved role allocation**. Direct desktop control, signed-in ESPN or source-development use of Work requires separate Ryan authorization.

## Work cycle

1. Ryan defines a phase. Claude works on its sole implementation branch/PR, runs real tests/FAST and required exact-head FULL evidence. Never push or edit protected `master` directly.
2. On a **verified, owner-authorized synthetic Preview** (not live ESPN), Work tests affected UI and regressions; missing Preview or unknown SHA means NOT RUN, not PASS. Work never assumes cloud browser access to Ryan's localhost.
3. Work files `qa-finding` issues per defect with exact target SHA, reproducible fixture, risk, expected/actual and sanitized evidence. Claude repairs; Work retests on new SHA.
4. Fresh independent reviewer checks frozen PR SHA and domain-specific calculation/provider boundaries. BLOCKER/CRITICAL/HIGH stays HOLD until targeted test/re-review; MEDIUM/LOW/NIT go to final-audit backlog.
5. Ryan explicitly authorizes protected merge and separately production/GitHub Pages release. Whole-product audit and all original field-validation requirements remain; no fake PASS.

## Chip Winner privacy and provider constraints

- ESPN-only **read-only** league assistant. Work may not sign in to Ryan's ESPN account, use ESPN cookies, invoke owner browser extensions, fetch real league snapshots, submit trades/lineup moves or write ESPN state under this QA policy.
- Do not use `@Computer` or `@Chrome` connected to Ryan's personal signed-in browser. Use approved Cloud Browser with fully synthetic fixtures or a sanctioned provider-free preview; live owner ESPN field validation stays owner-operated.
- Keep ESPN league facts, owner-supplied inputs, external trade-value sources, FantasyPros evidence, probabilistic/derived recommendations and browser-local fallbacks separately attributed; never manufacture projections, league data or completed field checks.
- Test Trade Winner/Trade Value Advantage and Season Plan as available, but never represent mock output as actual live league state. Do not copy league identifiers, auth tokens or private user data to issues/screenshots.
- Preview inaccessible, login required or no synthetic fixture? Mark the case NOT RUN and give Ryan a bounded manual task; do not use Production as fallback.

**Work activation:** `docs/workflow/WORK_MODE_PROMPT.md` and **cases:** `docs/workflow/QA_CHECKLIST.md`.
