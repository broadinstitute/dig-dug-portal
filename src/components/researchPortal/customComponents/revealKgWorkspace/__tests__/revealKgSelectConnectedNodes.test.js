import {
    connectedNodeIdsForSession,
    mentionsSelectConnectedInQuery,
    parseConnectedSeedLabelFromQuery,
    resolveConnectedSelectionNodeIds,
} from "../revealKgSelectConnectedNodes.js";

const session = {
    graphNodes: [
        { id: "gene:FLG", label: "FLG", type: "gene" },
        { id: "gene_set:1", label: "Set A", type: "gene_set" },
        { id: "gene_set:2", label: "Set B", type: "gene_set" },
        { id: "trait:1", label: "Trait A", type: "trait" },
        { id: "gene:OTHER", label: "OTHER", type: "gene" },
    ],
    graphEdges: [
        { id: "e1", source: "gene:FLG", target: "gene_set:1" },
        { id: "e2", source: "gene:FLG", target: "gene_set:2" },
    ],
    contextualEdges: [
        { id: "c1", source: "gene_set:1", target: "trait:1" },
    ],
    highlighted: [],
};

describe("revealKgSelectConnectedNodes", () => {
    it("detects connected-node selection queries", () => {
        expect(mentionsSelectConnectedInQuery("select all nodes connected to FLG")).toBe(
            true
        );
        expect(mentionsSelectConnectedInQuery("select top 5 genes")).toBe(false);
    });

    it("parses seed label from query", () => {
        expect(parseConnectedSeedLabelFromQuery("select nodes connected to FLG")).toBe(
            "FLG"
        );
        expect(
            parseConnectedSeedLabelFromQuery("select all nodes connected to the gene FLG")
        ).toBe("FLG");
    });

    it("collects direct active and direct contextual neighbors", () => {
        expect(connectedNodeIdsForSession(session, "gene:FLG").sort()).toEqual(
            ["gene:FLG", "gene_set:1", "gene_set:2"].sort()
        );
        expect(connectedNodeIdsForSession(session, "gene_set:1").sort()).toEqual(
            ["gene:FLG", "gene_set:1", "trait:1"].sort()
        );
        expect(connectedNodeIdsForSession(session, "gene:OTHER")).toEqual(["gene:OTHER"]);
    });

    it("resolves connected selection by node label", () => {
        const { seedNodeId, nodeIds } = resolveConnectedSelectionNodeIds(session, {
            scope: "node",
            node_labels: ["FLG"],
        });
        expect(seedNodeId).toBe("gene:FLG");
        expect(nodeIds).toContain("gene_set:1");
        expect(nodeIds).not.toContain("trait:1");
        expect(nodeIds).not.toContain("gene:OTHER");
    });
});
