import test from "node:test";
import assert from "node:assert/strict";
import { renderExternalProjectionDetail } from "../src/ui/external-projection-detail.js";

const snapshot = { currentWeek: 1, league: { season: 2026, scoringType: "PPR" } };
const set = { provider: "FantasyPros manual CSV", scoringFormat: "PPR", season: 2026, capturedAt: "2026-08-28T00:00:00Z", projections: [{ providerPlayerId: "fp-1", week: 1, points: 18.4 }] };

test("player detail keeps mapped external values sourced and missing mappings explicit", () => {
  const ready = renderExternalProjectionDetail(set, new Map([["fp-1", "espn-1"]]), snapshot, "espn-1");
  assert.match(ready.grid, /18\.4 pts/); assert.match(ready.source, /FantasyPros manual CSV/); assert.match(ready.source, /PPR/);
  assert.match(renderExternalProjectionDetail(set, new Map(), snapshot, "espn-1").grid, /Unmapped/);
  assert.match(renderExternalProjectionDetail(null, null, snapshot, "espn-1").grid, /Not imported/);
});
