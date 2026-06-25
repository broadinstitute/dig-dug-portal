import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("map genes plan repair", () => {
    it("rewrites map-genes queries to map_genes", () => {
        const query = "Map genes across selected gene sets";
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Map genes.",
                steps: [
                    {
                        id: "step-1",
                        action: "explain_graph",
                        label: "Explain",
                        target: {},
                        options: {},
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("map_genes");
        expect(result.json.steps[0].target).toEqual({
            scope: "selected_nodes",
            node_types: ["gene_set"],
        });
    });
});
