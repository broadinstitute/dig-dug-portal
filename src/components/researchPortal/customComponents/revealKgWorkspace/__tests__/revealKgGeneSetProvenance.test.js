import {
    buildBiologyContext,
    buildGeneSetPathNetwork,
    buildProvenanceGeneRows,
    buildProvenanceGraphTableRows,
    buildSummaryPathNetwork,
    parseGeneSetProvenancePayload,
    resolveGeneSetIdForProvenance,
    truncateProvenanceLabel,
} from "../revealKgGeneSetProvenance.js";

const SAMPLE_PAYLOAD = {
    gene_set_id: 177,
    collection_name: "GTEx",
    license_code: "CC-BY-4.0",
    standard_name: "GTEx__rna_sc_programs__dataset=parietal_epithelial_cell__signature=gene_loadings__program=Factor_10",
    tags: null,
    geneset_metadata: {
        gene_set: {
            assay: "single_cell",
            data_type: "rna_seq",
            description: "Single-cell RNA-seq program gene set for parietal_epithelial_cell.",
            genome_build: "hg38",
            n_genes: 250,
            name: "parietal_epithelial_cell | gene_loadings",
            organism: "human",
        },
    },
    gene_symbols: [
        { gene_symbol_id: 1, symbol: "EGR1" },
        { gene_symbol_id: 2, symbol: "JUNB" },
    ],
    provenance_graph: {
        abc123: {
            nodes: [
                {
                    id: "file:h5ad:1",
                    name: "parietal epithelial cell.h5ad",
                    type: "File",
                    description: "File node for parietal epithelial cell.h5ad (role: h5ad)",
                },
                { id: "file:r:2", name: "liger_inmf.R", type: "File" },
                {
                    id: "analysis:scrna_liger_prepare:1",
                    name: "prepare_prepare_summary",
                    type: "AnalysisType",
                    dcc_url: "https://github.com/flannick/dig-gene-set-extractors",
                },
                { id: "file:json:3", name: "prepare_summary.json", type: "File" },
                { id: "file:loadings:4", name: "gene_loadings.tsv", type: "File" },
                {
                    id: "analysis:rna_sc_programs:1",
                    name: "generate_abc123",
                    type: "AnalysisType",
                },
                {
                    id: "geneset:abc123",
                    name: "parietal_epithelial_cell | gene_loadings",
                    type: "GeneSet",
                },
                { id: "file:geneset:5", name: "geneset.tsv", type: "File" },
            ],
            edges: [
                {
                    id: "e1",
                    label: "data input",
                    description: "parietal epithelial cell.h5ad is a data input to analysis.",
                    source: "file:h5ad:1",
                    target: "analysis:scrna_liger_prepare:1",
                },
                {
                    id: "e2",
                    label: "data output",
                    source: "analysis:scrna_liger_prepare:1",
                    target: "file:json:3",
                },
                {
                    id: "e3",
                    label: "data input",
                    source: "file:loadings:4",
                    target: "analysis:rna_sc_programs:1",
                },
                {
                    id: "e4",
                    label: "data output",
                    source: "analysis:rna_sc_programs:1",
                    target: "geneset:abc123",
                },
            ],
        },
    },
};

describe("revealKgGeneSetProvenance", () => {
    it("resolves gene set id from demo graph nodes", () => {
        expect(
            resolveGeneSetIdForProvenance({
                id: "gene_set:demo:177",
                demo_gene_set: { gene_set_id: 177 },
            })
        ).toBe(177);
        expect(resolveGeneSetIdForProvenance({ id: "gene_set:INSULIN" })).toBeNull();
    });

    it("truncates long provenance labels", () => {
        const longName = "GTEx__rna_sc_programs__dataset=parietal_epithelial_cell__signature=gene_loadings";
        expect(truncateProvenanceLabel(longName).length).toBe(28);
        expect(truncateProvenanceLabel(longName).endsWith("…")).toBe(true);
    });

    it("splits summary and gene set path networks", () => {
        const summary = buildSummaryPathNetwork(SAMPLE_PAYLOAD);
        const geneSet = buildGeneSetPathNetwork(SAMPLE_PAYLOAD);
        expect(summary.nodes.map((node) => node.fullLabel)).toEqual(
            expect.arrayContaining(["prepare_prepare_summary", "parietal epithelial cell.h5ad"])
        );
        expect(geneSet.nodes.map((node) => node.fullLabel)).toEqual(
            expect.arrayContaining([
                "generate_abc123",
                "gene_loadings.tsv",
                "parietal_epithelial_cell | gene_loadings",
            ])
        );
        expect(summary.nodes.map((node) => node.fullLabel)).not.toContain("generate_abc123");

        const summaryByLabel = Object.fromEntries(
            summary.nodes.map((node) => [node.fullLabel, node.labelPlacement])
        );
        expect(summaryByLabel["parietal epithelial cell.h5ad"]).toBe("left");
        expect(summaryByLabel["prepare_prepare_summary"]).toBe("below");
        expect(summaryByLabel["prepare_summary.json"]).toBe("right");

        const geneSetByLabel = Object.fromEntries(
            geneSet.nodes.map((node) => [node.fullLabel, node.labelPlacement])
        );
        expect(geneSetByLabel["gene_loadings.tsv"]).toBe("left");
        expect(geneSetByLabel["generate_abc123"]).toBe("below");
        expect(geneSetByLabel["parietal_epithelial_cell | gene_loadings"]).toBe("right");
    });

    it("builds graph table rows and gene rows", () => {
        const tableRows = buildProvenanceGraphTableRows(SAMPLE_PAYLOAD);
        expect(tableRows).toHaveLength(4);
        expect(tableRows[0]).toMatchObject({
            source: "parietal epithelial cell.h5ad",
            source_type: "File",
            target: "prepare_prepare_summary",
            edge_name: "data input",
        });
        const genes = buildProvenanceGeneRows(SAMPLE_PAYLOAD);
        expect(genes).toHaveLength(2);
        expect(genes[0]).toMatchObject({ gene: "EGR1", score_1: "—" });
    });

    it("builds biology context rows", () => {
        const rows = buildBiologyContext(SAMPLE_PAYLOAD);
        expect(rows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "collection", value: "GTEx" }),
                expect.objectContaining({ id: "organism", value: "human" }),
                expect.objectContaining({ id: "license", value: "CC-BY-4.0" }),
                expect.objectContaining({ id: "program", value: "Factor_10" }),
            ])
        );
    });

    it("attaches node and edge detail payloads for viz clicks", () => {
        const summary = buildSummaryPathNetwork(SAMPLE_PAYLOAD);
        const fileNode = summary.nodes.find((node) => node.fullLabel.includes("h5ad"));
        const edge = summary.edges[0];
        expect(fileNode.detail.description).toContain("parietal epithelial cell.h5ad");
        expect(edge.detail.description).toContain("data input");
    });

    it("parses full provenance payload", () => {
        const parsed = parseGeneSetProvenancePayload(SAMPLE_PAYLOAD);
        expect(parsed.geneSetId).toBe(177);
        expect(parsed.graphTableRows.length).toBe(4);
        expect(parsed.geneRows.length).toBe(2);
        expect(parsed.biologyContext.length).toBeGreaterThan(0);
    });
});
