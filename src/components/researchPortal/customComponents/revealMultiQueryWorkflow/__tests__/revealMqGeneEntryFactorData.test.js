import {
    buildFactorDataFromGeneEntry,
    DEFAULT_BUCKET_LABEL,
    mergePigeanFactorRowsIntoFactorData,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneEntryFactorData.js";

const PIGEAN_RESPONSE = {
    input_genes: ["PCSK9", "PPARG"],
    "pigean-factor": {
        data: [
            {
                cluster: "Factor0",
                factor: "Factor0",
                gene_score: 0.53,
                gene_set_score: 2.19,
                label: "HP_ARTERIOSCLEROSIS",
                top_gene_sets: "HP_ARTERIOSCLEROSIS;HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY",
                top_genes: "ACTA2;APOE",
            },
        ],
    },
    "gene-factor": {
        Factor0: [
            { factor_value: 0.53, gene: "ACTA2", label: "HP_ARTERIOSCLEROSIS", label_factor: "Factor0" },
            { factor_value: 0.31, gene: "PPARG", label: "HP_ARTERIOSCLEROSIS", label_factor: "Factor0" },
        ],
    },
    "gene-set-factor": {
        Factor0: [
            { factor_value: 2.19, gene_set: "HP_ARTERIOSCLEROSIS", label: "HP_ARTERIOSCLEROSIS", label_factor: "Factor0" },
            { factor_value: 1.91, gene_set: "HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY", label: "HP_ARTERIOSCLEROSIS", label_factor: "Factor0" },
        ],
    },
    gene_scores: { PCSK9: 0.51, PPARG: 0.29, ACTA2: -0.02 },
    gene_set_scores: {},
};

describe("revealMqGeneEntryFactorData", () => {
    test("returns empty object when pigean response missing", () => {
        expect(buildFactorDataFromGeneEntry(null, ["PCSK9"])).toEqual({});
    });

    test("builds a single-bucket factorData with expected shape", () => {
        const factorData = buildFactorDataFromGeneEntry(PIGEAN_RESPONSE, ["PCSK9", "PPARG"]);
        expect(Object.keys(factorData)).toEqual([DEFAULT_BUCKET_LABEL]);
        const bucket = factorData[DEFAULT_BUCKET_LABEL];
        expect(bucket.factors).toHaveLength(1);
        expect(bucket.allFactors).toBe(bucket.factors);

        const factor = bucket.factors[0];
        expect(factor.factor).toBe("Factor0");
        expect(factor.label).toBe("HP_ARTERIOSCLEROSIS");
        expect(factor.top_gene_sets).toBe("HP_ARTERIOSCLEROSIS;HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY");
        expect(factor.geneSets).toEqual({});
    });

    test("marks genes as includedFromRequest based on the original input gene list", () => {
        const factorData = buildFactorDataFromGeneEntry(PIGEAN_RESPONSE, ["PCSK9"]);
        const factor = factorData[DEFAULT_BUCKET_LABEL].factors[0];
        expect(factor.genes.PPARG.includedFromRequest).toBe(false);
        // ACTA2 is a gene-factor member (co-clustered), not one of the original input genes --
        // it's still present in factor.genes, just not flagged as user-supplied.
        expect(factor.genes.ACTA2).toBeDefined();
        expect(factor.genes.ACTA2.includedFromRequest).toBe(false);
    });

    test("per-gene factorRelevance/factor_value come from gene-factor rows", () => {
        const factorData = buildFactorDataFromGeneEntry(PIGEAN_RESPONSE, ["PCSK9", "PPARG"]);
        const factor = factorData[DEFAULT_BUCKET_LABEL].factors[0];
        expect(factor.genes.ACTA2.factorRelevance).toBeCloseTo(0.53);
        expect(factor.genes.PPARG.includedFromRequest).toBe(true);
        expect(factor.genes.PPARG.geneSetIds).toEqual([]);
    });

    test("phenotype-level genes map comes from the flat gene_scores map", () => {
        const factorData = buildFactorDataFromGeneEntry(PIGEAN_RESPONSE, ["PCSK9", "PPARG"]);
        const bucket = factorData[DEFAULT_BUCKET_LABEL];
        expect(bucket.genes.PCSK9.combined).toBeCloseTo(0.51);
        expect(bucket.genes.ACTA2.combined).toBeCloseTo(-0.02);
    });

    test("supports a custom bucket label", () => {
        const factorData = buildFactorDataFromGeneEntry(PIGEAN_RESPONSE, ["PCSK9"], { bucketLabel: "Custom Label" });
        expect(Object.keys(factorData)).toEqual(["Custom Label"]);
    });
});

describe("mergePigeanFactorRowsIntoFactorData", () => {
    const HYBRID_FACTOR_DATA = {
        "Serum ApoB": {
            genes: {
                LDLR: { combined: 12.6, gwasSupport: 5.89, geneSetSupport: 6.68 },
                APOB: { combined: 11.0, gwasSupport: 5.89, geneSetSupport: 5.09 },
            },
            factors: [{ factor: "Serum ApoB", label: "Serum ApoB", top_gene_sets: "", genes: {}, geneSets: {} }],
            allFactors: [{ factor: "Serum ApoB", label: "Serum ApoB", top_gene_sets: "", genes: {}, geneSets: {} }],
        },
        "Orphanet_309005": {
            genes: { PPARG: { combined: 2.83, gwasSupport: 0, geneSetSupport: 2.83 } },
            factors: [{ factor: "Orphanet_309005", label: "Orphanet_309005", top_gene_sets: "", genes: {}, geneSets: {} }],
            allFactors: [{ factor: "Orphanet_309005", label: "Orphanet_309005", top_gene_sets: "", genes: {}, geneSets: {} }],
        },
    };

    test("replaces hybrid-search's coarse factor with real per-phenotype cluster rows when available", () => {
        const perPhenotypeFactorRows = {
            "Serum ApoB": {
                ok: true,
                factors: [
                    { factor: "F0", label: "lipid cluster", topGeneSets: "GS_A;GS_B" },
                    { factor: "F1", label: "cholesterol cluster", topGeneSets: "GS_C" },
                ],
            },
        };
        const merged = mergePigeanFactorRowsIntoFactorData(HYBRID_FACTOR_DATA, perPhenotypeFactorRows, ["LDLR"]);
        const bucket = merged["Serum ApoB"];
        expect(bucket.factors).toHaveLength(2);
        expect(bucket.factors[0].factor).toBe("F0");
        expect(bucket.factors[0].top_gene_sets).toBe("GS_A;GS_B");
        // phenotype-level genes are attached to every factor of that phenotype
        expect(bucket.factors[0].genes.LDLR.factorRelevance).toBeCloseTo(12.6);
        expect(bucket.factors[0].genes.LDLR.includedFromRequest).toBe(true);
        expect(bucket.factors[0].genes.APOB.includedFromRequest).toBe(false);
        expect(bucket.factors[1].factor).toBe("F1");
        expect(bucket.factors[1].genes.LDLR).toBeDefined();
    });

    test("falls back to hybrid-search's own factor when the per-phenotype fetch returned nothing", () => {
        const perPhenotypeFactorRows = {
            "Serum ApoB": { ok: false, factors: [] },
        };
        const merged = mergePigeanFactorRowsIntoFactorData(HYBRID_FACTOR_DATA, perPhenotypeFactorRows, ["LDLR"]);
        expect(merged["Serum ApoB"]).toBe(HYBRID_FACTOR_DATA["Serum ApoB"]);
    });

    test("falls back when a phenotype has no entry in perPhenotypeFactorRows at all", () => {
        const merged = mergePigeanFactorRowsIntoFactorData(HYBRID_FACTOR_DATA, {}, ["LDLR"]);
        expect(merged["Serum ApoB"]).toBe(HYBRID_FACTOR_DATA["Serum ApoB"]);
        expect(merged["Orphanet_309005"]).toBe(HYBRID_FACTOR_DATA["Orphanet_309005"]);
    });
});
