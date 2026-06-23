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
    gene_set_id: 20,
    collection_name: "GTEx",
    license_code: "CC-BY-4.0",
    standard_name: "GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn",
    tags: null,
    geneset_metadata: {
        gene_set: {
            assay: "bulk",
            data_type: "rna_seq",
            description:
                "Bulk RNA-seq gene set and comparison 'GTEx_aging_AdiposeTissue_20-29_50-59' derived from differential expression results and ranked by stat.",
            genome_build: "hg38",
            n_genes: 33872,
            name: "GTEx_aging_AdiposeTissue_20-29_50-59",
            organism: "human",
        },
    },
    gene_symbols: [
        { gene_symbol_id: 251, symbol: "NWD2" },
        { gene_symbol_id: 252, symbol: "CYP4F32P" },
    ],
    provenance_graph: {
        a8837b7d30de6203bcead87f: {
            nodes: [
                {
                    id: "file:expression_gct:1",
                    name: "GTEx_Analysis_gene_reads.gct.gz",
                    type: "File",
                    description: "File node for GTEx_Analysis_gene_reads.gct.gz (role: expression_gct)",
                },
                { id: "file:human_gene_info:2", name: "human_gene_info", type: "File" },
                {
                    id: "analysis:gtex_aging_signatures:1",
                    name: "prepare_deg_long",
                    type: "AnalysisType",
                },
                { id: "file:deg_tsv:3", name: "deg_long.tsv", type: "File" },
                { id: "file:comparison_manifest:4", name: "comparison_manifest.tsv", type: "File" },
                {
                    id: "analysis:rna_deg_multi:1",
                    name: "generate_a8837b7d30de6203bcead87f",
                    type: "AnalysisType",
                },
                {
                    id: "geneset:a8837b7d30de6203bcead87f",
                    name: "GTEx_aging_AdiposeTissue_20-29_50-59",
                    type: "GeneSet",
                },
                { id: "file:geneset:5", name: "geneset.tsv", type: "File" },
            ],
            edges: [
                {
                    id: "e1",
                    label: "data input",
                    description: "GTEx_Analysis_gene_reads.gct.gz is a data input to analysis.",
                    source: "file:expression_gct:1",
                    target: "analysis:gtex_aging_signatures:1",
                },
                {
                    id: "e2",
                    label: "data input",
                    source: "file:human_gene_info:2",
                    target: "analysis:gtex_aging_signatures:1",
                },
                {
                    id: "e3",
                    label: "data output",
                    source: "analysis:gtex_aging_signatures:1",
                    target: "file:deg_tsv:3",
                },
                {
                    id: "e4",
                    label: "data output",
                    source: "analysis:gtex_aging_signatures:1",
                    target: "file:comparison_manifest:4",
                },
                {
                    id: "e5",
                    label: "data input",
                    source: "file:deg_tsv:3",
                    target: "analysis:rna_deg_multi:1",
                },
                {
                    id: "e6",
                    label: "data output",
                    source: "analysis:rna_deg_multi:1",
                    target: "geneset:a8837b7d30de6203bcead87f",
                },
                {
                    id: "e7",
                    label: "data output",
                    source: "analysis:rna_deg_multi:1",
                    target: "file:geneset:5",
                },
            ],
        },
    },
};

describe("revealKgGeneSetProvenance", () => {
    it("resolves gene set id from demo graph nodes", () => {
        expect(
            resolveGeneSetIdForProvenance({
                id: "gene_set:demo:20",
                demo_gene_set: { gene_set_id: 20 },
            })
        ).toBe(20);
        expect(resolveGeneSetIdForProvenance({ id: "gene_set:INSULIN" })).toBeNull();
    });

    it("truncates long provenance labels", () => {
        const longName = "GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn";
        expect(truncateProvenanceLabel(longName).length).toBe(28);
        expect(truncateProvenanceLabel(longName).endsWith("…")).toBe(true);
    });

    it("splits summary and gene set path networks", () => {
        const summary = buildSummaryPathNetwork(SAMPLE_PAYLOAD);
        const geneSet = buildGeneSetPathNetwork(SAMPLE_PAYLOAD);
        const summaryLabels = summary.nodes.map((node) => node.fullLabel);
        const geneSetLabels = geneSet.nodes.map((node) => node.fullLabel);

        expect(summaryLabels).toEqual(
            expect.arrayContaining([
                "prepare_deg_long",
                "GTEx_Analysis_gene_reads.gct.gz",
                "human_gene_info",
                "deg_long.tsv",
                "comparison_manifest.tsv",
            ])
        );
        expect(geneSetLabels).toEqual(
            expect.arrayContaining([
                "generate_a8837b7d30de6203bcead87f",
                "deg_long.tsv",
                "GTEx_aging_AdiposeTissue_20-29_50-59",
                "geneset.tsv",
            ])
        );
        expect(summaryLabels).not.toContain("generate_a8837b7d30de6203bcead87f");
        expect(summaryLabels).not.toContain("geneset.tsv");
        expect(geneSetLabels).not.toContain("GTEx_Analysis_gene_reads.gct.gz");
        expect(geneSetLabels).not.toContain("prepare_deg_long");

        const summaryByLabel = Object.fromEntries(
            summary.nodes.map((node) => [node.fullLabel, node.labelPlacement])
        );
        expect(summaryByLabel["GTEx_Analysis_gene_reads.gct.gz"]).toBe("left");
        expect(summaryByLabel["prepare_deg_long"]).toBe("below");
        expect(summaryByLabel["deg_long.tsv"]).toBe("right");

        const geneSetByLabel = Object.fromEntries(
            geneSet.nodes.map((node) => [node.fullLabel, node.labelPlacement])
        );
        expect(geneSetByLabel["deg_long.tsv"]).toBe("left");
        expect(geneSetByLabel["generate_a8837b7d30de6203bcead87f"]).toBe("below");
        expect(geneSetByLabel["GTEx_aging_AdiposeTissue_20-29_50-59"]).toBe("right");
    });

    it("builds graph table rows and gene rows", () => {
        const tableRows = buildProvenanceGraphTableRows(SAMPLE_PAYLOAD);
        expect(tableRows).toHaveLength(7);
        expect(tableRows[0]).toMatchObject({
            source: "GTEx_Analysis_gene_reads.gct.gz",
            source_type: "File",
            target: "prepare_deg_long",
            edge_name: "data input",
        });
        const genes = buildProvenanceGeneRows(SAMPLE_PAYLOAD);
        expect(genes).toHaveLength(2);
        expect(genes[0]).toMatchObject({ gene: "NWD2", score_1: "—" });
    });

    it("builds biology context rows", () => {
        const rows = buildBiologyContext(SAMPLE_PAYLOAD);
        expect(rows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "collection", value: "GTEx" }),
                expect.objectContaining({ id: "organism", value: "human" }),
                expect.objectContaining({ id: "license", value: "CC-BY-4.0" }),
                expect.objectContaining({ id: "modality", value: "bulk" }),
                expect.objectContaining({
                    id: "title",
                    value: "GTEx_aging_AdiposeTissue_20-29_50-59",
                }),
            ])
        );
    });

    it("attaches node and edge detail payloads for viz clicks", () => {
        const summary = buildSummaryPathNetwork(SAMPLE_PAYLOAD);
        const fileNode = summary.nodes.find((node) => node.fullLabel.includes("gene_reads"));
        const edge = summary.edges[0];
        expect(fileNode.detail.description).toContain("expression_gct");
        expect(edge.detail.description).toContain("data input");
    });

    it("parses full provenance payload", () => {
        const parsed = parseGeneSetProvenancePayload(SAMPLE_PAYLOAD);
        expect(parsed.geneSetId).toBe(20);
        expect(parsed.graphTableRows.length).toBe(7);
        expect(parsed.geneRows.length).toBe(2);
        expect(parsed.biologyContext.length).toBeGreaterThan(0);
    });
});
