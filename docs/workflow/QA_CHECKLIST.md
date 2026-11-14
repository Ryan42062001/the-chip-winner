# The Chip Winner — independent synthetic browser QA checklist

Run only on an **authorized mock/synthetic Preview** with verified commit SHA; no real ESPN authentication, user league data or provider writes. Each applicable check = PASS / FAIL / NOT RUN.

| Check | Synthetic / mock test | Expected |
| --- | --- | --- |
| TCW-Q01 | Load mock league dashboard and navigation | Clearly identified league fixture, no blank/broken sections |
| TCW-Q02 | Render Trade Winner/Trade Analyzer with supplied fixture | Correct players/picks, deterministic inputs and transparent recommendation assumptions |
| TCW-Q03 | Exercise Trade Value Advantage view if implemented | Advantage explains source, timestamp/availability; never invent source-derived values |
| TCW-Q04 | Check source provenance and conflict/unavailable states | ESPN league facts separated from external projections or local fallbacks; no unsupported certainty |
| TCW-Q05 | Review Season Plan and playoff fixture | Correct fixture-based team/round logic; missing evidence labeled unavailable |
| TCW-Q06 | Test missing, malformed and partial fixture inputs | No fabricated player/bye/injury/projection facts; safe fallback |
| TCW-Q07 | Reload and switch screens after browser-local settings | Preference/state preserved only as documented; never modifies ESPN |
| TCW-Q08 | Tablet and mobile UI | Cards, tables, forms and labels legible with no overlap |
| TCW-Q09 | Keyboard navigation, warnings and error copy | Focus visible, informative and privacy-safe |
| TCW-Q10 | Audit UI for live ESPN writes or private-account exposure | No write interactions or secret/private session data; STOP if any observed |

Do not count owner-operated 11/11 field validation as reproduced by Cloud Browser; those are distinct historical evidence. Live ESPN-only cases are NOT RUN here.
