import {
    buildCompactRouteEvidence,
    factorMatchesEvidenceHit,
    getSelectedMultiQueryRoutes,
    mergeRouteFactorData,
    normalizeMultiQueryRoutes,
    pickRecommendedRouteId,
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

    test("normalizeMultiQueryRoutes enforces one category each and unique fit_rank", () => {
        const routes = normalizeMultiQueryRoutes(
            [
                {
                    category: "Genetics",
                    fit_rank: 2,
                    biological_query_variation: "genetics direction about APOE",
                    extracted_terms: { genes_of_interest: ["APOE"] },
                },
                {
                    category: "Tissue Expression",
                    fit_rank: 1,
                    biological_query_variation: "tissue direction about APOE",
                    extracted_terms: { genes_of_interest: ["APOE"] },
                },
                {
                    category: "Tissue Expression",
                    fit_rank: 3,
                    biological_query_variation: "duplicate tissue should drop",
                    extracted_terms: { genes_of_interest: ["APOE"] },
                },
                {
                    category: "Perturbations",
                    fit_rank: 3,
                    biological_query_variation: "perturbation direction about APOE",
                    extracted_terms: { genes_of_interest: ["APOE"] },
                },
            ],
            {},
            { userQuery: "APOE in brain" }
        );
        expect(routes).toHaveLength(3);
        expect(routes.map((r) => r.category).sort()).toEqual([
            "Genetics",
            "Perturbations",
            "Tissue Expression",
        ]);
        expect(new Set(routes.map((r) => r.fit_rank)).size).toBe(3);
        expect(pickRecommendedRouteId(routes)).toBe(routes.find((r) => r.fit_rank === 1).route_id);
    });

    test("getSelectedMultiQueryRoutes returns only the selected direction", () => {
        const routes = [
            { route_id: "route-1", fit_rank: 1, category: "Tissue Expression" },
            { route_id: "route-2", fit_rank: 2, category: "Perturbations" },
        ];
        expect(getSelectedMultiQueryRoutes({ selectedRouteId: "route-2", multiQueryRoutes: routes })).toEqual([
            routes[1],
        ]);
        expect(getSelectedMultiQueryRoutes({ selectedRouteId: "", multiQueryRoutes: routes })).toEqual([
            routes[0],
        ]);
    });
});
