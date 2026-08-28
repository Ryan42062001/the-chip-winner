export class ModelAdapter {
  async explain() { throw new Error("ModelAdapter.explain must be implemented by a configured model provider."); }
}

export class DeterministicExplanationAdapter extends ModelAdapter {
  async explain(context, recommendation) {
    if (!context || !recommendation) throw new Error("Context and recommendation are required.");
    const limitations = recommendation.limitations?.length ? ` Limits: ${recommendation.limitations.join(" ")}` : "";
    return Object.freeze({ provider: "deterministic", model: null, recommendationId: recommendation.id, text: `${recommendation.kind} recommendation marked ${recommendation.status} with ${recommendation.confidence} confidence. Inputs: ${recommendation.inputs.join(", ")}.${limitations}`, generatedAt: null });
  }
}
