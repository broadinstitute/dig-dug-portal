import {
    buildGeneSetGeneMatrix,
    buildMapGenesMatrixForSession,
    buildMapGenesRun,
    geneSymbolsFromProvenancePayload,
    getMapGenesActiveSetKey,
    getSelectedGeneSetNodesFromSession,
    mapGeneNodeId,
    mapGenesRunMatchesActiveSet,
    mentionsMapGenesInQuery,
} from "../revealKgMapGenesUtils.js";

describe("revealKgMapGenesUtils", () => {
    it("collects selected gene set nodes from the session", () => {
        const session = {
            highlighted: ["gene_set:demo:1", "gene:TP53"],
            graphNodes: [
                { id: "gene_set:demo:1", label: "Set A", type: "gene_set" },
                { id: "gene:TP53", label: "TP53", type: "gene" },
                { id: "gene_set:demo:2", label: "Set B", type: "gene_set" },
            ],
        };
        expect(getSelectedGeneSetNodesFromSession(session)).toEqual([
            expect.objectContaining({ id: "gene_set:demo:1", label: "Set A" }),
        ]);
    });

    it("builds a matrix of genes appearing in more than two gene sets", () => {
        const matrix = buildGeneSetGeneMatrix([
            { id: "gs1", label: "Set 1", genes: ["TP53", "BRCA1", "MYC"] },
            { id: "gs2", label: "Set 2", genes: ["TP53", "BRCA1"] },
            { id: "gs3", label: "Set 3", genes: ["TP53", "MYC"] },
        ]);
        expect(matrix.columns).toHaveLength(3);
        expect(matrix.rows).toHaveLength(1);
        expect(matrix.rows[0].gene).toBe("TP53");
        expect(matrix.rows[0].gene_set_count).toBe(3);
    });

    it("sorts rows by crossing gene set count descending", () => {
        const matrix = buildGeneSetGeneMatrix([
            { id: "gs1", label: "Set 1", genes: ["TP53", "BRCA1", "MYC"] },
            { id: "gs2", label: "Set 2", genes: ["TP53", "BRCA1"] },
            { id: "gs3", label: "Set 3", genes: ["TP53", "MYC", "BRCA1"] },
        ]);
        expect(matrix.rows.map((row) => row.gene)).toEqual(["BRCA1", "TP53"]);
        expect(matrix.rows.map((row) => row.gene_set_count)).toEqual([3, 3]);
    });

    it("preserves map genes runs keyed by selected gene sets", () => {
        const nodes = [
            { id: "gene_set:demo:1", label: "Set A", type: "gene_set" },
            { id: "gene_set:demo:2", label: "Set B", type: "gene_set" },
        ];
        const result = {
            columns: [{ id: "gene_set:demo:1", label: "Set A" }],
            rows: [{ row_id: "TP53", gene: "TP53", gene_set_count: 3 }],
            skippedGeneSets: [],
            error: "",
            minGeneSetCount: 3,
        };
        const run = buildMapGenesRun(result, nodes);
        const key = getMapGenesActiveSetKey(nodes);
        expect(mapGenesRunMatchesActiveSet(run, key)).toBe(true);
        expect(mapGenesRunMatchesActiveSet(run, "other")).toBe(false);
    });

    it("builds gene node ids for map-genes add buttons", () => {
        expect(mapGeneNodeId("tp53")).toBe("gene:TP53");
    });

    it("loads gene lists for selected gene sets", async () => {
        const session = {
            highlighted: ["gene_set:demo:20"],
            graphNodes: [
                {
                    id: "gene_set:demo:20",
                    label: "Demo set",
                    type: "gene_set",
                    demo_gene_set: { gene_set_id: 20 },
                },
            ],
        };
        const result = await buildMapGenesMatrixForSession(session, {
            fetchDetail: async () => ({
                gene_symbols: [{ symbol: "TP53" }, { symbol: "BRCA1" }],
            }),
        });
        expect(result.error).toBe("");
        expect(result.columns).toHaveLength(1);
        expect(result.rows).toHaveLength(0);
    });

    it("extracts gene symbols from provenance payloads", () => {
        expect(
            geneSymbolsFromProvenancePayload({
                gene_symbols: [{ symbol: "tp53" }, { symbol: "BRCA1" }, { symbol: "tp53" }],
            })
        ).toEqual(["BRCA1", "TP53"]);
    });

    it("detects map genes queries", () => {
        expect(mentionsMapGenesInQuery("Map genes across selected gene sets")).toBe(true);
        expect(mentionsMapGenesInQuery("show shared genes")).toBe(true);
        expect(mentionsMapGenesInQuery("explain selected nodes")).toBe(false);
    });
});
