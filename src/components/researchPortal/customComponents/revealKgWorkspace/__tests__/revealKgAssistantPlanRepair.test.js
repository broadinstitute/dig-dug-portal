import {
    graphLabelsMentionedInQuery,
    graphLabelsMissingFromQuery,
    parseNoveltyOptionsFromQuery,
    prepareAssistantPlannerJson,
} from "../revealKgAssistantPlanRepair.js";

const sessionContext = {
    sample_nodes: [
        { node_id: "gene:1", label: "BRCA1", type: "gene" },
        { node_id: "gene:2", label: "TP53", type: "gene" },
        { node_id: "trait:1", label: "Type 2 diabetes", type: "trait" },
    ],
    sample_edges: [
        {
            edge_id: "e1",
            source_label: "TP53",
            target_label: "BRCA1",
            source_type: "gene",
            target_type: "gene",
        },
    ],
};

describe("graphLabelsMentionedInQuery", () => {
    it("finds labels present in the query", () => {
        expect(
            graphLabelsMentionedInQuery("Expand from BRCA1", sessionContext)
        ).toEqual(["BRCA1"]);
    });
});

describe("graphLabelsMissingFromQuery", () => {
    it("flags gene tokens that are not on the graph", () => {
        expect(
            graphLabelsMissingFromQuery("Expand from NOTAGENE", sessionContext)
        ).toContain("NOTAGENE");
    });

    it("does not flag tokens that are part of a longer trait label", () => {
        const traitContext = {
            sample_nodes: [
                {
                    node_id: "trait:whr",
                    label: "Waist-hip ratio adj BMI",
                    type: "trait",
                },
            ],
        };
        expect(
            graphLabelsMissingFromQuery(
                "add neighboring genes from Waist-hip ratio adj BMI",
                traitContext
            )
        ).toEqual([]);
    });

    it("does not flag phenotype abbreviations or gene-set program names", () => {
        expect(
            graphLabelsMissingFromQuery(
                "add 5 gene sets and trait nodes from GTEx associated with T2D trait and pancreas",
                { sample_nodes: [] }
            )
        ).toEqual([]);
    });
});

describe("graphLabelsMentionedInQuery", () => {
    it("matches multi-word trait labels in the query", () => {
        const traitContext = {
            sample_nodes: [
                {
                    node_id: "trait:whr",
                    label: "Waist-hip ratio adj BMI",
                    type: "trait",
                },
            ],
        };
        expect(
            graphLabelsMentionedInQuery(
                "add neighboring genes from Waist-hip ratio adj BMI",
                traitContext
            )
        ).toEqual(["Waist-hip ratio adj BMI"]);
    });
});

describe("prepareAssistantPlannerJson", () => {
    it("repairs missing node_labels from the query", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Expand BRCA1",
                steps: [
                    {
                        id: "step-1",
                        action: "expand_graph",
                        label: "Expand BRCA1",
                        target: { scope: "node" },
                        options: {},
                    },
                ],
            },
            "Expand from BRCA1",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].target.node_labels).toEqual(["BRCA1"]);
    });

    it("adds top-N limit for select_nodes", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Select genes",
                steps: [
                    {
                        id: "step-1",
                        action: "select_nodes",
                        label: "Select top genes",
                        target: { scope: "selected_nodes", node_types: ["gene"] },
                        options: {},
                    },
                ],
            },
            "Select top 5 genes connected to Type 2 diabetes",
            sessionContext
        );
        expect(result.json.steps[0].options.limit).toBe(5);
    });

    it("adds expand count from queries like expand 50 gene nodes", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Expand genes",
                steps: [
                    {
                        id: "step-1",
                        action: "expand_graph",
                        label: "Expand gene neighbors",
                        target: { scope: "selected_nodes", node_types: ["gene"] },
                        options: {},
                    },
                ],
            },
            "Expand 50 gene nodes",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.count).toBe(20);
        expect(result.json.panel_shortcuts.hasOverflow).toBe(true);
    });

    it("repairs edge inspect targets from sample_edges", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Inspect edge",
                steps: [
                    {
                        id: "step-1",
                        action: "inspect",
                        label: "Inspect edge",
                        target: { scope: "all" },
                        options: {},
                    },
                ],
            },
            "Inspect the edge between TP53 and BRCA1",
            sessionContext
        );
        expect(result.json.steps[0].target.scope).toBe("edge");
        expect(result.json.steps[0].target.edge.source_label).toBe("TP53");
        expect(result.json.steps[0].target.edge.target_label).toBe("BRCA1");
    });

    it("clarifies when a named gene is missing from the graph", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Expand",
                steps: [],
            },
            "Expand from MISSINGGENE",
            sessionContext
        );
        expect(result.type).toBe("clarify");
        expect(result.json.message).toMatch(/MISSINGGENE/i);
    });

    it("accepts expand requests that mention a multi-word trait label", () => {
        const traitContext = {
            sample_nodes: [
                {
                    node_id: "trait:whr",
                    label: "Waist-hip ratio adj BMI",
                    type: "trait",
                },
            ],
        };
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Expand neighbors",
                steps: [
                    {
                        id: "step-1",
                        action: "expand_graph",
                        label: "Add neighboring genes",
                        target: { scope: "node" },
                        options: { target_type: "gene" },
                    },
                ],
            },
            "add neighboring genes from Waist-hip ratio adj BMI",
            traitContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].target.node_labels).toEqual([
            "Waist-hip ratio adj BMI",
        ]);
    });

    it("strips redundant clear-selection before named remove_node", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Remove BRCA1",
                steps: [
                    {
                        id: "step-1",
                        action: "select_nodes",
                        label: "Clear all selections",
                        target: { scope: "all" },
                        options: { clear: true },
                    },
                    {
                        id: "step-2",
                        action: "remove_node",
                        label: "Remove BRCA1",
                        target: { scope: "node", node_labels: ["BRCA1"] },
                        options: {},
                    },
                ],
            },
            "Remove BRCA1 from the graph",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps).toHaveLength(1);
        expect(result.json.steps[0].action).toBe("remove_node");
        expect(result.json.steps[0].target.node_labels).toEqual(["BRCA1"]);
    });

    it("repairs missing add_node search_label from the query", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add SLC30A8",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add SLC30A8",
                        target: { scope: "all" },
                        options: {},
                    },
                ],
            },
            "add slc30a8 gene to the graph",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.search_label).toBe("SLC30A8");
        expect(result.json.steps[0].options.node_type).toBe("gene");
    });

    it("repairs add_node phrase search and limit from the query", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add insulin signaling gene sets",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add matching gene sets",
                        target: { scope: "all" },
                        options: { node_type: "gene_set" },
                    },
                ],
            },
            'search the catalog for gene sets globally that match the phrase "insulin signaling" and add 15 best matching nodes.',
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.search_label).toBe("insulin signaling");
        expect(result.json.steps[0].options.node_type).toBe("gene_set");
        expect(result.json.steps[0].options.limit).toBe(15);
    });

    it("repairs add_node trait phrase search from the query", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add diabetes traits",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add traits",
                        target: { scope: "all" },
                        options: {},
                    },
                ],
            },
            'add 5 traits matching "type 2 diabetes"',
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.search_label).toBe("type 2 diabetes");
        expect(result.json.steps[0].options.node_type).toBe("trait");
        expect(result.json.steps[0].options.limit).toBe(5);
    });

    it("repairs unselect visible genes from the query", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Unselect visible genes",
                steps: [
                    {
                        id: "step-1",
                        action: "unselect_nodes",
                        label: "Unselect visible genes",
                        target: { scope: "all" },
                        options: {},
                    },
                ],
            },
            "unselect all visible gene nodes",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.visible).toBe(true);
        expect(result.json.steps[0].target.node_types).toEqual(["gene"]);
    });

    it("maps novel language to novelty-only expand filters", () => {
        expect(
            parseNoveltyOptionsFromQuery(
                "Fetch novel genes connected to the selected pathways/gene sets"
            )
        ).toEqual({
            filter_type: "novelty",
            novelty_novel: true,
            novelty_known: false,
        });
        expect(parseNoveltyOptionsFromQuery("Expand known pathways only")).toEqual({
            filter_type: "novelty",
            novelty_known: true,
            novelty_novel: false,
        });
        expect(parseNoveltyOptionsFromQuery("known and novel genes")).toBeNull();
    });

    it("maps filter-out-known phrasing to show novel nodes only", () => {
        expect(
            parseNoveltyOptionsFromQuery("Create a filter to filter out known nodes")
        ).toEqual({
            filter_type: "novelty",
            novelty_novel: true,
            novelty_known: false,
        });
        expect(parseNoveltyOptionsFromQuery("Hide novel nodes from the graph")).toEqual({
            filter_type: "novelty",
            novelty_known: true,
            novelty_novel: false,
        });
    });

    it("repairs expand_graph steps with novelty filters from the user query", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Expand for novel genes",
                steps: [
                    {
                        id: "step-1",
                        action: "expand_graph",
                        label: "Fetch novel genes",
                        target: { scope: "selected_nodes" },
                        options: { count: 15, target_type: "gene" },
                    },
                ],
            },
            "I'm interested in novel genes and pathways relevant to adipose tissue and diabetes",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.filter_type).toBe("novelty");
        expect(result.json.steps[0].options.novelty_novel).toBe(true);
        expect(result.json.steps[0].options.novelty_known).toBe(false);
    });

    it("repairs filter_graph steps with novelty filters from only novel phrasing", () => {
        expect(parseNoveltyOptionsFromQuery("only novel genes and pathways")).toEqual({
            filter_type: "novelty",
            novelty_novel: true,
            novelty_known: false,
        });
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Build novelty filter",
                steps: [
                    {
                        id: "step-1",
                        action: "filter_graph",
                        label: "Build a novelty filter to identify novel pathways",
                        target: { scope: "all" },
                        options: { mode: "build" },
                    },
                ],
            },
            "I'm interested in only novel genes and pathways relevant to adipose tissue and type 2 diabetes",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.filter_type).toBe("novelty");
        expect(result.json.steps[0].options.novelty_novel).toBe(true);
        expect(result.json.steps[0].options.novelty_known).toBe(false);
    });
});

describe("vetoPhenotypeGeneSetMisroute (via prepareAssistantPlannerJson)", () => {
    it("converts add_phenotype_gene_sets to add_nodes_by_intent when a single explicit type is named", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Find gene set–trait associations",
                steps: [
                    {
                        id: "step-1",
                        action: "add_phenotype_gene_sets",
                        label: "Find gene set–trait associations",
                        target: {},
                        options: { search_query: "insulin control failure in T2D" },
                    },
                ],
            },
            "find gene set nodes that are relevant to the failure of controlling insulin related to type 2 diabetes",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("add_nodes_by_intent");
        expect(result.json.steps[0].options.node_types).toEqual(["gene_set"]);
        expect(result.json.steps[0].options.research_intent).toBeTruthy();
    });

    it("keeps add_phenotype_gene_sets when the query names both traits and gene sets", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Find traits and gene sets",
                steps: [
                    {
                        id: "step-1",
                        action: "add_phenotype_gene_sets",
                        label: "Find traits and gene sets",
                        target: {},
                        options: { search_query: "insulin secretion" },
                    },
                ],
            },
            "find traits and gene sets for insulin secretion in pancreatic beta cells",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].action).toBe("add_phenotype_gene_sets");
    });
});

describe("fallback plan repair (via prepareAssistantPlannerJson)", () => {
    it("repairs and preserves valid fallback plans", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add phenotype gene sets",
                steps: [
                    {
                        id: "step-1",
                        action: "add_phenotype_gene_sets",
                        label: "Find gene set–trait associations",
                        target: {},
                        options: { search_query: "insulin secretion" },
                    },
                ],
                fallback_plans: [
                    {
                        summary: "Add gene sets by intention",
                        steps: [
                            {
                                id: "step-1",
                                action: "add_nodes_by_intent",
                                label: "Add gene sets from research intention",
                                target: {},
                                options: { research_intent: "insulin secretion", node_types: ["gene_set"] },
                            },
                        ],
                    },
                ],
            },
            "find traits and gene sets for insulin secretion in pancreatic beta cells",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(Array.isArray(result.json.fallback_plans)).toBe(true);
        expect(result.json.fallback_plans).toHaveLength(1);
        expect(result.json.fallback_plans[0].steps[0].action).toBe("add_nodes_by_intent");
    });

    it("drops fallback plans whose steps still need node labels", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Explain the graph",
                steps: [
                    {
                        id: "step-1",
                        action: "explain_graph",
                        label: "Explain all visible nodes",
                        target: { scope: "entire_graph" },
                        options: { scope: "entire_graph" },
                    },
                ],
                fallback_plans: [
                    {
                        summary: "Broken fallback",
                        steps: [
                            {
                                id: "step-1",
                                action: "inspect",
                                label: "Inspect a node",
                                target: { scope: "node" },
                                options: { subject: "node" },
                            },
                        ],
                    },
                ],
            },
            "explain all visible nodes on the graph",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.fallback_plans).toBeUndefined();
    });
});

describe("alternatives repair (via prepareAssistantPlannerJson)", () => {
    it("repairs and preserves medium-confidence alternatives without swapping their action", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                confidence: "medium",
                summary: "Add phenotype gene sets",
                steps: [
                    {
                        id: "step-1",
                        action: "add_phenotype_gene_sets",
                        label: "Find gene set–trait associations",
                        target: {},
                        options: { search_query: "insulin secretion" },
                    },
                ],
                alternatives: [
                    {
                        summary: "Add gene sets by intention instead",
                        steps: [
                            {
                                id: "step-1",
                                action: "add_nodes_by_intent",
                                label: "Add gene sets from research intention",
                                target: {},
                                options: {
                                    research_intent: "insulin secretion",
                                    node_types: ["gene_set"],
                                },
                            },
                        ],
                    },
                ],
            },
            "find traits and gene sets for insulin secretion in pancreatic beta cells",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(Array.isArray(result.json.alternatives)).toBe(true);
        expect(result.json.alternatives[0].steps[0].action).toBe("add_nodes_by_intent");
    });

    it("ignores alternatives when confidence is not medium", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                confidence: "high",
                summary: "Add a node",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add BRCA1",
                        target: { scope: "node", node_labels: ["BRCA1"] },
                        options: {},
                    },
                ],
                alternatives: [
                    {
                        summary: "Something else",
                        steps: [
                            {
                                id: "step-1",
                                action: "add_node",
                                label: "Add TP53",
                                target: { scope: "node", node_labels: ["TP53"] },
                                options: {},
                            },
                        ],
                    },
                ],
            },
            "add BRCA1",
            sessionContext
        );
        expect(result.type).toBe("plan");
        expect(result.json.alternatives).toBeUndefined();
    });
});

describe("ambiguous destructive removal (via prepareAssistantPlannerJson)", () => {
    const twoTraitContext = {
        sample_nodes: [
            { node_id: "gene:1", label: "BRCA1", type: "gene" },
            { node_id: "trait:1", label: "Type 2 diabetes", type: "trait" },
            { node_id: "trait:2", label: "Obesity", type: "trait" },
        ],
        sample_edges: [],
    };

    function removeTraitPlan() {
        return {
            response_type: "plan",
            confidence: "high",
            summary: "Remove trait nodes",
            steps: [
                {
                    id: "step-1",
                    action: "remove_node",
                    label: "Remove traits",
                    target: { scope: "all", node_types: ["trait"] },
                    options: {},
                },
            ],
        };
    }

    it("clarifies a bare 'remove trait' when several traits exist", () => {
        const result = prepareAssistantPlannerJson(
            removeTraitPlan(),
            "remove trait",
            twoTraitContext
        );
        expect(result.type).toBe("clarify");
        expect(result.json.options.length).toBe(3); // 2 traits + "remove all"
        expect(result.json.options[0].query).toBe("remove Type 2 diabetes");
        expect(result.json.options[2].query).toBe("remove all trait nodes");
    });

    it("acts when the user explicitly says 'all'", () => {
        const result = prepareAssistantPlannerJson(
            removeTraitPlan(),
            "remove all traits",
            twoTraitContext
        );
        expect(result.type).toBe("plan");
    });

    it("acts when a specific trait is named", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Remove Obesity",
                steps: [
                    {
                        id: "step-1",
                        action: "remove_node",
                        label: "Remove Obesity",
                        target: { scope: "node", node_labels: ["Obesity"] },
                        options: {},
                    },
                ],
            },
            "remove Obesity",
            twoTraitContext
        );
        expect(result.type).toBe("plan");
    });

    it("acts when only one node of the type exists", () => {
        const result = prepareAssistantPlannerJson(
            removeTraitPlan(),
            "remove trait",
            {
                sample_nodes: [{ node_id: "trait:1", label: "Type 2 diabetes", type: "trait" }],
                sample_edges: [],
            }
        );
        expect(result.type).toBe("plan");
    });
});
