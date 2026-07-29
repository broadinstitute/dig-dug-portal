import {
    buildGeneDerivedFactorSummary,
    crossReferenceGeneSetToFactors,
    crossReferenceRecurringTraitFactors,
    selectTopGeneSets,
    selectTopTraits,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneEntryCrossReference.js";

// Fixtures shaped from real bayes_gene/pigean, bayes_gene/phenotypes, and bayes_gene/gene_scores
// responses (verified via live API calls during planning), trimmed to a few rows each.
const PIGEAN_RESPONSE = {
    input_genes: ["PCSK9", "PPARG", "LDLR", "APOB", "PPARA"],
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
            {
                cluster: "Factor1",
                factor: "Factor1",
                gene_score: 0.72,
                gene_set_score: 1.82,
                label: "HP_ABNORMALITY_OF_LIPOPROTEIN_CHOLESTEROL_CONCENTRATION",
                top_gene_sets: "HP_ABNORMALITY_OF_LIPOPROTEIN_CHOLESTEROL_CONCENTRATION;HP_ABNORMAL_LDL_CHOLESTEROL_CONCENTRATION",
                top_genes: "APOA2;APOE",
            },
        ],
    },
    "gene-factor": {
        Factor0: [{ factor_value: 0.53, gene: "ACTA2", label: "HP_ARTERIOSCLEROSIS", label_factor: "Factor0" }],
        Factor1: [{ factor_value: 0.72, gene: "APOA2", label: "HP_ABNORMALITY_OF_LIPOPROTEIN_CHOLESTEROL_CONCENTRATION", label_factor: "Factor1" }],
    },
    "gene-set-factor": {
        Factor0: [
            { factor_value: 2.19, gene_set: "HP_ARTERIOSCLEROSIS", label: "HP_ARTERIOSCLEROSIS", label_factor: "Factor0" },
            { factor_value: 1.91, gene_set: "HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY", label: "HP_ARTERIOSCLEROSIS", label_factor: "Factor0" },
        ],
        Factor1: [
            { factor_value: 1.82, gene_set: "HP_ABNORMALITY_OF_LIPOPROTEIN_CHOLESTEROL_CONCENTRATION", label: "HP_ABNORMALITY_OF_LIPOPROTEIN_CHOLESTEROL_CONCENTRATION", label_factor: "Factor1" },
        ],
    },
    gene_sets: [
        { gene_set: "HP_ARTERIOSCLEROSIS", p_value: 0.0 },
        { gene_set: "HP_ABNORMALITY_OF_LIPOPROTEIN_CHOLESTEROL_CONCENTRATION", p_value: 0.0001 },
    ],
    gene_scores: { PCSK9: 0.5, PPARG: 0.3 },
    gene_set_scores: { HP_ARTERIOSCLEROSIS: 2.19, HP_ABNORMALITY_OF_LIPOPROTEIN_CHOLESTEROL_CONCENTRATION: 1.82 },
    network_graph: [{ nodes: [], edges: [] }],
};

const PHENOTYPES_RESPONSE = {
    phenotypes: [
        { p_value: 0.0, phenotype: "Homozygous_familial_hypercholesterolemia_Orphanet_391665" },
        { p_value: 0.0, phenotype: "gcat_trait_sphingomyelin_160_measurement" },
        { p_value: 7.5e-306, phenotype: "gcat_trait_free_cholesterol_to_total_lipids_in_small_HDL_percentage" },
        { p_value: 1.1e-266, phenotype: "gcat_trait_free_cholesterol_to_total_lipids_in_large_HDL_percentage" },
    ],
};

const GENE_SCORES_FLAT_RESPONSE = {
    gene_scores: { PCSK9: 0.51, PPARG: 0.29 },
    gene_set_scores: {
        HP_ARTERIOSCLEROSIS: 2.2, // present in both sources -> "both"
        BIOCARTA_PPARG_PATHWAY: 1.05, // only in gene_scores endpoint
    },
};

describe("revealMqGeneEntryCrossReference", () => {
    test("selectTopTraits sorts ascending by p_value and ranks", () => {
        const top = selectTopTraits(PHENOTYPES_RESPONSE, { limit: 2 });
        expect(top).toHaveLength(2);
        expect(top[0].rank).toBe(1);
        expect(top[1].rank).toBe(2);
        expect(top.every((t) => t.pValue <= 7.5e-306 || t.pValue === 0)).toBe(true);
    });

    test("selectTopTraits respects limit", () => {
        expect(selectTopTraits(PHENOTYPES_RESPONSE, { limit: 1 })).toHaveLength(1);
        expect(selectTopTraits(null)).toEqual([]);
    });

    test("selectTopGeneSets merges both sources and marks source", () => {
        const top = selectTopGeneSets(GENE_SCORES_FLAT_RESPONSE, PIGEAN_RESPONSE, { limit: 10 });
        const arterio = top.find((r) => r.geneSet === "HP_ARTERIOSCLEROSIS");
        expect(arterio.source).toBe("both");
        const biocarta = top.find((r) => r.geneSet === "BIOCARTA_PPARG_PATHWAY");
        expect(biocarta.source).toBe("gene_scores_endpoint");
        // sorted descending by score
        expect(top[0].score).toBeGreaterThanOrEqual(top[top.length - 1].score);
    });

    test("selectTopGeneSets handles missing sources gracefully", () => {
        expect(selectTopGeneSets(null, null, { limit: 5 })).toEqual([]);
    });

    test("buildGeneDerivedFactorSummary uses membership maps over top_gene_sets/top_genes strings", () => {
        const summary = buildGeneDerivedFactorSummary(PIGEAN_RESPONSE);
        expect(summary).toHaveLength(2);
        const factor0 = summary.find((f) => f.factorId === "Factor0");
        expect(factor0.geneSetMembers).toEqual(["HP_ARTERIOSCLEROSIS", "HP_ABNORMAL_CORONARY_ARTERY_MORPHOLOGY"]);
        expect(factor0.geneMembers).toEqual(["ACTA2"]);
        expect(factor0.factorValue).toBeCloseTo(2.19);
    });

    test("buildGeneDerivedFactorSummary returns empty array when pigean response missing", () => {
        expect(buildGeneDerivedFactorSummary(null)).toEqual([]);
    });

    test("crossReferenceRecurringTraitFactors groups factors across traits by gene-set overlap", () => {
        const perTraitFactors = {
            traitA: {
                ok: true,
                error: null,
                factors: [{ factor: "F0", label: "lipid cluster", topGeneSets: "HP_ARTERIOSCLEROSIS;GS_X" }],
            },
            traitB: {
                ok: true,
                error: null,
                factors: [{ factor: "F3", label: "cholesterol cluster", topGeneSets: "HP_ARTERIOSCLEROSIS;GS_Y" }],
            },
            traitC: {
                ok: false,
                error: "404",
                factors: [],
            },
            traitD: {
                ok: true,
                error: null,
                factors: [{ factor: "F1", label: "unrelated cluster", topGeneSets: "GS_UNRELATED" }],
            },
        };
        const result = crossReferenceRecurringTraitFactors(perTraitFactors);
        expect(result).toHaveLength(1);
        expect(result[0].traitCount).toBe(2);
        const traitIds = result[0].traits.map((t) => t.traitId).sort();
        expect(traitIds).toEqual(["traitA", "traitB"]);
    });

    test("crossReferenceRecurringTraitFactors returns nothing when no trait shares gene sets", () => {
        const perTraitFactors = {
            traitA: { ok: true, error: null, factors: [{ factor: "F0", label: "a", topGeneSets: "GS_1" }] },
            traitB: { ok: true, error: null, factors: [{ factor: "F0", label: "b", topGeneSets: "GS_2" }] },
        };
        expect(crossReferenceRecurringTraitFactors(perTraitFactors)).toEqual([]);
    });

    test("crossReferenceGeneSetToFactors finds gene-derived and per-trait factor membership", () => {
        const topGeneSets = [{ geneSet: "HP_ARTERIOSCLEROSIS", score: 2.2, rank: 1 }];
        const factorSummary = buildGeneDerivedFactorSummary(PIGEAN_RESPONSE);
        const perTraitFactors = {
            traitA: {
                ok: true,
                error: null,
                factors: [{ factor: "F0", label: "lipid cluster", topGeneSets: "HP_ARTERIOSCLEROSIS;GS_X" }],
            },
        };
        const result = crossReferenceGeneSetToFactors(topGeneSets, factorSummary, perTraitFactors);
        expect(result).toHaveLength(1);
        expect(result[0].geneDerivedFactors).toContain("HP_ARTERIOSCLEROSIS");
        expect(result[0].traitFactors).toEqual([{ traitId: "traitA", factor: "F0", label: "lipid cluster" }]);
    });
});
