import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("revealKgProvenanceExplorerPlanRepair", () => {
    it("rewrites provenance explorer queries to open_provenance_explorer", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Open provenance explorer",
                steps: [
                    {
                        id: "step-1",
                        action: "explain_graph",
                        label: "Explain graph",
                        target: {},
                        options: {},
                    },
                ],
            },
            "Open provenance explorer for selected gene sets",
            { sample_nodes: [] }
        );

        expect(result.type).toBe("plan");
        expect(result.json.steps).toHaveLength(1);
        expect(result.json.steps[0].action).toBe("open_provenance_explorer");
        expect(result.json.steps[0].target).toEqual({
            scope: "selected_nodes",
            node_types: ["gene_set"],
        });
    });
});
