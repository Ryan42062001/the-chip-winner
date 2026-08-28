import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import fixtures from "../test/fixtures/model-recommendations.json" with { type: "json" };
import { evaluateRecommendationBatch } from "../src/domain/model-evaluator.js";

let failed = 0;
for (const item of fixtures.cases) {
  const result = evaluateRecommendationBatch([item.recommendation], snapshot, { teamId: item.teamId || null });
  const errors = result.results[0]?.errors || [];
  const expectedErrorFound = !item.expectedError || errors.some((error) => error.includes(item.expectedError));
  if (result.valid !== item.expectedValid || !expectedErrorFound) { failed += 1; console.error(`FAIL ${item.name}: expected valid=${item.expectedValid}${item.expectedError ? ` and error containing ${item.expectedError}` : ""}; received valid=${result.valid}, errors=${errors.join(" | ")}`); }
  else console.log(`PASS ${item.name}`);
}
console.log(`${fixtures.cases.length - failed}/${fixtures.cases.length} model safety fixtures passed.`);
if (failed) process.exitCode = 1;
