import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import fixtures from "../test/fixtures/model-recommendations.json" with { type: "json" };
import { evaluateRecommendationBatch } from "../src/domain/model-evaluator.js";

let failed = 0;
for (const item of fixtures.cases) {
  const result = evaluateRecommendationBatch([item.recommendation], snapshot, { teamId: item.teamId || null });
  const errors = result.results[0]?.errors || [];
  const issueCodes = result.results[0]?.issues?.map((issue) => issue.code) || [];
  const expectedErrorFound = !item.expectedError || errors.some((error) => error.includes(item.expectedError));
  const expectedCodeFound = !item.expectedCode || issueCodes.includes(item.expectedCode);
  if (result.valid !== item.expectedValid || !expectedErrorFound || !expectedCodeFound) { failed += 1; console.error(`FAIL ${item.name}: expected valid=${item.expectedValid}${item.expectedError ? ` and error containing ${item.expectedError}` : ""}${item.expectedCode ? ` and code ${item.expectedCode}` : ""}; received valid=${result.valid}, codes=${issueCodes.join(",")}, errors=${errors.join(" | ")}`); }
  else console.log(`PASS ${item.name}`);
}
console.log(`${fixtures.cases.length - failed}/${fixtures.cases.length} model safety fixtures passed.`);
if (failed) process.exitCode = 1;
