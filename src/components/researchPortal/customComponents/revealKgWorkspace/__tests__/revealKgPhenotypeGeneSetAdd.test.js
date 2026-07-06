import {
    mentionsPhenotypeAndGeneSetInQuery,
    resolvePhenotypeGeneSetRows,
    rowsFromPhenotypeGeneSetPairs,
    shouldUsePhenotypeGeneSetAdd,
} from "../revealKgPhenotypeGeneSetAdd.js";

describe("revealKgPhenotypeGeneSetAdd", () => {
    it("detects phenotype and gene set mentions together", () => {
        expect(
            mentionsPhenotypeAndGeneSetInQuery(
                "Find traits and gene sets for insulin secretion"
            )
        ).toBe(true);
        expect(mentionsPhenotypeAndGeneSetInQuery("Find gene sets for insulin")).toBe(false);
    });

    it("routes open-ended research questions to phenotype search", () => {
        expect(
            shouldUsePhenotypeGeneSetAdd(
                "Add nodes related to adipose expansion and adverse metabolic outcomes"
            )
        ).toBe(true);
        expect(
            shouldUsePhenotypeGeneSetAdd(
                "insulin secretion in pancreatic beta cells"
            )
        ).toBe(false);
    });

    it("does not route gene-set-only or mechanism-only requests", () => {
        expect(
            shouldUsePhenotypeGeneSetAdd(
                "find me gene sets associated with lipoprotein handling"
            )
        ).toBe(false);
        expect(
            shouldUsePhenotypeGeneSetAdd(
                "Find a glycosylation mechanism that could alter lipoprotein handling"
            )
        ).toBe(false);
    });

    it("dedupes traits and gene sets across pairs", () => {
        const pairs = [
            {
                trait: {
                    node_id: "trait:T2D",
                    node_type: "trait",
                    label: "Type 2 diabetes",
                },
                gene_set: {
                    node_id: "gene_set:GTEx__pancreas__sig",
                    node_type: "gene_set",
                    label: "GTEx pancreas sig",
                },
            },
            {
                trait: {
                    node_id: "trait:T2D",
                    node_type: "trait",
                    label: "Type 2 diabetes",
                },
                gene_set: {
                    node_id: "gene_set:GTEx__liver__sig",
                    node_type: "gene_set",
                    label: "GTEx liver sig",
                },
            },
        ];
        const { rows } = rowsFromPhenotypeGeneSetPairs(pairs);
        expect(rows).toHaveLength(3);
        expect(rows.filter((row) => row.node_type === "trait")).toHaveLength(1);
        expect(rows.filter((row) => row.node_type === "gene_set")).toHaveLength(2);
    });

    it("resolves catalog rows from phenotype search API", async () => {
        const apiClient = {
            searchInteractivePhenotypeGeneSets: async () => ({
                method: "embedding",
                pairs: [
                    {
                        trait: {
                            node_id: "trait:FGovertime",
                            node_type: "trait",
                            label: "Fasting glucose change over time",
                        },
                        gene_set: {
                            node_id: "gene_set:GTEx__small_intestine__sig",
                            node_type: "gene_set",
                            label: "GTEx small intestine sig",
                        },
                    },
                ],
            }),
        };
        const { rows, pairCount } = await resolvePhenotypeGeneSetRows(
            apiClient,
            "insulin secretion in pancreatic beta cells",
            5
        );
        expect(pairCount).toBe(1);
        expect(rows).toHaveLength(2);
        expect(rows.map((row) => row.node_type).sort()).toEqual(["gene_set", "trait"]);
    });
});
