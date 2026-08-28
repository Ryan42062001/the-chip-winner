import test from "node:test";
import assert from "node:assert/strict";
import { renderTeamScheduleCard } from "../src/ui/season-schedule.js";

test("season schedule UI escapes source values and shows every coverage warning", () => {
  const html = renderTeamScheduleCard({
    rows: [{ week: 15, opponentId: "bad", opponentName: "<Rival>", homeAway: "home", status: "upcoming", teamScore: null, opponentScore: null }],
    coverage: { requestedWeeks: 3, reportedWeeks: 1, missingWeeks: [16], ambiguousWeeks: [15] },
    methodology: "ESPN only"
  });
  assert.match(html, /&lt;Rival&gt;/);
  assert.doesNotMatch(html, /<Rival>/);
  assert.match(html, /Missing ESPN matchup records for Week 16/);
  assert.match(html, /Multiple ESPN matchup records were reported for Week 15/);
});

test("season schedule UI explains an empty selected horizon", () => {
  const html = renderTeamScheduleCard({ rows: [], coverage: { requestedWeeks: 0, reportedWeeks: 0, missingWeeks: [], ambiguousWeeks: [] }, methodology: "ESPN only" }, { hasImportedWeeks: true, hasSelectedWeeks: false });
  assert.match(html, /Select at least one planning week/);
});
