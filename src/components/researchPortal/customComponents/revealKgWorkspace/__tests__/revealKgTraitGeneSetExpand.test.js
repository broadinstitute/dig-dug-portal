import {
    composeTraitGeneSetExpandQuery,
    extendExpandTargetTypes,
    intentFromTraitGeneSetExpandLabel,
    mentionsExpandTraitToGeneSets,
    prepareTraitGeneSetExpandExecution,
    resolveTraitGeneSetExpandIntent,
    resolveTraitGeneSetGraphAddLimit,
    resolveTraitGeneSetPairSearchLimit,
    resolveTraitGeneSetExpandRows,
    rowsFromTraitGeneSetExpandPairs,
    shouldUseTraitGeneSetExpand,
    TRAIT_GENE_SET_GRAPH_ADD_MAX,
    TRAIT_GENE_SET_PAIR_SEARCH_MAX,
    wantsTraitGeneSetExpandWithoutIntent,
} from "../revealKgTraitGeneSetExpand.js";
import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";
import { resolveAssistantTargetNodeIds } from "../revealKgAssistantTargetResolve.js";

describe("revealKgTraitGeneSetExpand", () => {
    const traitA = {
        node_id: "trait:T2D",
        node_type: "trait",
        label: "Type 2 diabetes",
    };
    const traitB = {
        node_id: "trait:WHR",
        node_type: "trait",
        label: "Waist-hip ratio",
    };

    it("detects trait to gene set expand mode", () => {
        expect(shouldUseTraitGeneSetExpand([traitA], "gene_set")).toBe(true);
        expect(shouldUseTraitGeneSetExpand([traitA, traitB], "gene_set")).toBe(true);
        expect(shouldUseTraitGeneSetExpand([traitA], "trait")).toBe(false);
        expect(
            shouldUseTraitGeneSetExpand(
                [traitA, { node_id: "gene:INS", node_type: "gene", label: "INS" }],
                "gene_set"
            )
        ).toBe(false);
    });

    it("extends expand target types for trait-only seeds", () => {
        expect(extendExpandTargetTypes([traitA], ["gene", "factor"])).toEqual([
            "gene",
            "factor",
            "gene_set",
        ]);
    });

    it("composes search query from trait label and intent", () => {
        expect(
            composeTraitGeneSetExpandQuery(traitA, "pancreatic islet dysfunction")
        ).toBe("Type 2 diabetes: pancreatic islet dysfunction");
    });

    it("returns trait and gene set rows from top pairs, ranked and capped", () => {
        const pairs = [
            {
                trait: { node_id: "trait:T2D", node_type: "trait", label: "T2D" },
                gene_set: { node_id: "gene_set:1", label: "GS1", node_type: "gene_set" },
                score: 0.5,
            },
            {
                trait: { node_id: "trait:OTHER", node_type: "trait", label: "Other" },
                gene_set: { node_id: "gene_set:2", label: "GS2", node_type: "gene_set" },
                score: 0.9,
            },
        ];
        const { rows } = rowsFromTraitGeneSetExpandPairs(pairs, { limit: 3 });
        expect(rows.map((row) => row.node_id)).toEqual([
            "trait:OTHER",
            "gene_set:2",
            "trait:T2D",
        ]);
    });

    it("adds pairs even when API trait id does not match the seed trait", async () => {
        const apiClient = {
            searchInteractivePhenotypeGeneSets: async () => ({
                pairs: [
                    {
                        trait: { node_id: "trait:OTHER", node_type: "trait", label: "Other trait" },
                        gene_set: { node_id: "gene_set:1", node_type: "gene_set", label: "GS1" },
                        score: 0.9,
                    },
                ],
            }),
        };
        const { rows } = await resolveTraitGeneSetExpandRows(
            apiClient,
            [traitA],
            "pancreas",
            5
        );
        expect(rows.map((row) => row.node_id).sort()).toEqual(["gene_set:1", "trait:OTHER"]);
    });

    it("merges pairs across multiple traits", async () => {
        const apiClient = {
            searchInteractivePhenotypeGeneSets: jest
                .fn()
                .mockResolvedValueOnce({
                    pairs: [
                        {
                            trait: traitA,
                            gene_set: {
                                node_id: "gene_set:1",
                                node_type: "gene_set",
                                label: "GS1",
                            },
                            score: 0.8,
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    pairs: [
                        {
                            trait: traitB,
                            gene_set: {
                                node_id: "gene_set:2",
                                node_type: "gene_set",
                                label: "GS2",
                            },
                            score: 0.7,
                        },
                    ],
                }),
        };
        const { rows, traitCount } = await resolveTraitGeneSetExpandRows(
            apiClient,
            [traitA, traitB],
            "metabolic dysfunction",
            5
        );
        expect(traitCount).toBe(2);
        expect(apiClient.searchInteractivePhenotypeGeneSets).toHaveBeenCalledTimes(2);
        expect(rows.map((row) => row.node_id).sort()).toEqual([
            "gene_set:1",
            "gene_set:2",
            "trait:T2D",
            "trait:WHR",
        ]);
    });

    it("throws when the API returns no pairs", async () => {
        const apiClient = {
            searchInteractivePhenotypeGeneSets: async () => ({ pairs: [] }),
        };
        await expect(
            resolveTraitGeneSetExpandRows(apiClient, [traitA], "pancreas", 5)
        ).rejects.toThrow("No relevant trait–gene set pairs found.");
    });

    it("requires intent", async () => {
        await expect(
            resolveTraitGeneSetExpandRows(
                { searchInteractivePhenotypeGeneSets: async () => ({}) },
                [traitA],
                "",
                5
            )
        ).rejects.toThrow("intent is required");
    });

    it("fetches up to 50 pairs but caps gene sets added to the graph at 20", () => {
        expect(resolveTraitGeneSetPairSearchLimit(200)).toBe(TRAIT_GENE_SET_PAIR_SEARCH_MAX);
        expect(resolveTraitGeneSetPairSearchLimit(undefined)).toBe(TRAIT_GENE_SET_PAIR_SEARCH_MAX);
        expect(resolveTraitGeneSetGraphAddLimit(100)).toBe(TRAIT_GENE_SET_GRAPH_ADD_MAX);
        expect(
            prepareTraitGeneSetExpandExecution(
                [traitA],
                { target_type: "gene_set", count: 100, intent: "pancreas" },
                {}
            ).limit
        ).toBe(TRAIT_GENE_SET_GRAPH_ADD_MAX);
    });

    it("requests 50 pairs from the API and adds top nodes up to the graph add limit", async () => {
        const pairs = Array.from({ length: 30 }, (_, index) => ({
            trait: {
                node_id: `trait:${index}`,
                node_type: "trait",
                label: `Trait ${index}`,
            },
            gene_set: {
                node_id: `gene_set:${index}`,
                node_type: "gene_set",
                label: `GS${index}`,
            },
            score: 1 - index * 0.01,
        }));
        const apiClient = {
            searchInteractivePhenotypeGeneSets: jest.fn().mockResolvedValue({ pairs }),
        };
        const { rows } = await resolveTraitGeneSetExpandRows(
            apiClient,
            [traitA],
            "pancreas",
            5
        );
        expect(apiClient.searchInteractivePhenotypeGeneSets).toHaveBeenCalledWith(
            expect.any(String),
            TRAIT_GENE_SET_PAIR_SEARCH_MAX
        );
        expect(rows).toHaveLength(5);
        expect(rows[0].node_id).toBe("trait:0");
        expect(rows[1].node_id).toBe("gene_set:0");
    });

    it("detects expand trait to gene set phrasing", () => {
        expect(
            mentionsExpandTraitToGeneSets(
                "Expand gene sets from Type 2 diabetes for pancreatic islet dysfunction"
            )
        ).toBe(true);
        expect(
            mentionsExpandTraitToGeneSets("Find traits and gene sets for insulin secretion")
        ).toBe(false);
    });

    it("flags missing intent for trait gene set expand", () => {
        expect(wantsTraitGeneSetExpandWithoutIntent("Expand gene sets from traits", [])).toBe(
            true
        );
        expect(
            wantsTraitGeneSetExpandWithoutIntent(
                "Expand gene sets from traits for pancreatic islet dysfunction",
                []
            )
        ).toBe(false);
    });
});

describe("trait gene set expand plan repair", () => {
    it("repairs expand requests to trait gene set expand options", () => {
        const query =
            "Expand gene sets from selected traits for pancreatic islet dysfunction";
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Expand graph.",
                steps: [
                    {
                        id: "step-1",
                        action: "expand_graph",
                        label: "Expand",
                        target: { scope: "selected_nodes" },
                        options: {},
                    },
                ],
            },
            query,
            { sample_nodes: [{ node_id: "trait:T2D", label: "Type 2 diabetes", type: "trait" }] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.target_type).toBe("gene_set");
        expect(result.json.steps[0].options.intent).toBe("pancreatic islet dysfunction");
    });

    it("extracts intent from step label quotes", () => {
        expect(
            intentFromTraitGeneSetExpandLabel(
                "Expand gene sets from Type 2 diabetes (T2D) with intent 'pancreas malfunction'"
            )
        ).toBe("pancreas malfunction");
        expect(
            resolveTraitGeneSetExpandIntent(
                {},
                "Expand gene sets from Type 2 diabetes (T2D) with intent 'pancreas malfunction'",
                ""
            )
        ).toBe("pancreas malfunction");
    });

    it("prepares trait gene set execution from trait seeds and user query", () => {
        const prepared = prepareTraitGeneSetExpandExecution(
            [{ node_id: "trait:T2D", node_type: "trait", label: "Type 2 diabetes" }],
            {},
            {
                stepLabel:
                    "Expand gene sets from Type 2 diabetes (T2D) with intent 'pancreas malfunction'",
                userQuery:
                    "Expand gene sets nodes from Type 2 diabetes (T2D) for pancreas malfunction",
            }
        );
        expect(prepared?.targetType).toBe("gene_set");
        expect(prepared?.expandFilters?.intent).toBe("pancreas malfunction");
    });

    it("repairs planner node label to graph trait label", () => {
        const query =
            "Expand gene sets nodes from Type 2 diabetes (T2D) for pancreas malfunction";
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Expand gene sets from T2D",
                steps: [
                    {
                        id: "step-1",
                        action: "expand_graph",
                        label:
                            "Expand gene sets from Type 2 diabetes (T2D) with intent 'pancreas malfunction'",
                        target: {
                            scope: "node",
                            node_labels: ["Type 2 diabetes (T2D)"],
                        },
                        options: {
                            target_type: "gene_set",
                            filter_type: "intent",
                            intent: "pancreas malfunction",
                        },
                    },
                ],
            },
            query,
            {
                sample_nodes: [
                    { node_id: "trait:T2D", label: "Type 2 diabetes", type: "trait" },
                ],
            }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].target.node_labels).toEqual(["Type 2 diabetes"]);
        expect(result.json.steps[0].options.intent).toBe("pancreas malfunction");
    });

    it("resolves trait labels with parenthetical suffixes", () => {
        const session = {
            graphNodes: [
                { id: "trait:T2D", label: "Type 2 diabetes", type: "trait" },
            ],
        };
        const ids = resolveAssistantTargetNodeIds(session, {
            scope: "node",
            node_labels: ["Type 2 diabetes (T2D)"],
        });
        expect(ids).toEqual(["trait:T2D"]);
    });
});
