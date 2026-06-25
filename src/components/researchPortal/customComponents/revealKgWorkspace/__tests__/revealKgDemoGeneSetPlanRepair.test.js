import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("demo gene set plan repair", () => {
    it("rewrites planner steps to add_demo_gene_sets when demo catalog is mentioned", () => {
        const query = "add Type 2 diabetes related gene sets from demo gene sets.";
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
                            research_intent: "type 2 diabetes",
                            node_types: ["gene_set"],
                        },
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("add_demo_gene_sets");
        expect(result.json.steps[0].options.search_term).toBe("Type 2 diabetes");
    });

    it("does not rewrite intent add when demo catalog is not mentioned", () => {
        const query =
            "find me gene sets associated with a glycosylation mechanism that could alter lipoprotein handling and coagulation";
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
                        options: { research_intent: "glycosylation" },
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.json.steps[0].action).toBe("add_nodes_by_intent");
    });
});
