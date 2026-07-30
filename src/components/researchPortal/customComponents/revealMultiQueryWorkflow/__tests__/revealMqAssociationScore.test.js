import {
    classifyAssociationTier,
    associationTierPasses,
    filterFactorDataByAssociationFilters,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqAssociationScore.js";

describe("classifyAssociationTier", () => {
    test("matches heatmap Combined-score color thresholds", () => {
        expect(classifyAssociationTier(3.1)).toBe("veryStrong");
        expect(classifyAssociationTier(3)).toBe("stronglySuggestive");
        expect(classifyAssociationTier(2)).toBe("stronglySuggestive");
        expect(classifyAssociationTier(1.5)).toBe("nominallySignificant");
        expect(classifyAssociationTier(1)).toBe("nominallySignificant");
        expect(classifyAssociationTier(0.5)).toBe("notSignificant");
        expect(classifyAssociationTier(null)).toBe("notSignificant");
    });
});

describe("filterFactorDataByAssociationFilters", () => {
    const factorData = {
        T2D: {
            genes: {
                A: { combined: 4, gwasSupport: 1, geneSetSupport: 1 },
                B: { combined: 0.2, gwasSupport: 0, geneSetSupport: 0 },
            },
            factors: [
                {
                    factor: "Factor0",
                    top_gene_sets: "GS1",
                    genes: {
                        A: { factorRelevance: 4, includedFromRequest: true },
                        B: { factorRelevance: 0.2, includedFromRequest: false },
                    },
                    geneSets: { GS1: { genes: ["A", "B"] } },
                },
            ],
            allFactors: [],
        },
    };

    test("drops genes in unchecked tiers", () => {
        const filtered = filterFactorDataByAssociationFilters(factorData, {
            veryStrong: true,
            stronglySuggestive: true,
            nominallySignificant: true,
            notSignificant: false,
        });
        expect(Object.keys(filtered.T2D.genes)).toEqual(["A"]);
        expect(Object.keys(filtered.T2D.factors[0].genes)).toEqual(["A"]);
        expect(filtered.T2D.factors[0].geneSets.GS1.genes).toEqual(["A"]);
    });

    test("associationTierPasses respects filters", () => {
        expect(associationTierPasses(4, { veryStrong: false, stronglySuggestive: true, nominallySignificant: true, notSignificant: true })).toBe(false);
        expect(associationTierPasses(0.1, { veryStrong: true, stronglySuggestive: true, nominallySignificant: true, notSignificant: false })).toBe(false);
    });
});
