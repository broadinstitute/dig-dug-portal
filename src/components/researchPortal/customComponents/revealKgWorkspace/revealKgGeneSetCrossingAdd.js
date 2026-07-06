/** Crossing (intersection) gene sets: catalog nodes with A___B ids. */

import { CANVAS_ASSISTANT_PER_STEP_MAX } from "./revealKgBulkWorkflowGuidance.js";
import { GENE_SET_INTERSECTION_SEPARATOR } from "./revealKgGeneSetProvenance.js";

const MAX_TOTAL_NODES = CANVAS_ASSISTANT_PER_STEP_MAX;
const DEFAULT_CROSSING_LIMIT = 8;

const KNOWN_GENE_SET_PROGRAMS =
    /\b(?:GTEx|LINCS(?:\s+L1000)?|HuBMAP|MoTrPAC|ENCODE|WikiPathways?)\b/gi;

function normalizeCrossingLimit(limit) {
    if (limit === undefined || limit === null || limit === "") {
        return DEFAULT_CROSSING_LIMIT;
    }
    return Math.min(MAX_TOTAL_NODES, Math.max(1, Number(limit) || DEFAULT_CROSSING_LIMIT));
}

export function mentionsGeneSetCrossingInQuery(query) {
    const text = String(query || "");
    if (!text) {
        return false;
    }
    if (
        /\bcross(?:ed|ing)?\s+with\b/i.test(text) ||
        /\b(?:gene[\s-]?set|signature|program)\s+cross(?:ing|ed)?\b/i.test(text)
    ) {
        return true;
    }
    if (/\bintersect(?:ion|ing|s)?\b/i.test(text)) {
        return true;
    }
    if (/\boverlap(?:ping)?\s+(?:between|of|across)\b/i.test(text)) {
        return true;
    }
    const programs = text.match(KNOWN_GENE_SET_PROGRAMS) || [];
    if (programs.length >= 2 && /\b(?:and|with|×|x)\b/i.test(text)) {
        return true;
    }
    return false;
}

export function shouldUseGeneSetCrossingAdd(query) {
    const text = String(query || "").trim();
    if (!text) {
        return false;
    }
    if (!mentionsGeneSetCrossingInQuery(text)) {
        return false;
    }
    return (
        /\bgene[\s-]?sets?\b/i.test(text) ||
        /\badd\b/i.test(text) ||
        /\bfind\b/i.test(text) ||
        /\bsearch\b/i.test(text)
    );
}

export function isCrossingGeneSetItem(item) {
    if (!item || typeof item !== "object") {
        return false;
    }
    const nodeId = String(item.node_id || item.id || "");
    const nodeKey = String(item.node_key || "");
    const subtitle = String(item.subtitle || "");
    if (
        nodeId.includes(GENE_SET_INTERSECTION_SEPARATOR) ||
        nodeKey.includes(GENE_SET_INTERSECTION_SEPARATOR)
    ) {
        return true;
    }
    if (subtitle.includes("∩")) {
        return true;
    }
    return false;
}

export function filterCrossingGeneSetItems(items = []) {
    return (items || []).filter(isCrossingGeneSetItem);
}

function normalizeCatalogRow(item) {
    const nodeId = item?.node_id || item?.id;
    if (!nodeId) {
        return null;
    }
    return {
        node_id: nodeId,
        node_type: "gene_set",
        type: "gene_set",
        label: item?.label || nodeId,
        subtitle: item?.subtitle || "",
        description: item?.description || "",
        score: item?.score,
    };
}

export async function resolveGeneSetCrossingRows(
    apiClient,
    query,
    limit,
    { existingNodeIds = [] } = {}
) {
    const text = String(query || "").trim();
    if (!text) {
        throw new Error("Describe the crossing gene sets to search for.");
    }
    if (!apiClient?.searchInteractiveGeneSets) {
        throw new Error("Gene set search API is not configured.");
    }

    const cappedLimit = normalizeCrossingLimit(limit);
    const payload = await apiClient.searchInteractiveGeneSets(text, cappedLimit);
    const rawItems = payload?.items || [];
    const crossingItems = filterCrossingGeneSetItems(rawItems);

    const seen = new Set(existingNodeIds || []);
    const rows = [];
    for (const item of crossingItems) {
        const row = normalizeCatalogRow(item);
        if (!row?.node_id || seen.has(row.node_id)) {
            continue;
        }
        seen.add(row.node_id);
        rows.push(row);
        if (rows.length >= MAX_TOTAL_NODES) {
            break;
        }
    }

    if (!rows.length) {
        if (rawItems.length) {
            throw new Error(
                "Gene set matches were found, but none were program crossings (∩). " +
                    "Keep both programs in one search phrase, e.g. \"pancreas GTEx crossed with LINCS\"."
            );
        }
        throw new Error(`No crossing gene sets matched "${text}".`);
    }

    return {
        rows,
        searchQuery: text,
        rawCount: rawItems.length,
        crossingCount: crossingItems.length,
        method: payload?.method || "",
    };
}
