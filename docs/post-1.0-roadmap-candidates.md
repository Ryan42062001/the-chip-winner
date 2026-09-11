# Post-1.0 Roadmap Discovery Candidates

Status: DISCOVERY INPUT ONLY — NOT AN AUTHORIZED SUCCESSOR MILESTONE

The Chip Winner remains focused on completing Release 1.0 field validation. This document records a proposed sequence of product improvements to evaluate after the trustworthy read-only foundation closes.

The sequence is intentionally value-first: improve how existing intelligence is synthesized before adding increasingly complex new data and probabilistic models.

## Candidate 1 — GM Action Plan / Recommendation Synthesis

### Product outcome

A manager should be able to open The Chip Winner and immediately answer:

> What should I do with my fantasy team today, and why?

The product already has lineup optimization, start/sit comparison, waiver simulation, IR intelligence, season planning, change detection, freshness, and alerts. The GM Action Plan would synthesize those existing capabilities into one prioritized decision surface instead of forcing the user to inspect each tool separately.

### Example output classes

- START / SIT
- ADD / DROP
- IR move
- HOLD
- MONITOR
- FLEX-positioning or late-swap flexibility note
- NO ACTION NEEDED

Each action should expose:
- expected benefit when supported;
- time horizon;
- source freshness;
- confidence/limitations;
- legality or lock constraints;
- why the action outranks alternatives;
- what changed since the prior refresh when relevant.

### Guardrails

- Do not create a hidden composite truth score merely to rank cards.
- Source facts and existing recommendation outputs remain inspectable.
- Missing or conflicting evidence may lower priority or withhold an action.
- A recommendation that requires unsupported future data must remain unavailable.

### Why first

This has high weekly value while reusing the strongest capabilities already built. It improves the product identity from a collection of fantasy tools into an assistant that prioritizes the manager's next decisions.

---

## Candidate 2 — Trade Analyzer

### Product outcome

Evaluate a proposed trade through roster consequences rather than a single opaque trade-value number.

### Suggested analysis dimensions

- immediate starting-lineup impact;
- selected-horizon and rest-of-season impact when complete compatible data exists;
- positional depth and replaceability;
- replacement-level ESPN player-pool context;
- bye-week effects;
- fantasy-playoff window effects;
- open roster spots and legal roster configuration;
- projection-source disagreement;
- uncertainty and missing coverage;
- short-term versus long-term team objective.

### Presentation principle

Avoid a single "you win 73-68" grade.

Prefer conclusions such as:
- improves immediate lineup but weakens playoff depth;
- benefits a strong team optimizing for playoffs;
- creates too much positional fragility for a team that needs weekly stability.

If opponent impact is shown, it should be manager-neutral and based only on connected-league facts and approved projection/model inputs.

---

## Candidate 3 — Recommendation Confidence + League-Market Intelligence

### Recommendation confidence

Build a reproducible confidence layer from evidence such as:
- source freshness;
- compatible-source agreement/disagreement;
- projection coverage;
- injury uncertainty;
- ESPN snapshot freshness;
- kickoff proximity;
- identity certainty;
- future-week coverage.

Confidence must remain distinct from projected advantage and must not be labeled as win probability unless a calibrated model exists.

### League-market intelligence

Make recommendations more specific to the connected league by evaluating approved facts such as:
- opponent roster needs;
- positional depth across teams;
- scarcity in the current ESPN free-agent/waiver pool;
- recent transaction patterns;
- bye-week pressure;
- standings/playoff leverage where supported;
- waiver priority, FAAB, or acquisition context only when ESPN or another approved source actually supplies it.

Potential product question:

> Is this player likely to remain available if I wait?

Any survival/availability estimate would require an explicit model and evidence. Raw manager behavior must not be converted into unsupported certainty.

---

## Candidate 4 — Decision-Impacting Injury/News Intelligence + Notifications

### Product outcome

Do not become a generic football-news feed. Surface external information only when it materially changes a fantasy decision.

Examples:
- a starter's practice/injury update changes the recommended lineup;
- a backup becomes waiver-relevant after a role change;
- a late injury suggests moving a player into FLEX for optionality;
- an IR/availability change alters a legal transaction path;
- a material status update changes a trade or season-planning conclusion.

### Source gate

Before implementation, R&D must verify:
- source authority and licensing/usage rights;
- update frequency;
- player identity strategy;
- official-status versus reporting/commentary distinctions;
- freshness thresholds;
- contradiction handling.

### Notification principles

- prioritize decision impact, urgency, and kickoff proximity;
- do not claim real-time monitoring when no approved monitoring path exists;
- keep notifications attributable to the source condition and recommendation change;
- avoid notification spam for news that does not change an actionable decision.

---

## Candidate 5 — Playoff Probability / Championship-Path Modeling

### Product outcome

Move beyond raw future projected totals only after a calibrated probabilistic model is defensible.

Potential outputs:
- playoff qualification probability;
- first-round bye probability when league format supports it;
- championship probability;
- effect of a waiver or trade on those probabilities;
- schedule and roster fragility sensitivity.

### Required model inputs may include

- current standings and tiebreak rules;
- remaining fantasy schedule;
- weekly legal lineup strength distributions;
- scoring variance/distributions rather than only point estimates;
- league playoff structure;
- available projection uncertainty;
- injuries only through approved and appropriately uncertain inputs.

### Hard gate

Do not expose user-facing probabilities until:
- methodology is documented;
- deterministic inputs are separated from model assumptions;
- calibration/evaluation criteria exist;
- realistic historical/simulated evaluation supports the claims;
- independent audit verifies that probabilities are not falsely precise.

---

## Later Gate — Confirmed ESPN Write Actions

The current read-only boundary remains a deliberate product strength.

Possible future actions include:
- submit lineup changes;
- add/drop players;
- submit waiver claims;
- propose/accept trades when supported.

These should remain later than the decision-intelligence roadmap above and require a separately approved milestone with:
- explicit preview;
- immediate user confirmation;
- fresh ESPN revalidation;
- changed-state and lock detection;
- clear success/failure receipts;
- no background or automatic transactions.

## Proposed discovery sequence

1. Complete Release 1.0 field validation.
2. Run formal Roadmap Discovery using real Release 1.0 usage and field evidence.
3. Evaluate GM Action Plan first because it leverages existing capabilities and has high weekly value.
4. Evaluate Trade Analyzer as the next major missing in-season decision engine.
5. Evaluate confidence and league-market intelligence together because both improve recommendation quality across multiple surfaces.
6. Add decision-impacting news/notifications only after trustworthy source feasibility is established.
7. Pursue playoff/championship probability only after calibrated-model prerequisites exist.
8. Keep ESPN write actions separate and later unless the Manager explicitly approves a different future direction from evidence.

A valid Roadmap Discovery outcome remains that one or more candidates are deferred or that no successor milestone is justified.
