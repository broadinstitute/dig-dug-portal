/** Gene set provenance from Translator geneset_extractor gene-set API. */

import {
    ACTIVE_SET_NODE_COLOR,
    TREE_VIEW_DEFAULT_NODE_COLOR,
    TREE_VIEW_EDGE_COLOR,
    TREE_VIEW_KEY_NODE_COLOR,
} from "./revealKgGraphColors.js";
import {
    classifyProvenanceNodeRoles,
    createProvenanceCtxRenderer,
    labelPlacementForRole,
    provenanceNodeDimensions,
} from "./revealKgGeneSetProvenanceViz.js";

export const GENE_SET_DETAIL_API_URL =
    "https://translator.broadinstitute.org/genetics_provider/geneset_extractor/gene-set";

const GENE_SET_NODE_COLOR = ACTIVE_SET_NODE_COLOR;
const ANALYSIS_COLOR = TREE_VIEW_KEY_NODE_COLOR;
const FILE_COLOR = TREE_VIEW_DEFAULT_NODE_COLOR;
const EDGE_COLOR = TREE_VIEW_EDGE_COLOR;
/** Matches WorkspaceTreeGraphCanvas TREE_VIEW_NODE_RADIUS (12 * NODE_RADIUS_SCALE). */
const PROVENANCE_NODE_SIZE = 12 * 0.75;

export const PROVENANCE_LABEL_MAX_LENGTH = 28;

export function truncateProvenanceLabel(text, max = PROVENANCE_LABEL_MAX_LENGTH) {
    const value = String(text || "");
    if (value.length <= max) {
        return value;
    }
    return `${value.slice(0, max - 1)}…`;
}

export function geneSetDetailUrl(geneSetId) {
    const id = Number(geneSetId);
    if (!Number.isFinite(id)) {
        return "";
    }
    return `${GENE_SET_DETAIL_API_URL}?gene_set_id=${id}`;
}

export function resolveGeneSetIdForProvenance(node) {
    const fromMeta = Number(node?.demo_gene_set?.gene_set_id);
    if (Number.isFinite(fromMeta)) {
        return fromMeta;
    }
    const match = String(node?.id || node?.node_id || "").match(/^gene_set:demo:(\d+)$/i);
    if (match) {
        return Number(match[1]);
    }
    const generic = Number(node?.gene_set_id);
    return Number.isFinite(generic) ? generic : null;
}

export async function fetchGeneSetProvenanceDetail(geneSetId) {
    const id = Number(geneSetId);
    if (!Number.isFinite(id)) {
        throw new Error("A valid gene set id is required.");
    }
    const response = await fetch(geneSetDetailUrl(id), {
        headers: { Accept: "application/json" },
        cache: "no-store",
    });
    if (!response.ok) {
        let message = `Gene set provenance request failed (${response.status}).`;
        try {
            const payload = await response.json();
            if (payload?.error) {
                message = String(payload.error);
            }
        } catch {
            // ignore parse errors
        }
        throw new Error(message);
    }
    return response.json();
}

export function extractProvenanceGraphBundle(payload) {
    const graphMap = payload?.provenance_graph;
    if (!graphMap || typeof graphMap !== "object") {
        return { nodes: [], edges: [] };
    }
    const first = Object.values(graphMap).find(
        (entry) => Array.isArray(entry?.nodes) && Array.isArray(entry?.edges)
    );
    return {
        nodes: first?.nodes || [],
        edges: first?.edges || [],
    };
}

function nodeDisplayName(node) {
    return String(node?.name || node?.id || "").trim();
}

function formatBiologyValue(value) {
    if (value == null || value === "") {
        return "";
    }
    if (Array.isArray(value)) {
        return value.filter(Boolean).join(", ");
    }
    return String(value);
}

function programIdFromPayload(payload) {
    const fromStandard = String(payload?.standard_name || "").match(/program=([^_]+(?:_\d+)?)/i);
    return (
        payload?.geneset_metadata?.program_extraction?.program_id ||
        fromStandard?.[1] ||
        ""
    );
}

export function buildBiologyContext(payload) {
    const geneSetMeta = payload?.geneset_metadata?.gene_set || {};
    const rows = [
        { id: "collection", label: "Collection", value: payload?.collection_name },
        { id: "resource", label: "Resource", value: payload?.collection_name },
        { id: "standard_name", label: "Standard name", value: payload?.standard_name },
        { id: "title", label: "Title", value: geneSetMeta.name },
        { id: "license", label: "License", value: payload?.license_code },
        { id: "organism", label: "Organism", value: geneSetMeta.organism },
        {
            id: "modality",
            label: "Modality",
            value: geneSetMeta.assay || geneSetMeta.data_type,
        },
        { id: "data_type", label: "Data type", value: geneSetMeta.data_type },
        { id: "genome_build", label: "Genome build", value: geneSetMeta.genome_build },
        { id: "program", label: "Program", value: programIdFromPayload(payload) },
        { id: "gene_count", label: "Gene count", value: geneSetMeta.n_genes },
        { id: "description", label: "Description", value: geneSetMeta.description },
        { id: "tags", label: "Tags", value: formatBiologyValue(payload?.tags) },
    ];
    return rows
        .map((row) => ({ ...row, value: formatBiologyValue(row.value) }))
        .filter((row) => row.value);
}

function buildNodeDetail(node) {
    const name = nodeDisplayName(node);
    const type = String(node?.type || "").trim();
    const c2m2 = node?.c2m2_properties || {};
    const httpUrl = httpDownloadUrl(node);
    return {
        kind: "node",
        title: name,
        nodeType: type,
        description: String(node?.description || "").trim(),
        httpUrl,
        analysisCommand: String(node?.analysis?.command || "").trim(),
        fileMeta:
            type === "File" && (c2m2.filename || c2m2.size_in_bytes)
                ? {
                      filename: c2m2.filename || name,
                      sizeBytes: c2m2.size_in_bytes ?? null,
                      md5: c2m2.md5 || "",
                  }
                : null,
    };
}

function buildEdgeDetail(edge, nodeById) {
    const sourceNode = nodeById[edge.source];
    const targetNode = nodeById[edge.target];
    return {
        kind: "edge",
        title: edge.label || "Connection",
        label: String(edge.label || "").trim(),
        description: String(edge.description || "").trim(),
        sourceName: nodeDisplayName(sourceNode),
        targetName: nodeDisplayName(targetNode),
        sourceType: sourceNode?.type || "",
        targetType: targetNode?.type || "",
    };
}

function isSummaryAnalysisNode(node) {
    const id = String(node?.id || "");
    const name = String(node?.name || "");
    return (
        id.includes("gtex_aging_signatures") ||
        id.includes("scrna_liger_prepare") ||
        name === "prepare_deg_long" ||
        name === "prepare_prepare_summary"
    );
}

function isGeneSetAnalysisNode(node) {
    const id = String(node?.id || "");
    const name = String(node?.name || "");
    return (
        id.includes("rna_deg_multi") ||
        id.includes("rna_sc_programs") ||
        name.startsWith("generate_")
    );
}

function nodeIdsForAnalysis(nodes, edges, analysisMatcher) {
    const analysisIds = new Set(
        (nodes || []).filter(analysisMatcher).map((node) => node.id).filter(Boolean)
    );
    if (!analysisIds.size) {
        return new Set();
    }
    const included = new Set(analysisIds);
    for (const edge of edges || []) {
        if (analysisIds.has(edge.source) || analysisIds.has(edge.target)) {
            if (edge.source) {
                included.add(edge.source);
            }
            if (edge.target) {
                included.add(edge.target);
            }
        }
    }
    return included;
}

function visNodeStyle(node, fullLabel, labelPlacement) {
    const type = String(node?.type || "").trim();
    const dimensions = provenanceNodeDimensions(fullLabel, labelPlacement, PROVENANCE_NODE_SIZE);
    const base = {
        shape: "custom",
        size: PROVENANCE_NODE_SIZE,
        width: dimensions.width,
        height: dimensions.height,
        label: "",
        fullLabel,
        labelPlacement,
        font: {
            color: "#33363d",
            size: 13,
            face: "inherit",
            strokeWidth: 0,
        },
        borderWidth: 1,
    };
    if (type === "GeneSet") {
        const colors = {
            background: GENE_SET_NODE_COLOR,
            border: GENE_SET_NODE_COLOR,
        };
        return {
            ...base,
            color: {
                background: colors.background,
                border: colors.border,
                highlight: { background: colors.background, border: colors.border },
            },
            ctxRenderer: createProvenanceCtxRenderer({
                fullLabel,
                labelPlacement,
                backgroundColor: colors.background,
                borderColor: colors.border,
                size: PROVENANCE_NODE_SIZE,
            }),
        };
    }
    if (type === "AnalysisType") {
        const colors = {
            background: ANALYSIS_COLOR,
            border: ANALYSIS_COLOR,
        };
        return {
            ...base,
            color: {
                background: colors.background,
                border: colors.border,
                highlight: { background: colors.background, border: colors.border },
            },
            ctxRenderer: createProvenanceCtxRenderer({
                fullLabel,
                labelPlacement,
                backgroundColor: colors.background,
                borderColor: colors.border,
                size: PROVENANCE_NODE_SIZE,
            }),
        };
    }
    const colors = {
        background: FILE_COLOR,
        border: FILE_COLOR,
    };
    return {
        ...base,
        color: {
            background: colors.background,
            border: colors.border,
            highlight: { background: colors.background, border: colors.border },
        },
        ctxRenderer: createProvenanceCtxRenderer({
            fullLabel,
            labelPlacement,
            backgroundColor: colors.background,
            borderColor: colors.border,
            size: PROVENANCE_NODE_SIZE,
        }),
    };
}

export function buildProvenanceVisNetwork(nodes, edges) {
    const nodeList = nodes || [];
    const edgeList = edges || [];
    const nodeById = Object.fromEntries(nodeList.map((node) => [node.id, node]));
    const roles = classifyProvenanceNodeRoles(nodeList, edgeList);
    const visNodes = nodeList.map((node) => {
        const fullLabel = nodeDisplayName(node);
        const labelPlacement = labelPlacementForRole(roles[node.id] || "source");
        return {
            id: node.id,
            detail: buildNodeDetail(node),
            ...visNodeStyle(node, fullLabel, labelPlacement),
        };
    });
    const visEdges = edgeList.map((edge, index) => ({
        id: edge.id || `edge-${index}`,
        from: edge.source,
        to: edge.target,
        detail: buildEdgeDetail(edge, nodeById),
        arrows: { to: { enabled: true, scaleFactor: 0.65 } },
        arrowStrikethrough: false,
        chosen: false,
        color: {
            color: EDGE_COLOR,
            highlight: EDGE_COLOR,
            hover: EDGE_COLOR,
        },
        width: 1,
        smooth: { type: "cubicBezier", forceDirection: "horizontal", roundness: 0.35 },
    }));
    return { nodes: visNodes, edges: visEdges };
}

export function buildSummaryPathNetwork(payload) {
    const { nodes, edges } = extractProvenanceGraphBundle(payload);
    const ids = nodeIdsForAnalysis(nodes, edges, isSummaryAnalysisNode);
    const filteredNodes = nodes.filter((node) => ids.has(node.id));
    const filteredEdges = edges.filter(
        (edge) => ids.has(edge.source) && ids.has(edge.target)
    );
    return buildProvenanceVisNetwork(filteredNodes, filteredEdges);
}

export function buildGeneSetPathNetwork(payload) {
    const { nodes, edges } = extractProvenanceGraphBundle(payload);
    const ids = nodeIdsForAnalysis(nodes, edges, isGeneSetAnalysisNode);
    const filteredNodes = nodes.filter((node) => ids.has(node.id));
    const filteredEdges = edges.filter(
        (edge) => ids.has(edge.source) && ids.has(edge.target)
    );
    return buildProvenanceVisNetwork(filteredNodes, filteredEdges);
}

function httpDownloadUrl(node) {
    const candidates = [node?.dcc_url, node?.drc_url, node?.primary_access_url];
    for (const value of candidates) {
        const text = String(value || "").trim();
        if (/^https?:\/\//i.test(text)) {
            return text;
        }
    }
    return "";
}

function downloadUrlForEdge(edge, nodeById) {
    const source = nodeById[edge.source];
    const target = nodeById[edge.target];
    const label = String(edge.label || "").toLowerCase();
    if (label.includes("input") && source?.type === "File") {
        return httpDownloadUrl(source);
    }
    if (label.includes("output") && target?.type === "File") {
        return httpDownloadUrl(target);
    }
    if (source?.type === "File") {
        return httpDownloadUrl(source);
    }
    if (target?.type === "File") {
        return httpDownloadUrl(target);
    }
    if (source?.type === "AnalysisType") {
        return httpDownloadUrl(source);
    }
    if (target?.type === "GeneSet") {
        return httpDownloadUrl(target);
    }
    return "";
}

export function buildProvenanceGraphTableRows(payload) {
    const { nodes, edges } = extractProvenanceGraphBundle(payload);
    const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
    return (edges || []).map((edge, index) => {
        const sourceNode = nodeById[edge.source];
        const targetNode = nodeById[edge.target];
        return {
            row_id: edge.id || `edge-${index}`,
            source: nodeDisplayName(sourceNode),
            source_type: sourceNode?.type || "",
            target: nodeDisplayName(targetNode),
            edge_name: edge.label || "",
            download_url: downloadUrlForEdge(edge, nodeById),
        };
    });
}

export function buildProvenanceGeneRows(payload) {
    const symbols = Array.isArray(payload?.gene_symbols) ? payload.gene_symbols : [];
    return symbols.map((row, index) => ({
        row_id: row.gene_symbol_id || `gene-${index}`,
        gene: row.symbol || "",
        score_1: "—",
        score_2: "—",
        score_3: "—",
    }));
}

export function parseGeneSetProvenancePayload(payload) {
    return {
        summaryNetwork: buildSummaryPathNetwork(payload),
        geneSetNetwork: buildGeneSetPathNetwork(payload),
        graphTableRows: buildProvenanceGraphTableRows(payload),
        geneRows: buildProvenanceGeneRows(payload),
        biologyContext: buildBiologyContext(payload),
        standardName: payload?.standard_name || "",
        collectionName: payload?.collection_name || "",
        geneSetId: payload?.gene_set_id ?? null,
    };
}
