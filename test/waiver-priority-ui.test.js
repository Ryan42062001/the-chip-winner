import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const entry = readFileSync(new URL("../src/ui/section-renderer.js", import.meta.url), "utf8");
const priority = readFileSync(new URL("../src/ui/section-renderer-priority.js", import.meta.url), "utf8");
const base = readFileSync(new URL("../src/ui/section-renderer-base.js", import.meta.url), "utf8");

test("Waiver Wire routes through the priority wrapper while retaining the established renderer as the base", () => {
  assert.match(entry, /section-renderer-priority\.js/);
  assert.match(priority, /section-renderer-base\.js/);
  assert.match(base, /function renderWaivers\(\)/);
  assert.match(base, /IR-ASSISTED ADD/);
});

test("waiver priority UI exposes factor bands without presenting a hidden score", () => {
  assert.match(priority, /PRIORITY BOARD · TRANSPARENT MULTI-FACTOR/);
  assert.match(priority, /No weighted score/);
  assert.match(priority, /Priority band/);
  assert.match(priority, /This week/);
  assert.match(priority, /Selected future weeks/);
  assert.match(priority, /Replacement value/);
  assert.match(priority, /depth now/);
  assert.match(priority, /Roster preservation/);
  assert.doesNotMatch(priority, /weightedScore/);
});

test("waiver priority UI preserves missing future evidence instead of presenting it as zero", () => {
  assert.match(priority, /missing future inputs are not scored as zero/);
  assert.match(priority, /Blocked by coverage/);
  assert.match(priority, /Unavailable/);
});

test("waiver priority UI clearly distinguishes future-only stashes from current-week waiver help", () => {
  assert.match(priority, /FUTURE STASH · ADD \/ DROP/);
  assert.match(priority, /HELPS NOW · ADD \/ DROP/);
  assert.match(priority, /Future-only stashes require complete selected-week coverage/);
});

test("waiver priority UI exposes all ready future-discovery diagnostics together", () => {
  assert.match(priority, /board\.futureDiscovery\?\.status === "ready"/);
  assert.match(priority, /Future discovery diagnostics/);
  assert.match(priority, /Considered adds: \$\{board\.futureDiscovery\.consideredAdds\}/);
  assert.match(priority, /Complete adds: \$\{board\.futureDiscovery\.completeAdds\}/);
  assert.match(priority, /Scenarios evaluated: \$\{board\.futureDiscovery\.scenarioCount\}/);
  assert.match(priority, /Qualified adds: \$\{board\.futureDiscovery\.qualifiedAdds\}/);
});

test("waiver priority UI preserves non-ready discovery reasons without zero diagnostics or new shortlist behavior", () => {
  assert.match(priority, /board\.futureDiscovery\?\.reason \|\| "Future-only stash discovery is unavailable in the current state\."/);
  assert.doesNotMatch(priority, /consideredAdds\s*\?\?\s*0|completeAdds\s*\?\?\s*0|scenarioCount\s*\?\?\s*0|qualifiedAdds\s*\?\?\s*0/);
  assert.doesNotMatch(priority, /candidateCap|candidateLimit|\.slice\(/i);
});
