import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import fixtures from "../test/fixtures/model-recommendations.json" with { type: "json" };
import { evaluateRecommendationBatch } from "../src/domain/model-evaluator.js";

let failed = 0;
for (const item of fixtures.cases) {
  const result = evaluateRecommendationBatch([item.recommendation], snapshot);
  if (result.valid !== item.expectedValid) { failed += 1; console.error(`FAIL ${item.name}: expected ${item.expectedValid}, received ${result.valid}`); }
  else console.log(`PASS ${item.name}`);
}
console.log(`${fixtures.cases.length - failed}/${fixtures.cases.length} model safety fixtures passed.`);
if (failed) process.exitCode = 1;
