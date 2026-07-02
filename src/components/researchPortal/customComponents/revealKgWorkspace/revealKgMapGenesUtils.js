/** Map genes shared across selected gene sets (Analyze → Map genes). */

import { normalizeKeyNodeIds } from "./revealKgGraphBootstrap.js";
import {
    fetchGeneSetProvenanceDetail,
    resolveGeneSetIdForProvenance,
} from "./revealKgGeneSetProvenance.js";

export const MAP_GENES_MIN_GENE_SET_COUNT = 3;

export function mentionsMapGenesInQuery(query) {
    const text = String(query || "");
    return (
        /\bmap\s+genes?\b/i.test(text) ||
        /\bgene\s+membership\b/i.test(text) ||
        /\b(?:shared|common|overlapping)\s+genes?\b/i.test(text) ||
        /\bgenes?\s+(?:shared|common|across)\b/i.test(text) ||
        /\bgenes?\s+across\s+(?:selected\s+)?gene[\s-]?sets?\b/i.test(text)
    );
}

function graphNodeSnapshot(node) {
    return {
        id: node.id,
        node_id: node.id,
        label: node.label || node.id,
        type: node.node_type || node.type || "",
        node_type: node.node_type || node.type || "",
        subtitle: node.subtitle || "",
    };
}

export function isGeneSetNode(node) {
    const nodeType = String(node?.node_type || node?.type || "").toLowerCase();
    return nodeType === "gene_set";
}

export function getSelectedGeneSetNodesFromSession(session) {
    const selectedIds = new Set(normalizeKeyNodeIds(session));
    return (session?.graphNodes || [])
        .filter((node) => selectedIds.has(node.id))
        .filter(isGeneSetNode)
        .map(graphNodeSnapshot);
}

export function getSelectedGeneSetGraphNodesFromSession(session) {
    const selectedIds = new Set(normalizeKeyNodeIds(session));
    return (session?.graphNodes || [])
        .filter((node) => selectedIds.has(node.id))
        .filter(isGeneSetNode);
}

export function geneSymbolsFromProvenancePayload(payload) {
    const symbols = Array.isArray(payload?.gene_symbols) ? payload.gene_symbols : [];
    return [
        ...new Set(
            symbols
                .map((row) => String(row?.symbol || "").trim().toUpperCase())
                .filter(Boolean)
        ),
    ].sort((left, right) => left.localeCompare(right));
}

/**
 * @param {Array<{ id: string, label: string, genes: string[] }>} geneSetMembers
 * @param {{ minGeneSetCount?: number }} [options] genes must appear in more than 2 sets by default
 */
export function buildGeneSetGeneMatrix(geneSetMembers = [], options = {}) {
    const minGeneSetCount = Number(options.minGeneSetCount) || MAP_GENES_MIN_GENE_SET_COUNT;
    const members = geneSetMembers || [];
    const columns = members.map((member) => ({
        id: member.id,
        label: member.label || member.id,
    }));
    const geneToSetIds = new Map();

    for (const member of members) {
        for (const gene of member.genes || []) {
            const symbol = String(gene || "").trim().toUpperCase();
            if (!symbol) {
                continue;
            }
            if (!geneToSetIds.has(symbol)) {
                geneToSetIds.set(symbol, new Set());
            }
            geneToSetIds.get(symbol).add(member.id);
        }
    }

    const rows = [];
    for (const [gene, setIds] of geneToSetIds.entries()) {
        if (setIds.size < minGeneSetCount) {
            continue;
        }
        const row = {
            row_id: gene,
            gene,
            gene_set_count: setIds.size,
        };
        for (const column of columns) {
            row[column.id] = setIds.has(column.id);
        }
        rows.push(row);
    }

    rows.sort((left, right) => {
        const countDiff = (right.gene_set_count || 0) - (left.gene_set_count || 0);
        if (countDiff !== 0) {
            return countDiff;
        }
        return String(left.gene || "").localeCompare(String(right.gene || ""));
    });

    return { columns, rows, minGeneSetCount };
}

export function getMapGenesActiveSetKey(geneSetNodes = []) {
    return (geneSetNodes || [])
        .map((node) => node.id || node.node_id)
        .filter(Boolean)
        .sort()
        .join("|");
}

export function buildMapGenesRun(result, geneSetNodes = []) {
    const activeSetNodes = (geneSetNodes || []).map(graphNodeSnapshot);
    const activeSetKey = getMapGenesActiveSetKey(activeSetNodes);
    const hasColumns = Boolean(result?.columns?.length);
    return {
        id: `map-genes-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: result?.error && !hasColumns ? "error" : "success",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        activeSetNodes,
        activeSetKey,
        columns: result?.columns || [],
        rows: result?.rows || [],
        skippedGeneSets: result?.skippedGeneSets || [],
        error: result?.error || "",
        minGeneSetCount: result?.minGeneSetCount || MAP_GENES_MIN_GENE_SET_COUNT,
    };
}

export function mapGenesRunMatchesActiveSet(run, activeSetKey) {
    if (!run || !activeSetKey) {
        return false;
    }
    if (run.status !== "success" && run.status !== "error") {
        return false;
    }
    return String(run.activeSetKey || "") === String(activeSetKey || "");
}

export function mapGeneNodeId(symbol) {
    const label = String(symbol || "").trim().toUpperCase();
    return label ? `gene:${label}` : "";
}

export async function buildMapGenesMatrixForSession(
    session,
    { fetchDetail = fetchGeneSetProvenanceDetail } = {}
) {
    const geneSetNodes = getSelectedGeneSetNodesFromSession(session);
    if (!geneSetNodes.length) {
        return {
            geneSetNodes: [],
            columns: [],
            rows: [],
            skippedGeneSets: [],
            minGeneSetCount: MAP_GENES_MIN_GENE_SET_COUNT,
            error: "Mark one or more gene sets as selected on the canvas before mapping genes.",
        };
    }

    const members = [];
    const skippedGeneSets = [];

    for (const node of geneSetNodes) {
        const geneSetId = resolveGeneSetIdForProvenance(node);
        if (!geneSetId) {
            skippedGeneSets.push({
                id: node.id,
                label: node.label,
                reason: "No gene set id is available for this node.",
            });
            continue;
        }
        try {
            const payload = await fetchDetail(geneSetId);
            members.push({
                id: node.id,
                label: node.label,
                geneSetId,
                genes: geneSymbolsFromProvenancePayload(payload),
            });
        } catch (error) {
            skippedGeneSets.push({
                id: node.id,
                label: node.label,
                reason: String(error?.message || error || "Could not load gene list."),
            });
        }
    }

    if (!members.length) {
        return {
            geneSetNodes,
            columns: [],
            rows: [],
            skippedGeneSets,
            minGeneSetCount: MAP_GENES_MIN_GENE_SET_COUNT,
            error: "Could not load gene lists for the selected gene sets.",
        };
    }

    const matrix = buildGeneSetGeneMatrix(members);
    return {
        geneSetNodes,
        skippedGeneSets,
        ...matrix,
        error: "",
    };
}
