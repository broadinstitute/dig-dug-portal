import {
    isCatalogPhraseQuery,
    resolveAssistantAddNodeRows,
    usesRankedCatalogMatching,
} from "../revealKgAssistantAddNode.js";

const session = {
    graphNodes: [
        { id: "gene:1", label: "BRCA1", type: "gene" },
        { id: "gene:2", label: "TP53", type: "gene" },
        { id: "gene:3", label: "INSR", type: "gene" },
    ],
};

describe("resolveAssistantAddNodeRows", () => {
    it("detects phrase vs symbol catalog queries", () => {
        expect(isCatalogPhraseQuery("insulin signaling")).toBe(true);
        expect(isCatalogPhraseQuery("type 2 diabetes")).toBe(true);
        expect(isCatalogPhraseQuery("BRCA1")).toBe(false);
        expect(usesRankedCatalogMatching("trait", "type 2 diabetes", 1)).toBe(true);
        expect(usesRankedCatalogMatching("factor", "insulin resistance", 1)).toBe(true);
        expect(usesRankedCatalogMatching("gene", "BRCA1", 1)).toBe(false);
        expect(usesRankedCatalogMatching("gene", "insulin signaling", 1)).toBe(true);
        expect(usesRankedCatalogMatching("gene", "BRCA1", 5)).toBe(true);
    });

    it("catalog-searches when target scope is all and search_label names a missing gene", async () => {
        const searchInteractiveCatalog = jest.fn().mockResolvedValue({
            items: [{ node_id: "gene:slc30a8", label: "SLC30A8", node_type: "gene" }],
        });
        const rows = await resolveAssistantAddNodeRows(
            session,
            { scope: "all" },
            { search_label: "SLC30A8", node_type: "gene" },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(searchInteractiveCatalog).toHaveBeenCalledWith("gene", "SLC30A8", 1);
        expect(rows).toEqual([
            expect.objectContaining({ node_id: "gene:slc30a8", label: "SLC30A8" }),
        ]);
    });

    it("does not treat scope all as every node already on the graph", async () => {
        const searchInteractiveCatalog = jest.fn().mockResolvedValue({
            items: [{ node_id: "gene:slc30a8", label: "SLC30A8", node_type: "gene" }],
        });
        const rows = await resolveAssistantAddNodeRows(
            session,
            { scope: "all" },
            { search_label: "slc30a8", node_type: "gene" },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].label).toBe("SLC30A8");
    });

    it("returns on-graph rows when the named label is already present", async () => {
        const searchInteractiveCatalog = jest.fn();
        const rows = await resolveAssistantAddNodeRows(
            {
                graphNodes: [{ id: "gene:slc", label: "SLC30A8", type: "gene" }],
            },
            { scope: "all" },
            { search_label: "SLC30A8", node_type: "gene" },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(searchInteractiveCatalog).not.toHaveBeenCalled();
        expect(rows[0].node_id).toBe("gene:slc");
    });

    it("adds top N gene sets from a phrase search", async () => {
        const searchInteractiveGeneSets = jest.fn().mockResolvedValue({
            items: [
                { node_id: "gs:1", label: "INSULIN_SIGNALING_A", node_type: "gene_set" },
                { node_id: "gs:2", label: "INSULIN_SIGNALING_B", node_type: "gene_set" },
                { node_id: "gs:3", label: "INSULIN_SIGNALING_C", node_type: "gene_set" },
            ],
        });
        const rows = await resolveAssistantAddNodeRows(
            session,
            { scope: "all" },
            { search_label: "insulin signaling", node_type: "gene_set", limit: 3 },
            { apiClient: { searchInteractiveGeneSets } }
        );
        expect(searchInteractiveGeneSets).toHaveBeenCalledWith("insulin signaling", 3);
        expect(rows).toHaveLength(3);
        expect(rows[0].label).toBe("INSULIN_SIGNALING_A");
    });

    it("fails phrase search when catalog returns no matches", async () => {
        const searchInteractiveGeneSets = jest.fn().mockResolvedValue({ items: [] });
        await expect(
            resolveAssistantAddNodeRows(
                session,
                { scope: "all" },
                { search_label: "insulin signaling", node_type: "gene_set", limit: 15 },
                { apiClient: { searchInteractiveGeneSets } }
            )
        ).rejects.toThrow(/No gene set catalog matches found/i);
    });

    it("adds top N traits from a phrase search", async () => {
        const searchInteractiveCatalog = jest.fn().mockResolvedValue({
            items: [
                { node_id: "trait:1", label: "Type 2 diabetes", node_type: "trait" },
                { node_id: "trait:2", label: "Type 1 diabetes", node_type: "trait" },
            ],
        });
        const rows = await resolveAssistantAddNodeRows(
            session,
            { scope: "all" },
            { search_label: "type 2 diabetes", node_type: "trait", limit: 2 },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(searchInteractiveCatalog).toHaveBeenCalledWith("trait", "type 2 diabetes", 2);
        expect(rows).toHaveLength(2);
    });

    it("adds best trait match for a ranked phrase query", async () => {
        const searchInteractiveCatalog = jest.fn().mockResolvedValue({
            items: [
                { node_id: "trait:1", label: "Type 2 diabetes", node_type: "trait" },
                { node_id: "trait:2", label: "Coronary artery disease", node_type: "trait" },
            ],
        });
        const rows = await resolveAssistantAddNodeRows(
            session,
            { scope: "all" },
            { search_label: "diabetes", node_type: "trait" },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(searchInteractiveCatalog).toHaveBeenCalledWith("trait", "diabetes", 1);
        expect(rows).toHaveLength(1);
        expect(rows[0].label).toBe("Type 2 diabetes");
    });

    it("adds top N mechanisms from a phrase search", async () => {
        const searchInteractiveCatalog = jest.fn().mockResolvedValue({
            items: [
                { node_id: "factor:1", label: "Insulin signaling", node_type: "factor" },
                { node_id: "factor:2", label: "Glucose transport", node_type: "factor" },
            ],
        });
        const rows = await resolveAssistantAddNodeRows(
            session,
            { scope: "all" },
            { search_label: "insulin resistance", node_type: "factor", limit: 2 },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(searchInteractiveCatalog).toHaveBeenCalledWith("factor", "insulin resistance", 2);
        expect(rows).toHaveLength(2);
    });

    it("adds top N genes when limit is greater than one", async () => {
        const searchInteractiveCatalog = jest.fn().mockResolvedValue({
            items: [
                { node_id: "gene:1", label: "INSR", node_type: "gene" },
                { node_id: "gene:2", label: "INS", node_type: "gene" },
            ],
        });
        const rows = await resolveAssistantAddNodeRows(
            session,
            { scope: "all" },
            { search_label: "insulin", node_type: "gene", limit: 2 },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(searchInteractiveCatalog).toHaveBeenCalledWith("gene", "insulin", 2);
        expect(rows).toHaveLength(2);
    });

    it("catalog-searches when a same-label trait is already on the graph", async () => {
        const searchInteractiveGeneSets = jest.fn().mockResolvedValue({
            items: [
                { node_id: "gs:1", label: "INSULIN_SIGNALING", node_type: "gene_set" },
                { node_id: "gs:2", label: "INSULIN_PATHWAY", node_type: "gene_set" },
            ],
        });
        const rows = await resolveAssistantAddNodeRows(
            {
                graphNodes: [
                    { id: "trait:ir", label: "Insulin resistance", type: "trait" },
                ],
            },
            { scope: "all" },
            { search_label: "Insulin resistance", node_type: "gene_set", limit: 2 },
            { apiClient: { searchInteractiveGeneSets } }
        );
        expect(searchInteractiveGeneSets).toHaveBeenCalledWith("Insulin resistance", 2);
        expect(rows).toHaveLength(2);
        expect(rows.every((row) => row.node_type === "gene_set")).toBe(true);
    });

    it("does not treat a same-label node of another type as an on-graph hit", async () => {
        const searchInteractiveCatalog = jest.fn().mockResolvedValue({
            items: [{ node_id: "gene:insr", label: "INSR", node_type: "gene" }],
        });
        const rows = await resolveAssistantAddNodeRows(
            {
                graphNodes: [{ id: "trait:1", label: "INSR", type: "trait" }],
            },
            { scope: "all" },
            { search_label: "INSR", node_type: "gene" },
            { apiClient: { searchInteractiveCatalog } }
        );
        expect(searchInteractiveCatalog).toHaveBeenCalledWith("gene", "INSR", 1);
        expect(rows[0].node_id).toBe("gene:insr");
    });
});
