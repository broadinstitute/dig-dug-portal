import {
    resolveAssistantTargetNodeIds,
    resolveAssistantInspectSubject,
    resolveAssistantSeedAnchorItems,
    resolveUnselectNodeIds,
    resolveVisibleNodeIds,
} from "../revealKgAssistantTargetResolve.js";

const session = {
    graphNodes: [
        { id: "gene:1", label: "BRCA1", type: "gene" },
        { id: "gene:2", label: "TP53", type: "gene" },
        { id: "trait:1", label: "Type 2 diabetes", type: "trait" },
    ],
    graphEdges: [
        { id: "edge:1", source: "gene:2", target: "gene:1", normalized_score: 0.8 },
    ],
    highlighted: ["gene:1", "gene:2", "trait:1"],
    visibilityFilterLayers: [],
};

describe("resolveAssistantTargetNodeIds", () => {
    it("resolves selected_nodes with node type filter", () => {
        expect(
            resolveAssistantTargetNodeIds(
                session,
                { scope: "selected_nodes", node_types: ["gene"] },
                {}
            )
        ).toEqual(["gene:1", "gene:2"]);
    });

    it("resolves node labels", () => {
        expect(
            resolveAssistantTargetNodeIds(
                session,
                { scope: "node", node_labels: ["TP53"] },
                {}
            )
        ).toEqual(["gene:2"]);
    });

    it("applies top-N limit", () => {
        expect(
            resolveAssistantTargetNodeIds(
                session,
                { scope: "node_types", node_types: ["gene"] },
                { limit: 1, rank_by: "relevance" }
            )
        ).toHaveLength(1);
    });
});

describe("resolveVisibleNodeIds", () => {
    it("returns all visible nodes when no type filter is set", () => {
        expect(resolveVisibleNodeIds(session, { scope: "all" }, {})).toEqual([
            "gene:1",
            "gene:2",
            "trait:1",
        ]);
    });

    it("limits visible selection to requested node types", () => {
        expect(
            resolveVisibleNodeIds(session, { scope: "all", node_types: ["gene"] }, {})
        ).toEqual(["gene:1", "gene:2"]);
    });

    it("excludes nodes hidden by enabled visibility filters", () => {
        const filteredSession = {
            graphNodes: [
                { id: "gene:1", label: "BRCA1", type: "gene" },
                { id: "gene:2", label: "TP53", type: "gene" },
            ],
            visibilityFilterLayers: [
                {
                    id: "layer-1",
                    enabled: true,
                    criteria: {
                        relevanceEnabled: true,
                        relevanceThreshold: 0.5,
                    },
                    labelsByNodeId: {
                        "gene:1": {
                            relevance_label: "relevant",
                            relevance_score: 0.9,
                        },
                        "gene:2": {
                            relevance_label: "not_relevant",
                            relevance_score: 0.1,
                        },
                    },
                    expressionByNodeId: {},
                },
            ],
        };
        expect(resolveVisibleNodeIds(filteredSession, { scope: "all" }, {})).toEqual([
            "gene:1",
        ]);
    });
});

describe("resolveUnselectNodeIds", () => {
    it("returns all selected ids when clear is requested", () => {
        expect(
            resolveUnselectNodeIds(session, { scope: "all" }, {}, { clear: true })
        ).toEqual(["gene:1", "gene:2", "trait:1"]);
    });

    it("unselects only visible genes that are currently selected", () => {
        expect(
            resolveUnselectNodeIds(
                session,
                { scope: "all", node_types: ["gene"] },
                {},
                { visible: true }
            )
        ).toEqual(["gene:1", "gene:2"]);
    });

    it("unselects a named selected node", () => {
        expect(
            resolveUnselectNodeIds(
                session,
                { scope: "node", node_labels: ["BRCA1"] },
                {},
                {}
            )
        ).toEqual(["gene:1"]);
    });
});

describe("resolveAssistantInspectSubject", () => {
    it("finds an edge by endpoint labels", () => {
        expect(
            resolveAssistantInspectSubject(
                session,
                {
                    scope: "edge",
                    edge: { source_label: "TP53", target_label: "BRCA1" },
                },
                { subject: "edge" }
            )
        ).toEqual({
            subject: "edge",
            edgeId: "edge:1",
            sourceId: "gene:2",
            targetId: "gene:1",
        });
    });
});

describe("resolveAssistantSeedAnchorItems", () => {
    it("uses both edge endpoints as expansion seeds", () => {
        const items = resolveAssistantSeedAnchorItems(session, {
            scope: "edge",
            edge: { source_label: "TP53", target_label: "BRCA1" },
        });
        expect(items.map((item) => item.node_id || item.id).sort()).toEqual([
            "gene:1",
            "gene:2",
        ]);
    });
});
