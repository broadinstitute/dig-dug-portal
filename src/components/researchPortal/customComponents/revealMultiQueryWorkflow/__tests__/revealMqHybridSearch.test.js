import {
    buildHybridSearchRequestBody,
    normalizeHybridFactorsToFactorData,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqHybridSearch.js";

describe("revealMqHybridSearch", () => {
    test("normalizeHybridFactorsToFactorData maps API factors", () => {
        const hybridJson = {
            data: {
                phenotype: "t2d",
                factors: [
                    {
                        factor_id: "factor1",
                        label: "cluster-a",
                        top_gene_sets: ["gs1"],
                        gene_set_program: "gtex",
                        genes: [{ gene: "APOE", relevance: 0.9, gene_set_ids: ["gs1"] }],
                    },
                ],
            },
        };
        const out = normalizeHybridFactorsToFactorData(hybridJson, ["t2d"]);
        expect(out.t2d.factors).toHaveLength(1);
        expect(out.t2d.factors[0].genes.APOE).toBeDefined();
        expect(out.t2d.genes.APOE).toBeDefined();
    });

    test("buildHybridSearchRequestBody fills fallback research context", () => {
        const body = buildHybridSearchRequestBody({
            phenotypeTerms: ["t2d"],
            mechanismTerms: [],
            researchContext: "",
            genesOfInterest: ["APOE"],
            useClientEmbedding: false,
        });
        expect(body.phenotype_terms).toEqual(["t2d"]);
        expect(body.genes_of_interest).toEqual(["APOE"]);
        expect(body.research_context).toMatch(/Phenotype-focused retrieval/);
    });
});
