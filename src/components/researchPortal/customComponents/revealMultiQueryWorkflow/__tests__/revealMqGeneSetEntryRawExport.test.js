import {
    RAW_EXPORT_SCHEMA_VERSION,
    buildGeneSetEntryRawExport,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneSetEntryRawExport.js";

describe("buildGeneSetEntryRawExport", () => {
    const factorData = {
        Factor0: {
            genes: {
                PCSK9: { includedFromRequest: true, factorRelevance: 0.4, gene_score: 0.12 },
                ACTA2: { includedFromRequest: false, factor_value: 0.5, gene_score: -0.04 },
            },
            factors: [
                {
                    factor: "Factor0",
                    factorLabel: "HP_ARTERIOSCLEROSIS",
                    rationale: "Factorization cluster: HP_ARTERIOSCLEROSIS",
                    genes: {
                        PCSK9: {
                            includedFromRequest: true,
                            factorRelevance: 0.43208,
                            factor_value: 0.43208,
                            gene_score: 0.12023,
                        },
                        LDLR: {
                            includedFromRequest: true,
                            factorRelevance: 0.42629,
                            factor_value: 0.42629,
                            gene_score: 0.35014,
                        },
                        ACTA2: {
                            includedFromRequest: false,
                            factorRelevance: 0.52907,
                            factor_value: 0.52907,
                            gene_score: -0.04197,
                        },
                    },
                    geneSets: {
                        HP_ARTERIOSCLEROSIS: {
                            factor_value: 2.19122,
                            gene_set_score: 151.06168,
                            p_value: 8.67585e-152,
                            genes: ["PCSK9", "LDLR", "ACTA2"],
                        },
                        HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY: {
                            factor_value: 1.91841,
                            gene_set_score: 199.84182,
                            p_value: 1.43938e-200,
                            genes: ["PCSK9", "LDLR"],
                        },
                    },
                    top_gene_sets: "HP_ARTERIOSCLEROSIS;HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY",
                },
            ],
            allFactors: [],
        },
    };

    test("returns null for empty factorData", () => {
        expect(buildGeneSetEntryRawExport({})).toBeNull();
        expect(buildGeneSetEntryRawExport(null)).toBeNull();
    });

    test("builds slim factors with indexed gene-set membership", () => {
        const out = buildGeneSetEntryRawExport(factorData, {
            inputGenes: ["PCSK9", "LDLR", "APOB"],
        });
        expect(out).toMatchObject({
            schema_version: RAW_EXPORT_SCHEMA_VERSION,
            source: "bayes_gene/pigean",
            search_path: "genes",
            input_genes: ["PCSK9", "LDLR", "APOB"],
        });
        expect(out.factors).toHaveLength(1);
        const f = out.factors[0];
        expect(f.id).toBe("Factor0");
        expect(f.label).toBe("HP_ARTERIOSCLEROSIS");
        expect(f.genes.map((g) => g.symbol)).toEqual(["PCSK9", "LDLR", "ACTA2"]);
        expect(f.genes[0]).toEqual({
            symbol: "PCSK9",
            is_input: true,
            factor_relevance: 0.43208,
            gene_score: 0.12023,
        });
        expect(f.genes[2].is_input).toBe(false);

        const arterio = f.gene_sets.find((g) => g.name === "HP_ARTERIOSCLEROSIS");
        const coronary = f.gene_sets.find((g) => g.name === "HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY");
        expect(arterio.gene_indices).toEqual([0, 1, 2]);
        expect(coronary.gene_indices).toEqual([0, 1]);
        expect(arterio).toMatchObject({
            factor_value: 2.19122,
            gene_set_score: 151.06168,
        });
        expect(f.scores.overall_gene_score).toBe(0.52907);
        expect(f.scores.overall_gene_set_score).toBe(2.19122);
    });

    test("does not include nested factorData / allFactors / repeated gene symbol arrays", () => {
        const out = buildGeneSetEntryRawExport(factorData, { inputGenes: ["PCSK9"] });
        const json = JSON.stringify(out);
        expect(json).not.toContain("allFactors");
        expect(json).not.toContain("factorData");
        expect(json).not.toContain("includedFromRequest");
        expect(json).not.toContain("top_gene_sets");
        expect(out.factors[0].gene_sets[0].genes).toBeUndefined();
    });
});
