import {
    buildCompactRouteEvidence,
    factorMatchesEvidenceHit,
    mergeRouteFactorData,
    resolveHybridPhenotypeFilterTerms,
    sanitizeEmbeddingText,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqMultiRoute.js";

describe("revealMqMultiRoute", () => {
    test("resolveHybridPhenotypeFilterTerms falls back to user query", () => {
        expect(resolveHybridPhenotypeFilterTerms([], [], "", "diabetes in liver")).toEqual(["diabetes in liver"]);
    });

    test("factorMatchesEvidenceHit matches by factor id or label", () => {
        expect(factorMatchesEvidenceHit({ factor: "f1", label: "Cluster A" }, { factor_id: "f1" })).toBe(true);
        expect(factorMatchesEvidenceHit({ factor: "f1", label: "Cluster A" }, { factor: "Cluster A" })).toBe(true);
        expect(factorMatchesEvidenceHit({ factor: "f1" }, { factor: "other" })).toBe(false);
    });

    test("mergeRouteFactorData merges genes and factors across routes", () => {
        const merged = mergeRouteFactorData([
            {
                route: { route_id: "r1", category: "Axis A" },
                factorData: {
                    t2d: {
                        genes: { APOE: { combined: 0.9 } },
                        factors: [{ factor: "f1", label: "gs1", fetched_direction: "Axis A" }],
                    },
                },
            },
        ]);
        expect(merged.t2d.genes.APOE).toBeDefined();
        expect(merged.t2d.factors).toHaveLength(1);
    });

    test("buildCompactRouteEvidence caps top hits per limits", () => {
        const bundle = buildCompactRouteEvidence({
            route: { route_id: "r1", category: "Test" },
            factorData: {
                pheno: {
                    genes: {},
                    factors: [
                        {
                            factor: "f1",
                            label: "gs1",
                            top_gene_sets: "gs1;gs2",
                            genes: { G1: { factorRelevance: 1 }, G2: { factorRelevance: 0.5 } },
                        },
                    ],
                },
            },
            hybridJson: { meta: { ok: true } },
            evidenceLimits: { maxPairsPerRoute: 1, maxGenesPerFactor: 1 },
            lastExplicitUserGenes: [],
        });
        expect(bundle.top_hits).toHaveLength(1);
        expect(bundle.top_hits[0].genes).toHaveLength(1);
    });

    test("sanitizeEmbeddingText strips portal keywords", () => {
        expect(sanitizeEmbeddingText("GTEX portal database query")).not.toMatch(/gtex|portal|database/i);
    });
});
