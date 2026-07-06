import {
    filterCrossingGeneSetItems,
    isCrossingGeneSetItem,
    mentionsGeneSetCrossingInQuery,
    resolveGeneSetCrossingRows,
    shouldUseGeneSetCrossingAdd,
} from "../revealKgGeneSetCrossingAdd.js";

describe("revealKgGeneSetCrossingAdd", () => {
    it("detects crossed-with program requests", () => {
        expect(
            mentionsGeneSetCrossingInQuery(
                "Add gene sets for pancreas malfunction from GTEx crossed with LINCS"
            )
        ).toBe(true);
        expect(mentionsGeneSetCrossingInQuery("Add GTEx pancreas gene sets")).toBe(false);
    });

    it("routes crossing gene set add requests", () => {
        expect(
            shouldUseGeneSetCrossingAdd(
                "Add gene sets for pancreas malfunction from GTEx crossed with LINCS"
            )
        ).toBe(true);
    });

    it("filters intersection catalog items", () => {
        const items = [
            {
                node_id: "gene_set:GTEx__pancreas__sig___LINCS_L1000__all_signatures__sig",
                subtitle: "GTEx ∩ LINCS",
            },
            { node_id: "gene_set:GTEx__pancreas__sig", subtitle: "GTEx" },
        ];
        expect(filterCrossingGeneSetItems(items)).toHaveLength(1);
        expect(isCrossingGeneSetItem(items[0])).toBe(true);
        expect(isCrossingGeneSetItem(items[1])).toBe(false);
    });

    it("keeps only crossing rows from search results", async () => {
        const apiClient = {
            searchInteractiveGeneSets: async () => ({
                method: "embedding",
                items: [
                    {
                        node_id: "gene_set:GTEx__pancreas__sig___LINCS_L1000__sig",
                        node_type: "gene_set",
                        label: "crossing",
                        subtitle: "GTEx ∩ LINCS",
                    },
                    {
                        node_id: "gene_set:GTEx__pancreas__sig",
                        node_type: "gene_set",
                        label: "single",
                        subtitle: "GTEx",
                    },
                ],
            }),
        };
        const { rows } = await resolveGeneSetCrossingRows(
            apiClient,
            "pancreas malfunction GTEx crossed with LINCS",
            5
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].node_id).toContain("___");
    });

    it("throws when only single-source matches are returned", async () => {
        const apiClient = {
            searchInteractiveGeneSets: async () => ({
                items: [
                    {
                        node_id: "gene_set:GTEx__pancreas__sig",
                        subtitle: "GTEx",
                    },
                ],
            }),
        };
        await expect(
            resolveGeneSetCrossingRows(apiClient, "pancreas GTEx", 3)
        ).rejects.toThrow(/none were program crossings/i);
    });
});
