import test from "node:test";
import assert from "node:assert/strict";
import { renderAcquisitionSettingsCard } from "../src/ui/acquisition-settings.js";

test("acquisition settings UI shows explicit ESPN usage and remaining budget", () => {
  const html = renderAcquisitionSettingsCard({ acquisitionLimit: -1, matchupAcquisitionLimit: 3, waiverProcessDays: 2, budget: 100, usesAcquisitionBudget: true, acquisitionType: "WAIVERS_FAAB" }, { seasonAcquisitions: 4, matchupAcquisitions: 1, waiverRank: 2, budgetSpent: 17 }, 6);
  assert.match(html, /Unlimited/);
  assert.match(html, /Budget remaining<\/dt><dd>83/);
  assert.match(html, /Week 6 acquisitions/);
  assert.match(html, /Waiver period<\/dt><dd>2 days/);
});

test("traditional waivers show no FAAB budget and a source-backed waiver period", () => {
  const html = renderAcquisitionSettingsCard({ acquisitionLimit: -1, matchupAcquisitionLimit: -1, waiverProcessDays: 1, budget: null, usesAcquisitionBudget: false, acquisitionType: "WAIVERS_TRADITIONAL" }, { seasonAcquisitions: 0, matchupAcquisitions: null, waiverRank: 10, budgetSpent: null }, 1);
  assert.match(html, /Player acquisition system<\/dt><dd>Waivers/);
  assert.match(html, /Waiver period<\/dt><dd>1 day/);
  assert.match(html, /Budget remaining<\/dt><dd>Not used/);
  assert.doesNotMatch(html, /Budget remaining<\/dt><dd>100/);
});

test("acquisition settings UI preserves unavailable values and escapes input", () => {
  const html = renderAcquisitionSettingsCard({ acquisitionLimit: "<unknown>" }, {}, null);
  assert.match(html, /&lt;unknown&gt;/);
  assert.doesNotMatch(html, /<unknown>/);
  assert.match(html, /Unavailable/);
});
