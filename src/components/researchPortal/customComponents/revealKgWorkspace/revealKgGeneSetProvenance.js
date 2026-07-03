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
    provenanceDisplayLabel,
    provenanceNodeDimensions,
} from "./revealKgGeneSetProvenanceViz.js";

export const GENE_SET_DETAIL_API_URL =
    "https://translator.broadinstitute.org/genetics_provider/geneset_extractor/gene-set";

export const GENE_SET_PROVENANCE_EXPLORER_URL =
    "https://staging.akleao.com/fork/cfde-geneset-reproducer";

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

export function normalizeGeneSetIdForApi(value) {
    const text = String(value ?? "").trim();
    return text || null;
}

export function geneSetDetailUrl(geneSetId) {
    const id = normalizeGeneSetIdForApi(geneSetId);
    if (!id) {
        return "";
    }
    const params = new URLSearchParams({ gene_set_id: id });
    return `${GENE_SET_DETAIL_API_URL}?${params.toString()}`;
}

/** Incubator / GTEx catalog ids use double-underscore standard_name segments. */
export function isCatalogGeneSetStandardName(value) {
    const text = String(value || "").trim();
    return Boolean(text && text.includes("__") && !/^demo:\d+$/i.test(text));
}

function catalogStandardNameFromNodeId(nodeId) {
    const text = String(nodeId || "").trim();
    const match = text.match(/^gene_set:(.+)$/i);
    if (!match) {
        return null;
    }
    const key = match[1].trim();
    return isCatalogGeneSetStandardName(key) ? key : null;
}

export const GENE_SET_INTERSECTION_SEPARATOR = "___";

export function splitIntersectionGeneSetIds(geneSetId) {
    const id = normalizeGeneSetIdForApi(geneSetId);
    if (!id) {
        return [];
    }
    if (!id.includes(GENE_SET_INTERSECTION_SEPARATOR)) {
        return [id];
    }
    const parts = id
        .split(GENE_SET_INTERSECTION_SEPARATOR)
        .map((part) => part.trim())
        .filter(Boolean);
    const valid = parts.filter(
        (part) => isCatalogGeneSetStandardName(part) || /^\d+$/.test(part)
    );
    if (valid.length >= 2) {
        return valid;
    }
    return [id];
}

export function resolveGeneSetProvenanceIds(node) {
    return splitIntersectionGeneSetIds(resolveGeneSetIdForProvenance(node));
}

export function provenanceSectionHeading(geneSetId) {
    const id = normalizeGeneSetIdForApi(geneSetId);
    return id ? `Gene set provenance: ${id}` : "Gene set provenance";
}

export function resolveGeneSetIdForProvenance(node) {
    const meta = node?.demo_gene_set || {};
    const standardName = String(meta.standard_name || node?.standard_name || "").trim();
    if (standardName) {
        return standardName;
    }
    const metaId = meta.gene_set_id;
    if (typeof metaId === "string" && metaId.trim() && !/^\d+$/.test(metaId.trim())) {
        return metaId.trim();
    }
    const nodeKey = String(node?.node_key || "").trim();
    if (isCatalogGeneSetStandardName(nodeKey)) {
        return nodeKey;
    }
    const fromCatalogId = catalogStandardNameFromNodeId(node?.id || node?.node_id);
    if (fromCatalogId) {
        return fromCatalogId;
    }
    const fromNodeId = String(node?.id || node?.node_id || "").match(/^gene_set:demo:(\d+)$/i);
    const numericCandidates = [metaId, fromNodeId?.[1], node?.gene_set_id];
    for (const candidate of numericCandidates) {
        const num = Number(candidate);
        if (Number.isFinite(num)) {
            return String(num);
        }
    }
    return null;
}

export function formatGeneSetInformationForClipboard({
    geneSetId,
    standardName = "",
    collectionName = "",
    assistantIntention = "",
} = {}) {
    const id = normalizeGeneSetIdForApi(geneSetId);
    const resolvedStandardName = String(standardName || "").trim();
    const lines = [];
    const provenanceUrl = geneSetDetailUrl(id);
    if (provenanceUrl) {
        lines.push(`Gene set provenance URL: ${provenanceUrl}`);
    }
    if (id) {
        lines.push(`Gene set ID: ${id}`);
    }
    if (resolvedStandardName && resolvedStandardName !== id) {
        lines.push(`Standard name: ${resolvedStandardName}`);
    }
    if (String(collectionName || "").trim()) {
        lines.push(`Collection: ${String(collectionName).trim()}`);
    }
    if (String(assistantIntention || "").trim()) {
        lines.push(`User intention: ${String(assistantIntention).trim()}`);
    }
    return lines.join("\n").trim();
}

export function resolveAssistantIntentionForGeneSet(node) {
    return String(node?.demo_gene_set?.assistant_intention || "").trim();
}

export function geneSetInformationEntryFromNode(node) {
    const demoMeta = node?.demo_gene_set || {};
    const geneSetId = resolveGeneSetIdForProvenance(node);
    return {
        nodeId: node?.id || node?.node_id || "",
        label: String(node?.label || "").trim(),
        geneSetId,
        standardName: String(demoMeta.standard_name || node?.label || "").trim(),
        collectionName: String(demoMeta.collection_name || "").trim(),
        assistantIntention: resolveAssistantIntentionForGeneSet(node),
    };
}

export function formatSelectedGeneSetsInformationForClipboard(nodes = []) {
    const entries = (nodes || [])
        .map(geneSetInformationEntryFromNode)
        .filter((entry) => entry.geneSetId);
    if (!entries.length) {
        return "";
    }
    return entries
        .map((entry, index) => {
            const header =
                entries.length > 1
                    ? `Gene set ${index + 1}: ${entry.label || entry.standardName || entry.geneSetId}`
                    : "";
            const body = formatGeneSetInformationForClipboard(entry);
            return header ? `${header}\n${body}` : body;
        })
        .join("\n\n")
        .trim();
}

export function mentionsOpenProvenanceExplorerInQuery(query) {
    const text = String(query || "");
    return (
        /\bopen\b[\s\S]{0,40}\bprovenance\s+explorer\b/i.test(text) ||
        /\bprovenance\s+explorer\b/i.test(text)
    );
}

export async function copyTextToClipboard(text) {
    const value = String(text || "").trim();
    if (!value) {
        throw new Error("Nothing to copy.");
    }
    if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

export function openProvenanceExplorerWindow(url = GENE_SET_PROVENANCE_EXPLORER_URL) {
    const resolved = String(url || "").trim();
    if (!resolved) {
        return false;
    }
    window.open(resolved, "_blank", "noopener,noreferrer");
    return true;
}

export async function gatherCopyAndOpenProvenanceExplorer(nodes = [], url = GENE_SET_PROVENANCE_EXPLORER_URL) {
    const entries = (nodes || [])
        .map(geneSetInformationEntryFromNode)
        .filter((entry) => entry.geneSetId);
    if (!entries.length) {
        throw new Error(
            "Selected gene sets need gene set ids (for example demo gene sets added via the assistant)."
        );
    }
    const clipboardText = formatSelectedGeneSetsInformationForClipboard(nodes);
    await copyTextToClipboard(clipboardText);
    if (!openProvenanceExplorerWindow(url)) {
        throw new Error("Provenance explorer URL is not configured.");
    }
    return {
        geneSetCount: entries.length,
        clipboardText,
        url: String(url || "").trim(),
    };
}

export async function fetchGeneSetProvenanceDetail(geneSetId) {
    const id = normalizeGeneSetIdForApi(geneSetId);
    if (!id) {
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
    return mergeDuplicateProvenanceFileNodes(first?.nodes || [], first?.edges || []);
}

function mergeDuplicateNodeMetadata(primary, duplicate) {
    const merged = { ...primary };
    for (const key of [
        "dcc_url",
        "drc_url",
        "primary_access_url",
        "description",
        "c2m2_properties",
        "analysis",
    ]) {
        if (
            (merged[key] == null || merged[key] === "") &&
            duplicate[key] != null &&
            duplicate[key] !== ""
        ) {
            merged[key] = duplicate[key];
        }
    }
    return merged;
}

function pickCanonicalDuplicateFileNode(group, edges) {
    const ids = new Set(group.map((node) => node.id));
    const scores = new Map(group.map((node) => [node.id, 0]));
    for (const edge of edges || []) {
        if (ids.has(edge.source)) {
            scores.set(edge.source, (scores.get(edge.source) || 0) + 1);
        }
        if (ids.has(edge.target)) {
            scores.set(edge.target, (scores.get(edge.target) || 0) + 1);
        }
    }
    return group
        .slice()
        .sort((left, right) => (scores.get(right.id) || 0) - (scores.get(left.id) || 0))[0];
}

/**
 * Backend provenance sometimes emits the same file twice with different ids (e.g. prepare
 * output and generate input). Merge by display name so the pipeline renders as one graph.
 */
export function mergeDuplicateProvenanceFileNodes(nodes = [], edges = []) {
    const nodeList = [...nodes];
    const edgeList = [...edges];
    const fileNodesByName = new Map();

    for (const node of nodeList) {
        if (String(node?.type || "").trim() !== "File") {
            continue;
        }
        const name = nodeDisplayName(node);
        if (!name) {
            continue;
        }
        if (!fileNodesByName.has(name)) {
            fileNodesByName.set(name, []);
        }
        fileNodesByName.get(name).push(node);
    }

    const idRemap = new Map();
    const mergedNodesById = new Map(nodeList.map((node) => [node.id, { ...node }]));

    for (const group of fileNodesByName.values()) {
        if (group.length < 2) {
            continue;
        }
        const canonical = pickCanonicalDuplicateFileNode(group, edgeList);
        let mergedCanonical = { ...canonical };
        for (const node of group) {
            if (node.id === canonical.id) {
                continue;
            }
            mergedCanonical = mergeDuplicateNodeMetadata(mergedCanonical, node);
            idRemap.set(node.id, canonical.id);
        }
        mergedNodesById.set(canonical.id, mergedCanonical);
    }

    if (!idRemap.size) {
        return { nodes: nodeList, edges: edgeList };
    }

    const mergedNodes = nodeList
        .filter((node) => !idRemap.has(node.id))
        .map((node) => mergedNodesById.get(node.id) || node);

    const mergedEdges = [];
    const edgeKeys = new Set();
    for (const edge of edgeList) {
        const source = idRemap.get(edge.source) || edge.source;
        const target = idRemap.get(edge.target) || edge.target;
        if (source === target) {
            continue;
        }
        const key = `${source}|${target}|${edge.label || ""}`;
        if (edgeKeys.has(key)) {
            continue;
        }
        edgeKeys.add(key);
        mergedEdges.push({ ...edge, source, target });
    }

    return { nodes: mergedNodes, edges: mergedEdges };
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
    const displayLabel = provenanceDisplayLabel(fullLabel, labelPlacement);
    const type = String(node?.type || "").trim();
    const dimensions = provenanceNodeDimensions(fullLabel, labelPlacement, PROVENANCE_NODE_SIZE);
    const base = {
        shape: "custom",
        size: PROVENANCE_NODE_SIZE,
        width: dimensions.width,
        height: dimensions.height,
        label: "",
        fullLabel,
        displayLabel,
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
                displayLabel,
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
                displayLabel,
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
            displayLabel,
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

export function buildProvenanceNetwork(payload) {
    const { nodes, edges } = extractProvenanceGraphBundle(payload);
    return buildProvenanceVisNetwork(nodes, edges);
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
        };
    });
}

function fileAccessForNode(node) {
    const httpUrl = httpDownloadUrl(node);
    if (httpUrl) {
        return { url: httpUrl, access: "direct" };
    }
    const storageUrl = [node?.dcc_url, node?.drc_url, node?.c2m2_properties?.local_id]
        .map((value) => String(value || "").trim())
        .find((value) => /^s3:\/\//i.test(value));
    if (storageUrl) {
        return { url: storageUrl, access: "workflow" };
    }
    return { url: "", access: "none" };
}

export function buildDownloadRegenerateContext(payload) {
    const { nodes, edges } = extractProvenanceGraphBundle(payload);
    const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const workflowOutputFileIds = new Set();
    for (const edge of edges || []) {
        const source = nodeById[edge.source];
        const target = nodeById[edge.target];
        if (source?.type === "AnalysisType" && target?.type === "File") {
            workflowOutputFileIds.add(target.id);
        }
    }
    const sourceFiles = [];
    const seenFileIds = new Set();

    for (const edge of edges || []) {
        const label = String(edge.label || "").toLowerCase();
        const source = nodeById[edge.source];
        const target = nodeById[edge.target];
        if (
            source?.type !== "File" ||
            target?.type !== "AnalysisType" ||
            (!label.includes("input") && !label.includes("metadata")) ||
            workflowOutputFileIds.has(source.id)
        ) {
            continue;
        }
        if (seenFileIds.has(source.id)) {
            continue;
        }
        seenFileIds.add(source.id);
        const access = fileAccessForNode(source);
        sourceFiles.push({
            id: source.id,
            name: nodeDisplayName(source),
            edge_label: edge.label || "",
            download_url: access.access === "direct" ? access.url : "",
            storage_url: access.url,
            access: access.access,
        });
    }

    const workflowSteps = (nodes || [])
        .filter((node) => String(node?.type || "").trim() === "AnalysisType")
        .map((node) => ({
            id: node.id,
            name: nodeDisplayName(node),
            command: String(node?.analysis?.command || "").trim(),
        }));

    const converterCommand = String(
        payload?.geneset_metadata?.converter?.execution?.command?.join?.(" ") ||
            payload?.geneset_metadata?.converter?.execution?.entrypoint ||
            ""
    ).trim();

    return {
        geneSetId: payload?.standard_name || payload?.gene_set_id || null,
        standardName: payload?.standard_name || "",
        collectionName: payload?.collection_name || "",
        sourceFiles,
        workflowSteps,
        converterCommand,
    };
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
    const provenanceNetwork = buildProvenanceNetwork(payload);
    return {
        provenanceNetwork,
        graphTableRows: buildProvenanceGraphTableRows(payload),
        geneRows: buildProvenanceGeneRows(payload),
        biologyContext: buildBiologyContext(payload),
        downloadRegenerate: buildDownloadRegenerateContext(payload),
        standardName: payload?.standard_name || "",
        collectionName: payload?.collection_name || "",
        geneSetId: payload?.standard_name || payload?.gene_set_id || null,
    };
}
