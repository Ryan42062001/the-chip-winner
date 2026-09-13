# TCW-018 — FV-ESPN-05 Field Evidence Intake

Evidence source: three user-supplied real deployed screen recordings captured across one naturally occurring 1:00 PM ESPN game-lock transition. The recordings themselves are not committed.

## Privacy-safe observed facts

### Pre-lock state
- ESPN Fantasy My Team showed James Cook III in the starting RB slot with a `MOVE` control still available.
- ESPN showed Cook's game as `Sun 1:00 PM`; Ashton Jeanty's game remained later at `Sun 4:25 PM`.
- The Chip Winner completed a deployed ESPN refresh before the lock window and showed a live ESPN snapshot.
- Pre-lock Lineup Lab compared James Cook III (15.9) with Ashton Jeanty (17.9) and displayed a projection lean toward Jeanty while the overall optimizer did not identify a lineup change clearing its action threshold.

### Real lock transition
- After kickoff, ESPN Fantasy showed James Cook III in an active game state (`0-0, 14:55 1st`) with no `MOVE` control on his row.
- Other 1:00 PM starters were likewise visibly in active-game states while later-game players retained `MOVE` controls.
- No roster transaction or simulated lock state was used to create the observation.

### Post-lock deployed refresh
- An initial post-lock Refresh ESPN attempt visibly entered the retained-snapshot failure state (`Last valid ESPN snapshot · refresh failed`).
- A follow-up Refresh ESPN completed successfully and the persistent source label returned to `Live ESPN snapshot`.
- On the successful post-lock snapshot, Overview showed locked-player checklist entries and current roster state without falling back to sample/demo data.
- Post-lock Lineup Lab explicitly reported: `7 roster locks respected because ESPN reported a lock or kickoff passed.`
- The optimizer's top-level result reported a 0.0-point edge below the action threshold and `no change is recommended`.
- The two-player comparison control still allowed James Cook III vs Ashton Jeanty to be viewed and still displayed the projection values 15.9 vs 17.9 with a projection lean toward Jeanty.
- The same comparison also continued to show the separate FantasyPros weekly source disagreement rather than collapsing sources together.
- Waivers remained usable after the successful post-lock refresh and showed no priority move in the observed state.

## Manager intake classification

Observed real state: genuine unlocked -> locked ESPN transition with a successful post-lock deployed refresh after one failed refresh attempt.

The key audit question is intentionally unresolved by Manager: the lineup optimizer explicitly respected seven locks and returned no actionable change, while the generic two-player comparison surface still rendered Cook-vs-Jeanty projection guidance after Cook had locked. Independent Auditor / QA must determine whether the prior advice was sufficiently revalidated/obsoleted under the FV-ESPN-05 contract or whether the surviving comparison constitutes stale actionable guidance.

Manager has not marked `FV-ESPN-05` passed. Independent Auditor verdict is required before any field-registry mutation.
