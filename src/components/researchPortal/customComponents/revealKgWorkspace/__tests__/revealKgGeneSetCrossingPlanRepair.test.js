import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("gene set crossing plan repair", () => {
    const query =
        "Add gene sets for pancreas malfunction from GTEx crossed with LINCS";

    it("rewrites add_nodes_by_intent to add_gene_set_crossing", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add gene sets.",
                steps: [
                    {
                        id: "step-1",
                        action: "add_nodes_by_intent",
                        label: "Add gene-set catalog nodes matching pancreas malfunction from GTEx crossed with LINCS",
                        target: {},
                        options: {
                            research_intent: query,
                            node_types: ["gene_set"],
                        },
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("add_gene_set_crossing");
        expect(result.json.steps[0].options.search_query).toBe(query);
    });

    it("does not rewrite non-crossing gene set requests", () => {
        const singleSource =
            "find me gene sets associated with lipoprotein handling";
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add gene sets.",
                steps: [
                    {
                        id: "step-1",
                        action: "add_nodes_by_intent",
                        label: "Add gene sets",
                        target: {},
                        options: { research_intent: singleSource },
                    },
                ],
            },
            singleSource,
            { sample_nodes: [] }
        );
        expect(result.json.steps[0].action).toBe("add_nodes_by_intent");
    });
});
