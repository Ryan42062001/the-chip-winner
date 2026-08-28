import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import fixtures from "../test/fixtures/model-recommendations.json" with { type: "json" };
import { buildModelEvaluationReport, evaluateExplanation, evaluateRecommendationBatch, validateModelEvaluationReport } from "../src/domain/model-evaluator.js";

let failed = 0;
for (const item of fixtures.cases) {
  const fixtureSnapshot = item.snapshotCase === "matchup-limit-exhausted" ? { ...snapshot, league: { ...snapshot.league, waiver: { ...(snapshot.league.waiver || {}), matchupAcquisitionLimit: 2 } }, teams: snapshot.teams.map((team) => team.id === item.teamId ? { ...team, acquisition: { ...(team.acquisition || {}), matchupAcquisitions: 2 } } : team) } : snapshot;
  const result = evaluateRecommendationBatch([item.recommendation], fixtureSnapshot, { teamId: item.teamId || null });
  const errors = result.results[0]?.errors || [];
  const issueCodes = result.results[0]?.issues?.map((issue) => issue.code) || [];
  const expectedErrorFound = !item.expectedError || errors.some((error) => error.includes(item.expectedError));
  const expectedCodeFound = !item.expectedCode || issueCodes.includes(item.expectedCode);
  const reportValid = validateModelEvaluationReport(buildModelEvaluationReport(result, [], 1)).valid;
  if (result.valid !== item.expectedValid || !expectedErrorFound || !expectedCodeFound || !reportValid) { failed += 1; console.error(`FAIL ${item.name}: expected valid=${item.expectedValid}${item.expectedError ? ` and error containing ${item.expectedError}` : ""}${item.expectedCode ? ` and code ${item.expectedCode}` : ""}; received valid=${result.valid}, codes=${issueCodes.join(",")}, errors=${errors.join(" | ")}`); }
  else console.log(`PASS ${item.name}`);
}
console.log(`${fixtures.cases.length - failed}/${fixtures.cases.length} recommendation safety fixtures passed.`);

let explanationFailed = 0;
for (const item of fixtures.explanationCases || []) {
  const result = evaluateExplanation(item.explanation, item.recommendation);
  const issueCodes = result.issues.map((entry) => entry.code);
  const expectedCodesFound = (item.expectedCodes || []).every((code) => issueCodes.includes(code));
  const reportValid = validateModelEvaluationReport(buildModelEvaluationReport({ passed: 0, failed: 0, issueCounts: {} }, [result], 0)).valid;
  if (result.valid !== item.expectedValid || !expectedCodesFound || !reportValid) {
    explanationFailed += 1;
    console.error(`FAIL ${item.name}: expected valid=${item.expectedValid}${item.expectedCodes?.length ? ` and codes ${item.expectedCodes.join(",")}` : ""}; received valid=${result.valid}, codes=${issueCodes.join(",")}, errors=${result.errors.join(" | ")}`);
  } else console.log(`PASS ${item.name}`);
}
console.log(`${(fixtures.explanationCases || []).length - explanationFailed}/${(fixtures.explanationCases || []).length} explanation safety fixtures passed.`);
failed += explanationFailed;
if (failed) process.exitCode = 1;
