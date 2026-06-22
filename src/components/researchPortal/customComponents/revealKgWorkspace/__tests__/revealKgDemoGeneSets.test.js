import {
    addDemoGeneSetsToGraphLocally,
    demoGeneSetCatalogItem,
    demoGeneSetNodeId,
    filterDemoGeneSets,
    formatDemoGeneSetLabel,
    isDemoGeneSetGraphNode,
    isDemoGeneSetSearchQuery,
    parseDemoGeneSetSearchTerm,
} from "../revealKgDemoGeneSets.js";

const SAMPLE_RECORD = {
    collection_name: "GTEx",
    gene_set_id: 146,
    license_code: "CC-BY-4.0",
    standard_name: "GTEx__bladder__GTEx_Bladder",
    tags: null,
};

describe("revealKgDemoGeneSets", () => {
    it("detects demo: search prefix", () => {
        expect(parseDemoGeneSetSearchTerm("demo:bladder")).toBe("bladder");
        expect(parseDemoGeneSetSearchTerm("Demo: muscle")).toBe("muscle");
        expect(parseDemoGeneSetSearchTerm("demo:")).toBe("");
        expect(parseDemoGeneSetSearchTerm("bladder")).toBeNull();
        expect(isDemoGeneSetSearchQuery("demo:pancreas")).toBe(true);
    });

    it("filters gene sets by standard_name", () => {
        const records = [
            SAMPLE_RECORD,
            {
                ...SAMPLE_RECORD,
                gene_set_id: 263,
                standard_name: "GTEx__muscle__GTEx_aging_Muscle_20-29_30-39",
            },
        ];
        expect(filterDemoGeneSets(records, "bladder")).toHaveLength(1);
        expect(filterDemoGeneSets(records, "muscle")).toHaveLength(1);
        expect(filterDemoGeneSets(records, "")).toHaveLength(2);
    });

    it("builds catalog rows and graph node ids", () => {
        expect(demoGeneSetNodeId(SAMPLE_RECORD)).toBe("gene_set:demo:146");
        const item = demoGeneSetCatalogItem(SAMPLE_RECORD);
        expect(item.label).toBe(formatDemoGeneSetLabel(SAMPLE_RECORD.standard_name));
        expect(item.demo_gene_set.standard_name).toBe(SAMPLE_RECORD.standard_name);
    });

    it("adds demo gene sets locally with provenance metadata", () => {
        const item = demoGeneSetCatalogItem(SAMPLE_RECORD);
        const next = addDemoGeneSetsToGraphLocally({ graphNodes: [] }, [item]);
        expect(next.graphNodes).toHaveLength(1);
        expect(next.graphNodes[0].id).toBe("gene_set:demo:146");
        expect(next.graphNodes[0].demo_gene_set.collection_name).toBe("GTEx");
        expect(isDemoGeneSetGraphNode(next.graphNodes[0])).toBe(true);
    });
});
