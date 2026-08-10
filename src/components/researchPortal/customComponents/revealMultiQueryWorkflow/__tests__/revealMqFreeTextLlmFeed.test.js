import {
    FREE_TEXT_LLM_FEED_SCOPE,
    buildFreeTextHypothesesUserPrompt,
    buildFreeTextLlmFeed,
    resolveSupportingRowIdsFromCitations,
    scopeFreeTextFactorDataForLlm,
    slimDiagnosticMeta,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqFreeTextLlmFeed.js";
import { HEATMAP_SELECTION_KIND } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqHeatmapSelection.js";

const FACTOR_DATA = {
    PH1: {
        genes: {
            TREM2: { combined: 0.8 },
            APOE: { combined: 0.5 },
        },
        factors: [
            {
                factor: "F1",
                fetched_direction: "Genetics",
                genes: {
                    TREM2: { factorRelevance: 0.8, factor_value: 0.8 },
                    APOE: { factorRelevance: 0.5, factor_value: 0.5 },
                },
                geneSets: {
                    GS_MICROGLIA: {
                        factor_value: 2.0,
                        genes: ["TREM2", "APOE"],
                    },
                },
            },
        ],
        allFactors: [],
    },
    PH2: {
        genes: {
            PPARG: { combined: 0.4 },
        },
        factors: [
            {
                factor: "F2",
                fetched_direction: "Tissue",
                genes: {
                    PPARG: { factorRelevance: 0.4, factor_value: 0.4 },
                },
                geneSets: {
                    GS_ADIPO: {
                        factor_value: 1.2,
                        genes: ["PPARG"],
                    },
                },
            },
        ],
        allFactors: [],
    },
};

describe("free-text LLM feed scoping", () => {
    test("full scope keeps all phenotypes", () => {
        const { factorData, emptyReason } = scopeFreeTextFactorDataForLlm(FACTOR_DATA, {
            scopeMode: FREE_TEXT_LLM_FEED_SCOPE.FULL,
            selectedNodes: [],
            genesOfInterest: ["TREM2"],
        });
        expect(emptyReason).toBeNull();
        expect(Object.keys(factorData).sort()).toEqual(["PH1", "PH2"]);
    });

    test("selected scope requires a selection", () => {
        const { factorData, emptyReason } = scopeFreeTextFactorDataForLlm(FACTOR_DATA, {
            scopeMode: FREE_TEXT_LLM_FEED_SCOPE.SELECTED,
            selectedNodes: [],
            genesOfInterest: ["TREM2"],
        });
        expect(Object.keys(factorData)).toEqual([]);
        expect(emptyReason).toMatch(/Select at least one/i);
    });

    test("selected scope keeps chosen phenotype×factor row", () => {
        const { factorData, emptyReason } = scopeFreeTextFactorDataForLlm(FACTOR_DATA, {
            scopeMode: FREE_TEXT_LLM_FEED_SCOPE.SELECTED,
            selectedNodes: [
                {
                    key: "row:PH1|F1|Genetics",
                    kind: HEATMAP_SELECTION_KIND.ROW,
                    phenotype: "PH1",
                    factor: "F1",
                    fetchedDirection: "Genetics",
                },
            ],
            genesOfInterest: [],
        });
        expect(emptyReason).toBeNull();
        expect(Object.keys(factorData)).toEqual(["PH1"]);
        expect(Object.keys(factorData.PH1.factors[0].genes).sort()).toEqual(["APOE", "TREM2"]);
    });

    test("selected_plus_goi adds GOI genes from other phenotypes", () => {
        const { factorData, emptyReason } = scopeFreeTextFactorDataForLlm(FACTOR_DATA, {
            scopeMode: FREE_TEXT_LLM_FEED_SCOPE.SELECTED_PLUS_GOI,
            selectedNodes: [
                {
                    key: "row:PH1|F1|Genetics",
                    kind: HEATMAP_SELECTION_KIND.ROW,
                    phenotype: "PH1",
                    factor: "F1",
                    fetchedDirection: "Genetics",
                },
            ],
            genesOfInterest: ["PPARG"],
        });
        expect(emptyReason).toBeNull();
        expect(Object.keys(factorData).sort()).toEqual(["PH1", "PH2"]);
        expect(Object.keys(factorData.PH2.factors[0].genes)).toEqual(["PPARG"]);
    });

    test("selected_plus_goi with only GOI (no selection) still returns GOI rows", () => {
        const { factorData, emptyReason } = scopeFreeTextFactorDataForLlm(FACTOR_DATA, {
            scopeMode: FREE_TEXT_LLM_FEED_SCOPE.SELECTED_PLUS_GOI,
            selectedNodes: [],
            genesOfInterest: ["TREM2"],
        });
        expect(emptyReason).toBeNull();
        expect(Object.keys(factorData)).toEqual(["PH1"]);
        expect(Object.keys(factorData.PH1.factors[0].genes)).toEqual(["TREM2"]);
    });
});

describe("free-text slim LLM feed", () => {
    test("buildFreeTextLlmFeed uses gene_indices and omits route top_hits duplication", () => {
        const { feed, emptyReason } = buildFreeTextLlmFeed(FACTOR_DATA, {
            genesOfInterest: ["TREM2"],
            hybridMeta: {
                genes_of_interest_requested: ["TREM2", "APOE"],
                genes_of_interest_missing_from_response: ["APOE"],
                unused_fat_field: { a: 1 },
            },
            routeBundles: [
                {
                    route_id: "r1",
                    category: "Genetics",
                    biological_query_variation: "var",
                    extracted_terms: { genes_of_interest: ["TREM2"] },
                    top_hits: [{ phenotype: "PH1", genes: [{ gene: "TREM2" }] }],
                    meta: { genes_of_interest_absent_from_db: ["FAKE1"] },
                },
            ],
        });
        expect(emptyReason).toBeNull();
        expect(feed.schema_version).toBe(1);
        expect(feed.clusters).toHaveLength(2);
        const ph1 = feed.clusters.find((c) => c.phenotype === "PH1");
        expect(ph1.genes.some((g) => g.symbol === "TREM2" && g.is_input)).toBe(true);
        expect(ph1.gene_sets[0].gene_indices.length).toBeGreaterThan(0);
        expect(feed.routes[0].top_hits).toBeUndefined();
        expect(feed.diagnostic_meta.genes_of_interest_requested).toEqual(["TREM2", "APOE"]);
        expect(feed.diagnostic_meta.genes_of_interest_absent_from_db).toEqual(["FAKE1"]);
        expect(feed.diagnostic_meta.unused_fat_field).toBeUndefined();
        const prompt = buildFreeTextHypothesesUserPrompt(feed, "ctx");
        expect(prompt).toContain('"clusters"');
        expect(prompt).not.toContain("Knowledge graph (CSV)");
        expect(prompt).not.toContain("top_hits");
    });

    test("slimDiagnosticMeta unions route metas", () => {
        const meta = slimDiagnosticMeta(
            { genes_of_interest_requested: ["A"] },
            [{ meta: { genes_of_interest_requested: ["B"], lexical_fusion_used: true } }]
        );
        expect(meta.genes_of_interest_requested.sort()).toEqual(["A", "B"]);
        expect(meta.lexical_fusion_used).toBe(true);
    });

    test("resolveSupportingRowIdsFromCitations maps entities to flattened rows", () => {
        const flattened = [
            { id: 0, subject: "PH1", predicate: "associated_with", object: "GS_MICROGLIA" },
            { id: 1, subject: "PH1", predicate: "contains_gene", object: "TREM2" },
            { id: 2, subject: "TREM2", predicate: "contributes_to_pathway", object: "GS_MICROGLIA" },
            { id: 3, subject: "PH2", predicate: "contains_gene", object: "PPARG" },
        ];
        const ids = resolveSupportingRowIdsFromCitations(flattened, {
            associated_pairs: [{ phenotype: "PH1", factor: "F1" }],
            genes: [{ gene: "TREM2" }],
            cited_gene_set_names: ["GS_MICROGLIA"],
        });
        expect(ids.sort((a, b) => a - b)).toEqual([0, 1, 2]);
    });
});
