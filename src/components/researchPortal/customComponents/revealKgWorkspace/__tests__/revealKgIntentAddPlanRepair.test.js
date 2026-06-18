import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("intent add plan repair", () => {
  it("rewrites descriptive find queries to add_nodes_by_intent", () => {
    const result = prepareAssistantPlannerJson(
      {
        response_type: "plan",
        summary: "Add related nodes.",
        steps: [
          {
            id: "step-1",
            action: "add_node",
            label: "Add mechanism",
            target: {},
            options: { node_type: "factor", search_label: "glycosylation" },
          },
        ],
      },
      "Find a glycosylation mechanism that could alter lipoprotein handling and coagulation",
      { sample_nodes: [] }
    );
    expect(result.type).toBe("plan");
    expect(result.json.steps[0].action).toBe("add_nodes_by_intent");
    expect(result.json.steps[0].options.research_intent).toContain("glycosylation");
  });

  it("sets gene_set node_types for explicit gene set add requests", () => {
    const query =
      "Add gene set nodes associated with a glycosylation mechanism that could alter lipoprotein handling and coagulation";
    const result = prepareAssistantPlannerJson(
      {
        response_type: "plan",
        summary: "Add gene sets.",
        steps: [
          {
            id: "step-1",
            action: "add_nodes_by_intent",
            label: "Add nodes",
            target: {},
            options: {
              node_types: ["gene_set", "factor", "trait"],
              research_intent: "glycosylation lipoprotein coagulation",
            },
          },
        ],
      },
      query,
      { sample_nodes: [] }
    );
    expect(result.json.steps[0].options.node_types).toEqual(["gene_set"]);
    expect(result.json.steps[0].options.research_intent).toBe(query);
  });

  it("sets gene_set node_types for find-me-gene-sets requests", () => {
    const query =
      "find me gene sets associated with a glycosylation mechanism that could alter lipoprotein handling and coagulation";
    const result = prepareAssistantPlannerJson(
      {
        response_type: "plan",
        summary: "Add gene sets, mechanisms, and traits.",
        steps: [
          {
            id: "step-1",
            action: "add_nodes_by_intent",
            label: "Add nodes",
            target: {},
            options: {
              research_intent:
                "glycosylation mechanisms that could alter lipoprotein handling and coagulation",
            },
          },
        ],
      },
      query,
      { sample_nodes: [] }
    );
    expect(result.json.steps[0].options.node_types).toEqual(["gene_set"]);
    expect(result.json.steps[0].options.research_intent).toBe(query);
  });
});
