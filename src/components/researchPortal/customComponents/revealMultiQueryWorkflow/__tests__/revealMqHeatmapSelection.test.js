import {
    buildCrossingSelectionNode,
    buildGeneSelectionNode,
    buildGeneSetSelectionNode,
    buildNetworkEdgeSelectionNode,
    buildNetworkNodeSelectionNode,
    buildRowSelectionNode,
    edgeMatchesHeatmapCrossing,
    filterTableRowsByHeatmapSelection,
    isHeatmapCellHighlighted,
    isHeatmapColHighlighted,
    isHeatmapRowHighlighted,
    isNetworkEdgeHighlighted,
    isNetworkNodeHighlighted,
    isSelectionNodeSelected,
    networkNodeIdsForCrossing,
    crossingSelectionIdentity,
    resolveCrossingFromNetworkEdge,
    rowKeyFromTableRow,
    toggleSelectionNode,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqHeatmapSelection.js";

describe("revealMqHeatmapSelection", () => {
    const rowMeta = {
        phenotype: "PH1",
        phenotypeDisplay: "Trait A",
        factor: "F1",
        fetchedDirection: "Genetics",
        factorClusterLabel: "Cluster 1",
    };

    test("builds stable row keys and labels", () => {
        const node = buildRowSelectionNode(rowMeta);
        expect(node.key).toBe("row:PH1|F1|Genetics");
        expect(node.label).toContain("Trait A");
        expect(node.kind).toBe("row");
    });

    test("toggles selection nodes by key", () => {
        const gs = buildGeneSetSelectionNode("GS_1");
        let selected = [];
        selected = toggleSelectionNode(selected, gs);
        expect(selected).toHaveLength(1);
        expect(isSelectionNodeSelected(selected, gs)).toBe(true);
        selected = toggleSelectionNode(selected, gs);
        expect(selected).toHaveLength(0);
    });

    test("highlights rows and columns from selection kinds", () => {
        const rowNode = buildRowSelectionNode(rowMeta);
        const geneNode = buildGeneSelectionNode("APOE");
        expect(isHeatmapRowHighlighted(rowMeta, [rowNode])).toBe(true);
        expect(isHeatmapColHighlighted("APOE", 3, 2, [geneNode])).toBe(true);
        expect(isHeatmapColHighlighted("APOE", 1, 2, [geneNode])).toBe(false);
    });

    test("axis selections highlight labels only, not data cells", () => {
        const rowNode = buildRowSelectionNode(rowMeta);
        const geneNode = buildGeneSelectionNode("APOE");
        expect(
            isHeatmapCellHighlighted(rowMeta, "APOE", 3, 2, [rowNode])
        ).toBe(false);
        expect(
            isHeatmapCellHighlighted(rowMeta, "APOE", 3, 2, [geneNode])
        ).toBe(false);
    });

    test("crossing selection highlights matching cell and both axes", () => {
        const crossing = buildCrossingSelectionNode(rowMeta, "APOE", false);
        expect(crossing.label).toContain("× APOE");
        expect(isHeatmapRowHighlighted(rowMeta, [crossing])).toBe(true);
        expect(isHeatmapColHighlighted("APOE", 4, 2, [crossing])).toBe(true);
        expect(
            isHeatmapCellHighlighted(rowMeta, "APOE", 4, 2, [crossing])
        ).toBe(true);
        expect(
            isHeatmapCellHighlighted(rowMeta, "TREM2", 4, 2, [crossing])
        ).toBe(false);
    });

    test("network node and edge selection mapping", () => {
        const geneNode = buildNetworkNodeSelectionNode({
            id: "gene:APOE",
            type: "Gene",
            label: "APOE",
        });
        expect(geneNode.kind).toBe("gene");
        expect(isNetworkNodeHighlighted("gene:APOE", [geneNode])).toBe(true);

        const edgeSel = buildNetworkEdgeSelectionNode(
            { id: "e-0-a-b", from: "gene:APOE", to: "gs:PH1|F1|GS_1", title: "contributes_to_pathway" },
            { "gene:APOE": { label: "APOE" }, "gs:PH1|F1|GS_1": { label: "GS_1" } }
        );
        expect(edgeSel.networkEdge).toBe(true);
        expect(edgeSel.rowKey).toBeTruthy();
        expect(edgeSel.colLabel).toBe("APOE");
        expect(isNetworkNodeHighlighted("gene:APOE", [edgeSel])).toBe(true);
        expect(
            isNetworkEdgeHighlighted(
                { id: "e-0-a-b", from: "gene:APOE", to: "gs:PH1|F1|GS_1" },
                [edgeSel]
            )
        ).toBe(true);
    });

    test("heatmap crossing syncs to network nodes and edges", () => {
        const crossing = buildCrossingSelectionNode(rowMeta, "APOE", false);
        expect(
            networkNodeIdsForCrossing(crossing)
        ).toEqual(["factor:PH1|F1", "gene:APOE"]);
        expect(isNetworkNodeHighlighted("factor:PH1|F1", [crossing])).toBe(true);
        expect(isNetworkNodeHighlighted("gene:APOE", [crossing])).toBe(true);
        expect(
            edgeMatchesHeatmapCrossing(
                { from: "gene:APOE", to: "gs:PH1|F1|GS_1" },
                crossing
            )
        ).toBe(true);
        expect(
            isNetworkEdgeHighlighted(
                { from: "gene:APOE", to: "gs:PH1|F1|GS_1" },
                [crossing]
            )
        ).toBe(true);

        const gsCrossing = buildCrossingSelectionNode(rowMeta, "GS_1", true);
        expect(
            edgeMatchesHeatmapCrossing(
                { from: "factor:PH1|F1", to: "gs:PH1|F1|GS_1" },
                gsCrossing
            )
        ).toBe(true);
    });

    test("resolveCrossingFromNetworkEdge matches heatmap crossing keys", () => {
        const crossing = resolveCrossingFromNetworkEdge("factor:PH1|F1", "gs:PH1|F1|GS_1");
        expect(crossing).not.toBeNull();
        expect(crossing.colIsGeneSet).toBe(true);
        expect(crossing.colLabel).toBe("GS_1");

        const edgeSel = buildNetworkEdgeSelectionNode(
            { id: "e-1", from: "factor:PH1|F1", to: "gs:PH1|F1|GS_1" },
            {}
        );
        const heatmapCrossing = buildCrossingSelectionNode(rowMeta, "GS_1", true);
        expect(crossingSelectionIdentity(edgeSel)).toBe(crossingSelectionIdentity(heatmapCrossing));
        expect(toggleSelectionNode([], edgeSel)).toEqual([edgeSel]);
        expect(isSelectionNodeSelected([edgeSel], heatmapCrossing)).toBe(true);
    });

    test("filterTableRowsByHeatmapSelection respects row and gene filters", () => {
        const rows = [
            { phenotype: "PH1", factor: "F1", fetched_direction: "Genetics", top_gene_sets: "GS_1" },
            { phenotype: "PH2", factor: "F2", fetched_direction: "Genetics", top_gene_sets: "GS_2" },
        ];
        const factorData = {
            PH1: { genes: { APOE: {} } },
            PH2: { genes: { TREM2: {} } },
        };
        const rowKey = rowKeyFromTableRow(rows[0]);
        const rowNode = { key: rowKey, kind: "row" };
        expect(filterTableRowsByHeatmapSelection(rows, [rowNode], factorData)).toHaveLength(1);

        const geneNode = buildGeneSelectionNode("TREM2");
        expect(filterTableRowsByHeatmapSelection(rows, [geneNode], factorData)).toHaveLength(1);
        expect(filterTableRowsByHeatmapSelection(rows, [geneNode], factorData)[0].phenotype).toBe("PH2");
    });
});
