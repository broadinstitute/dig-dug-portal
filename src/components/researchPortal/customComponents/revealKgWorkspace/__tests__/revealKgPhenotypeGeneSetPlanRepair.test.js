import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("phenotype gene set plan repair", () => {
    it("rewrites open-ended add queries to add_phenotype_gene_sets", () => {
        const query =
            "Add nodes related to adipose expansion and adverse metabolic outcomes";
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add related nodes.",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add nodes",
                        target: {},
                        options: {},
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("add_phenotype_gene_sets");
        expect(result.json.steps[0].options.search_query).toBe(query);
    });

    it("rewrites trait and gene set requests to add_phenotype_gene_sets", () => {
        const query =
            "Find traits and gene sets for insulin secretion in pancreatic beta cells";
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Search phenotype gene sets.",
                steps: [
                    {
                        id: "step-1",
                        action: "add_nodes_by_intent",
                        label: "Add nodes",
                        target: {},
                        options: { research_intent: query },
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.json.steps[0].action).toBe("add_phenotype_gene_sets");
    });

    it("keeps gene-set-only requests on add_nodes_by_intent", () => {
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
                        options: { research_intent: query },
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.json.steps[0].action).toBe("add_nodes_by_intent");
        expect(result.json.steps[0].options.node_types).toEqual(["gene_set"]);
    });

    it("does not clarify when T2D is a trait abbreviation in an add request", () => {
        const query =
            "add 5 gene sets and trait nodes from GTEx and associated with T2D trait and pancreas";
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add gene sets and traits.",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add nodes",
                        target: {},
                        options: {},
                    },
                ],
            },
            query,
            { sample_nodes: [] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("add_phenotype_gene_sets");
    });
});
