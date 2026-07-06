import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("select connected nodes plan repair", () => {
    const query = "select all nodes connected to FLG";

    it("rewrites select_nodes to select_connected_nodes", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Select connected nodes.",
                steps: [
                    {
                        id: "step-1",
                        action: "select_nodes",
                        label: "Select all nodes connected to FLG",
                        target: { scope: "all" },
                        options: { connected_to_label: "FLG", rank_by: "connection" },
                    },
                ],
            },
            query,
            {
                sample_nodes: [{ label: "FLG", node_type: "gene" }],
            }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("select_connected_nodes");
        expect(result.json.steps[0].target.node_labels).toEqual(["FLG"]);
        expect(result.json.steps[0].options.replace).toBe(false);
    });

    it("does not rewrite unrelated select requests", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Select genes.",
                steps: [
                    {
                        id: "step-1",
                        action: "select_nodes",
                        label: "Select all genes",
                        target: { scope: "node_types", node_types: ["gene"] },
                        options: {},
                    },
                ],
            },
            "select all genes",
            { sample_nodes: [] }
        );
        expect(result.json.steps[0].action).toBe("select_nodes");
    });
});
