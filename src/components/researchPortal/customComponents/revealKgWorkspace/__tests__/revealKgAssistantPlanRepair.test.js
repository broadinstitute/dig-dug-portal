import {
    graphLabelsMentionedInQuery,
    graphLabelsMissingFromQuery,
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
});
