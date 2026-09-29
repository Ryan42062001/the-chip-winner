from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
REQUIRED = [
    ".ai/PROJECT.md",
    ".ai/ARCHITECTURE.md",
    ".ai/REPO_MAP.md",
    ".ai/DECISIONS.md",
    ".ai/CURRENT_PHASE.md",
    "docs/WORKFLOW.md",
    "docs/workflow/PHASE_TEMPLATE.md",
    "docs/roadmap.md",
    "docs/security.md",
]
STATES = [
    "PLANNED","BUILDING","PREVIEW_READY","PUNCH_LIST",
    "FREEZE_READY","AUDITING","REMEDIATING","CLOSED",
]
ACTIVE_SECTIONS = [
    "Objective","Scope","Non-goals","Ordered implementation objectives",
    "Acceptance criteria","Required automated validation",
    "Human preview requirements","Owner-only verification",
    "Exit criteria","Stop conditions",
]
CLOSED_SECTIONS = ["Identity","Closure evidence","Stop conditions","Phase metrics"]
CLOSED_FIELDS = [
    "Final immutable audited target",
    "Merge commit / canonical master at merge",
    "Post-merge FAST CI",
    "Closure Sync FAST CI",
    "Final audit disposition",
    "Next planned phase",
]

missing=[p for p in REQUIRED if not (ROOT/p).is_file()]
assert not missing, f"Missing required files: {missing}"

phase=(ROOT/".ai/CURRENT_PHASE.md").read_text(encoding="utf-8")
match=re.search(r"^State: ([A-Z_]+)$",phase,re.MULTILINE)
assert match,"CURRENT_PHASE.md must contain 'State: <STATE>'"
state=match.group(1)
assert state in STATES,f"Invalid phase state: {state}"
assert re.search(r"^- Risk: (LOW|MEDIUM|HIGH)$",phase,re.MULTILINE),"Invalid or missing risk tier"

if state=="CLOSED":
    ms=[s for s in CLOSED_SECTIONS if f"## {s}" not in phase]
    assert not ms,f"CLOSED phase missing sections: {ms}"
    mf=[f for f in CLOSED_FIELDS if not re.search(rf"^- {re.escape(f)}:",phase,re.MULTILINE)]
    assert not mf,f"CLOSED phase missing evidence fields: {mf}"
else:
    ms=[s for s in ACTIVE_SECTIONS if f"## {s}" not in phase]
    assert not ms,f"Active phase missing sections: {ms}"

active_ai={
    str(p.relative_to(ROOT)).replace("\\","/")
    for p in (ROOT/".ai").rglob("*") if p.is_file()
}
allowed={p for p in REQUIRED if p.startswith(".ai/")}
assert active_ai==allowed,(
    "Unexpected active .ai files; retired workflow evidence belongs under docs/history: "
    f"{sorted(active_ai-allowed)}"
)
print(f"Speed Workflow V2.1 validation PASS ({state})")
