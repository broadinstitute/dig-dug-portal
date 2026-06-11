import { resolveAssistantAddNodeRows } from "../revealKgAssistantAddNode.js";

const session = {
    graphNodes: [
        { id: "gene:1", label: "BRCA1", type: "gene" },
        { id: "gene:2", label: "TP53", type: "gene" },
        { id: "gene:3", label: "INSR", type: "gene" },
    ],
};

describe("resolveAssistantAddNodeRows", () => {
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
        expect(searchInteractiveCatalog).toHaveBeenCalledWith("gene", "SLC30A8", 5);
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
});
