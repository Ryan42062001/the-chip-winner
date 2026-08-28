import test from "node:test";
import assert from "node:assert/strict";
import { renderAcquisitionSettingsCard } from "../src/ui/acquisition-settings.js";

test("acquisition settings UI shows explicit ESPN usage and remaining budget", () => {
  const html = renderAcquisitionSettingsCard({ acquisitionLimit: -1, matchupAcquisitionLimit: 3, waiverProcessDays: 1, budget: 100 }, { seasonAcquisitions: 4, matchupAcquisitions: 1, waiverRank: 2, budgetSpent: 17 }, 6);
  assert.match(html, /Unlimited/); assert.match(html, /Budget remaining<\/dt><dd>83/); assert.match(html, /Week 6 acquisitions/);
});

test("acquisition settings UI preserves unavailable values and escapes input", () => {
  const html = renderAcquisitionSettingsCard({ acquisitionLimit: "<unknown>" }, {}, null);
  assert.match(html, /&lt;unknown&gt;/); assert.doesNotMatch(html, /<unknown>/); assert.match(html, /Unavailable/);
});
