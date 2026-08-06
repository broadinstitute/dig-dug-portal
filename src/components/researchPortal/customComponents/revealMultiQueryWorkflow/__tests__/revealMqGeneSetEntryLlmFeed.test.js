import {
    GENE_SET_ENTRY_LLM_FEED_SCOPE,
    buildGeneSetEntryLlmFeed,
    scopeGeneSetEntryFactorDataForLlm,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneSetEntryLlmFeed.js";
import { HEATMAP_SELECTION_KIND } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqHeatmapSelection.js";

const FACTOR_DATA = {
    Factor0: {
        genes: {
            PCSK9: { includedFromRequest: true, factorRelevance: 0.4, gene_score: 0.1 },
            ACTA2: { includedFromRequest: false, factorRelevance: 0.5, gene_score: -0.04 },
        },
        factors: [
            {
                factor: "Factor0",
                factorLabel: "HP_ARTERIOSCLEROSIS",
                genes: {
                    PCSK9: {
                        includedFromRequest: true,
                        factorRelevance: 0.4,
                        factor_value: 0.4,
                        gene_score: 0.1,
                    },
                    ACTA2: {
                        includedFromRequest: false,
                        factorRelevance: 0.5,
                        factor_value: 0.5,
                        gene_score: -0.04,
                    },
                },
                geneSets: {
                    HP_ARTERIOSCLEROSIS: {
                        factor_value: 2.1,
                        gene_set_score: 10,
                        p_value: 1e-10,
                        genes: ["PCSK9", "ACTA2"],
                    },
                    HP_OTHER: {
                        factor_value: 1.0,
                        gene_set_score: 5,
                        p_value: 1e-5,
                        genes: ["ACTA2"],
                    },
                },
                top_gene_sets: "HP_ARTERIOSCLEROSIS;HP_OTHER",
            },
        ],
        allFactors: [],
    },
    Factor1: {
        genes: {
            PPARG: { includedFromRequest: true, factorRelevance: 0.3, gene_score: 0.2 },
        },
        factors: [
            {
                factor: "Factor1",
                factorLabel: "WP_ADIPOGENESIS",
                genes: {
                    PPARG: {
                        includedFromRequest: true,
                        factorRelevance: 0.3,
                        factor_value: 0.3,
                        gene_score: 0.2,
                    },
                },
                geneSets: {
                    WP_ADIPOGENESIS: {
                        factor_value: 1.5,
                        gene_set_score: 8,
                        p_value: 1e-8,
                        genes: ["PPARG"],
                    },
                },
                top_gene_sets: "WP_ADIPOGENESIS",
            },
        ],
        allFactors: [],
    },
};

describe("gene-set-entry LLM feed scoping", () => {
    test("visualizer scope includes all visible factors/genes/gene sets", () => {
        const { feed, emptyReason } = buildGeneSetEntryLlmFeed(FACTOR_DATA, {
            scopeMode: GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER,
            inputGenes: ["PCSK9", "PPARG"],
            viewFilters: {
                showGeneSets: true,
                showGenes: true,
                genesInSearchOnly: false,
                onlySelected: false,
            },
            selectedNodes: [],
        });
        expect(emptyReason).toBeNull();
        expect(feed.factors.map((f) => f.id).sort()).toEqual(["Factor0", "Factor1"]);
        expect(feed.factors[0].gene_sets[0].gene_indices.length).toBeGreaterThan(0);
        expect(JSON.stringify(feed)).not.toContain("knowledgeGraphCsv");
    });

    test("visualizer genesInSearchOnly drops context genes", () => {
        const scoped = scopeGeneSetEntryFactorDataForLlm(FACTOR_DATA, {
            scopeMode: GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER,
            inputGenes: ["PCSK9"],
            viewFilters: {
                showGeneSets: true,
                showGenes: true,
                genesInSearchOnly: true,
                onlySelected: false,
            },
            selectedNodes: [],
        });
        const g0 = scoped.factorData.Factor0.factors[0].genes;
        expect(Object.keys(g0)).toEqual(["PCSK9"]);
    });

    test("selected scope requires a selection", () => {
        const { feed, emptyReason } = buildGeneSetEntryLlmFeed(FACTOR_DATA, {
            scopeMode: GENE_SET_ENTRY_LLM_FEED_SCOPE.SELECTED,
            inputGenes: ["PCSK9"],
            selectedNodes: [],
            viewFilters: { showGeneSets: true, showGenes: true },
        });
        expect(feed).toBeNull();
        expect(emptyReason).toMatch(/Select at least one/i);
    });

    test("selected scope keeps chosen factor row", () => {
        const { feed } = buildGeneSetEntryLlmFeed(FACTOR_DATA, {
            scopeMode: GENE_SET_ENTRY_LLM_FEED_SCOPE.SELECTED,
            inputGenes: ["PCSK9", "PPARG"],
            selectedNodes: [
                {
                    key: "row:Factor0|Factor0|",
                    kind: HEATMAP_SELECTION_KIND.ROW,
                    phenotype: "Factor0",
                    factor: "Factor0",
                },
            ],
            viewFilters: { showGeneSets: true, showGenes: true },
        });
        expect(feed.factors.map((f) => f.id)).toEqual(["Factor0"]);
        expect(feed.factors[0].genes.some((g) => g.symbol === "ACTA2")).toBe(true);
    });

    test("selected_plus_search adds search genes from other visualizer factors", () => {
        const { feed } = buildGeneSetEntryLlmFeed(FACTOR_DATA, {
            scopeMode: GENE_SET_ENTRY_LLM_FEED_SCOPE.SELECTED_PLUS_SEARCH,
            inputGenes: ["PCSK9", "PPARG"],
            selectedNodes: [
                {
                    key: "row:Factor0|Factor0|",
                    kind: HEATMAP_SELECTION_KIND.ROW,
                    phenotype: "Factor0",
                    factor: "Factor0",
                },
            ],
            viewFilters: { showGeneSets: true, showGenes: true },
        });
        const ids = feed.factors.map((f) => f.id).sort();
        expect(ids).toEqual(["Factor0", "Factor1"]);
        const f1 = feed.factors.find((f) => f.id === "Factor1");
        expect(f1.genes.some((g) => g.symbol === "PPARG" && g.is_input)).toBe(true);
    });
});
