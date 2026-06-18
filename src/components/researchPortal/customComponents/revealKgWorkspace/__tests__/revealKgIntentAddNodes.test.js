import {
    fetchIntentAddRows,
    parseExplicitIntentNodeTypes,
    validateIntentAddPlan,
} from "../revealKgIntentAddNodes.js";

describe("revealKgIntentAddNodes", () => {
    it("parses explicit gene set only requests", () => {
        expect(
            parseExplicitIntentNodeTypes(
                "Add gene set nodes associated with a glycosylation mechanism that could alter lipoprotein handling and coagulation"
            )
        ).toEqual(["gene_set"]);
        expect(
            parseExplicitIntentNodeTypes(
                "find me gene sets associated with a glycosylation mechanism that could alter lipoprotein handling and coagulation"
            )
        ).toEqual(["gene_set"]);
    });

    it("parses multiple explicit add types from the add clause", () => {
        expect(
            parseExplicitIntentNodeTypes(
                "Add gene sets and traits associated with insulin resistance"
            )
        ).toEqual(["gene_set", "trait"]);
    });

    it("filters planned searches to allowed node types", () => {
        const plan = validateIntentAddPlan(
            {
                explanation: "Gene set angle only.",
                searches: [
                    { node_type: "factor", phrase: "glycosylation", limit: 3 },
                    { node_type: "trait", phrase: "coagulation", limit: 2 },
                    { node_type: "gene_set", phrase: "lipoprotein handling", limit: 3 },
                ],
            },
            { allowedNodeTypes: ["gene_set"] }
        );
        expect(plan.searches.map((entry) => entry.node_type)).toEqual(["gene_set"]);
        expect(plan.allowed_node_types).toEqual(["gene_set"]);
    });

    it("validates planned searches", () => {
        const plan = validateIntentAddPlan({
            explanation: "Split the question into mechanism and phenotype angles.",
            searches: [
                { node_type: "factor", phrase: "glycosylation lipoprotein", limit: 3 },
                { node_type: "trait", phrase: "coagulation", limit: 2 },
                { node_type: "gene_set", phrase: "lipoprotein handling", limit: 3 },
                { node_type: "gene", phrase: "APOE", limit: 1 },
            ],
        });
        expect(plan.searches).toHaveLength(3);
        expect(plan.searches.map((entry) => entry.node_type)).toEqual([
            "factor",
            "trait",
            "gene_set",
        ]);
    });

    it("dedupes catalog rows across searches", async () => {
        const apiClient = {
            searchInteractiveCatalog: async (nodeType, query) => ({
                items: [
                    {
                        node_id: `${nodeType}:shared`,
                        node_type: nodeType,
                        label: `${query} A`,
                    },
                    {
                        node_id: `${nodeType}:other`,
                        node_type: nodeType,
                        label: `${query} B`,
                    },
                ],
            }),
            searchInteractiveGeneSets: async (query) => ({
                items: [
                    {
                        node_id: "gene_set:shared",
                        node_type: "gene_set",
                        label: `${query} set`,
                    },
                ],
            }),
        };
        const { rows } = await fetchIntentAddRows(
            apiClient,
            [
                { node_type: "factor", phrase: "glycosylation", limit: 2 },
                { node_type: "factor", phrase: "lipoprotein", limit: 2 },
            ],
            { existingNodeIds: ["factor:shared"] }
        );
        expect(rows.some((row) => row.node_id === "factor:shared")).toBe(false);
        expect(rows.length).toBeGreaterThan(0);
    });
});
