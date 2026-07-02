import {
    buildBiologyContext,
    buildDownloadRegenerateContext,
    buildProvenanceNetwork,
    buildProvenanceGeneRows,
    buildProvenanceGraphTableRows,
    formatGeneSetInformationForClipboard,
    formatSelectedGeneSetsInformationForClipboard,
    GENE_SET_DETAIL_API_URL,
    geneSetDetailUrl,
    mentionsOpenProvenanceExplorerInQuery,
    mergeDuplicateProvenanceFileNodes,
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
                    dcc_url: "s3://dig-gene-set-data/GTEx/input/GTEx_Analysis_gene_reads.gct.gz",
                },
                {
                    id: "file:human_gene_info:2",
                    name: "human_gene_info",
                    type: "File",
                    dcc_url: "s3://dig-gene-set-data/GTEx/input/human_gene_info",
                },
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
                demo_gene_set: {
                    gene_set_id: 20,
                    standard_name: "GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn",
                },
            })
        ).toBe("GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn");
        expect(
            resolveGeneSetIdForProvenance({
                id: "gene_set:demo:20",
                demo_gene_set: { gene_set_id: 20 },
            })
        ).toBe("20");
        expect(resolveGeneSetIdForProvenance({ id: "gene_set:INSULIN" })).toBeNull();
    });

    it("builds gene-set detail URLs with encoded standard names", () => {
        const standardName = "GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_30-39_up";
        expect(geneSetDetailUrl(standardName)).toBe(
            `${GENE_SET_DETAIL_API_URL}?gene_set_id=${encodeURIComponent(standardName)}`
        );
    });

    it("truncates long provenance labels", () => {
        const longName = "GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn";
        expect(truncateProvenanceLabel(longName).length).toBe(28);
        expect(truncateProvenanceLabel(longName).endsWith("…")).toBe(true);
    });

    it("builds a merged provenance network across workflow stages", () => {
        const network = buildProvenanceNetwork(SAMPLE_PAYLOAD);
        const labels = network.nodes.map((node) => node.fullLabel);

        expect(network.nodes).toHaveLength(8);
        expect(network.edges).toHaveLength(7);
        expect(labels).toEqual(
            expect.arrayContaining([
                "prepare_deg_long",
                "generate_a8837b7d30de6203bcead87f",
                "GTEx_Analysis_gene_reads.gct.gz",
                "deg_long.tsv",
                "comparison_manifest.tsv",
                "GTEx_aging_AdiposeTissue_20-29_50-59",
                "geneset.tsv",
            ])
        );

        const byLabel = Object.fromEntries(
            network.nodes.map((node) => [node.fullLabel, node.labelPlacement])
        );
        expect(byLabel["GTEx_Analysis_gene_reads.gct.gz"]).toBe("left");
        expect(byLabel["prepare_deg_long"]).toBe("below");
        expect(byLabel["deg_long.tsv"]).toBe("below");
        expect(byLabel["generate_a8837b7d30de6203bcead87f"]).toBe("below");
        expect(byLabel["GTEx_aging_AdiposeTissue_20-29_50-59"]).toBe("right");
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
        const network = buildProvenanceNetwork(SAMPLE_PAYLOAD);
        const fileNode = network.nodes.find((node) => node.fullLabel.includes("gene_reads"));
        const edge = network.edges[0];
        expect(fileNode.detail.description).toContain("expression_gct");
        expect(edge.detail.description).toContain("data input");
    });

    it("builds download and regenerate context from provenance inputs", () => {
        const context = buildDownloadRegenerateContext(SAMPLE_PAYLOAD);
        expect(context.geneSetId).toBe(SAMPLE_PAYLOAD.standard_name);
        expect(context.sourceFiles).toHaveLength(2);
        expect(context.sourceFiles[0]).toMatchObject({
            name: "GTEx_Analysis_gene_reads.gct.gz",
            access: "workflow",
        });
        expect(context.workflowSteps.map((step) => step.name)).toEqual([
            "prepare_deg_long",
            "generate_a8837b7d30de6203bcead87f",
        ]);
    });

    it("formats gene set information for clipboard copy", () => {
        const standardName = "GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn";
        const text = formatGeneSetInformationForClipboard({
            geneSetId: standardName,
            standardName,
            collectionName: "GTEx",
            assistantIntention: "add Type 2 diabetes related gene sets from demo gene sets.",
        });
        expect(text).toContain(geneSetDetailUrl(standardName));
        expect(text).toContain(`Gene set ID: ${standardName}`);
        expect(text).not.toContain("Standard name:");
        expect(text).toContain("User intention: add Type 2 diabetes related gene sets");
    });

    it("formats selected gene sets for clipboard copy", () => {
        const nodes = [
            {
                id: "gene_set:demo:20",
                label: "GTEx adipose aging",
                node_type: "gene_set",
                demo_gene_set: {
                    gene_set_id: 20,
                    standard_name: "GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn",
                    collection_name: "GTEx",
                    assistant_intention: "add aging gene sets from demo gene sets.",
                },
            },
            {
                id: "gene_set:demo:21",
                label: "GTEx liver aging",
                node_type: "gene_set",
                demo_gene_set: {
                    gene_set_id: 21,
                    standard_name: "GTEx__liver__GTEx_aging_Liver_20-29_50-59_dn",
                    collection_name: "GTEx",
                },
            },
        ];
        const text = formatSelectedGeneSetsInformationForClipboard(nodes);
        expect(text).toContain("Gene set 1: GTEx adipose aging");
        expect(text).toContain("Gene set 2: GTEx liver aging");
        expect(text).toContain(
            "Gene set ID: GTEx__adipose_tissue__GTEx_aging_AdiposeTissue_20-29_50-59_dn"
        );
        expect(text).toContain("Gene set ID: GTEx__liver__GTEx_aging_Liver_20-29_50-59_dn");
        expect(text).toContain("User intention: add aging gene sets");
    });

    it("detects provenance explorer requests in assistant queries", () => {
        expect(mentionsOpenProvenanceExplorerInQuery("Open provenance explorer")).toBe(true);
        expect(mentionsOpenProvenanceExplorerInQuery("copy gene set information")).toBe(false);
    });

    it("parses full provenance payload", () => {
        const parsed = parseGeneSetProvenancePayload(SAMPLE_PAYLOAD);
        expect(parsed.geneSetId).toBe(SAMPLE_PAYLOAD.standard_name);
        expect(parsed.provenanceNetwork.nodes).toHaveLength(8);
        expect(parsed.graphTableRows.length).toBe(7);
        expect(parsed.geneRows.length).toBe(2);
        expect(parsed.biologyContext.length).toBeGreaterThan(0);
        expect(parsed.downloadRegenerate.sourceFiles).toHaveLength(2);
    });

    it("merges duplicate file nodes so multi-stage pipelines render as one graph", () => {
        const nodes = [
            { id: "file:in:1", name: "gene_attribute_matrix.txt.gz", type: "File" },
            { id: "file:in:2", name: "human_gene_info", type: "File" },
            { id: "analysis:prepare:1", name: "prepare_hubmap_unsigned_term_gene", type: "AnalysisType" },
            {
                id: "file:bridge:out",
                name: "hubmap_unsigned_term_gene.tsv",
                type: "File",
            },
            {
                id: "file:bridge:in",
                name: "hubmap_unsigned_term_gene.tsv",
                type: "File",
            },
            { id: "analysis:generate:1", name: "generate_32775607f3", type: "AnalysisType" },
            {
                id: "geneset:1",
                name: "unsigned_term_gene:32775607",
                type: "GeneSet",
            },
        ];
        const edges = [
            { id: "e1", source: "file:in:1", target: "analysis:prepare:1", label: "data input" },
            { id: "e2", source: "file:in:2", target: "analysis:prepare:1", label: "data input" },
            {
                id: "e3",
                source: "analysis:prepare:1",
                target: "file:bridge:out",
                label: "data output",
            },
            {
                id: "e4",
                source: "file:bridge:in",
                target: "analysis:generate:1",
                label: "data input",
            },
            {
                id: "e5",
                source: "analysis:generate:1",
                target: "geneset:1",
                label: "data output",
            },
        ];

        const merged = mergeDuplicateProvenanceFileNodes(nodes, edges);
        expect(merged.nodes).toHaveLength(6);
        expect(merged.edges).toHaveLength(5);

        const prepareOut = merged.edges.find(
            (edge) => edge.source === "analysis:prepare:1" && edge.label === "data output"
        );
        const generateIn = merged.edges.find(
            (edge) => edge.target === "analysis:generate:1" && edge.label === "data input"
        );
        expect(prepareOut?.target).toBeTruthy();
        expect(prepareOut.target).toBe(generateIn?.source);
    });
});
