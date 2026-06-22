/** One-off demo gene sets from Translator geneset_extractor (incomplete catalog). */

import {
    markGraphNodesShownInLedger,
    mergeRetrievalLedger,
} from "./revealKgRetrievalLedger.js";

export const DEMO_GENE_SET_API_URL =
    "https://translator.broadinstitute.org/genetics_provider/geneset_extractor/gene-sets";

export const DEMO_GENE_SET_QUERY_PREFIX = "demo:";

const DEMO_GENE_SET_NODE_ID_PATTERN = /^gene_set:demo:\d+$/i;

let catalogCache = null;
let catalogPromise = null;

export function parseDemoGeneSetSearchTerm(query) {
    const trimmed = String(query || "").trim();
    const lower = trimmed.toLowerCase();
    if (!lower.startsWith(DEMO_GENE_SET_QUERY_PREFIX)) {
        return null;
    }
    return trimmed.slice(DEMO_GENE_SET_QUERY_PREFIX.length).trim();
}

export function isDemoGeneSetSearchQuery(query) {
    return parseDemoGeneSetSearchTerm(query) !== null;
}

function normalizeCatalogRecord(row) {
    if (!row || typeof row !== "object") {
        return null;
    }
    const geneSetId = Number(row.gene_set_id);
    const standardName = String(row.standard_name || "").trim();
    if (!Number.isFinite(geneSetId) || !standardName) {
        return null;
    }
    return {
        collection_name: String(row.collection_name || "").trim(),
        gene_set_id: geneSetId,
        license_code: String(row.license_code || "").trim(),
        standard_name: standardName,
        tags: row.tags ?? null,
    };
}

export async function fetchDemoGeneSetsCatalog({ forceRefresh = false } = {}) {
    if (!forceRefresh && catalogCache) {
        return catalogCache;
    }
    if (!forceRefresh && catalogPromise) {
        return catalogPromise;
    }
    catalogPromise = (async () => {
        const response = await fetch(DEMO_GENE_SET_API_URL, {
            headers: { Accept: "application/json" },
        });
        if (!response.ok) {
            throw new Error(`Demo gene set catalog request failed (${response.status}).`);
        }
        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : payload?.items || [];
        catalogCache = rows.map(normalizeCatalogRecord).filter(Boolean);
        return catalogCache;
    })();
    try {
        return await catalogPromise;
    } catch (error) {
        catalogPromise = null;
        throw error;
    } finally {
        if (catalogCache) {
            catalogPromise = null;
        }
    }
}

export function filterDemoGeneSets(records, searchTerm, limit = 8) {
    const list = Array.isArray(records) ? records : [];
    const term = String(searchTerm || "").trim().toLowerCase();
    const filtered = term
        ? list.filter((row) => row.standard_name.toLowerCase().includes(term))
        : list;
    return filtered.slice(0, Math.max(1, Number(limit) || 8));
}

export function formatDemoGeneSetLabel(standardName) {
    return String(standardName || "")
        .trim()
        .replace(/__/g, " · ")
        .replace(/_/g, " ");
}

export function demoGeneSetNodeId(record) {
    return `gene_set:demo:${record.gene_set_id}`;
}

export function demoGeneSetProvenanceFromRecord(record) {
    return {
        collection_name: record.collection_name,
        gene_set_id: record.gene_set_id,
        license_code: record.license_code,
        standard_name: record.standard_name,
        tags: record.tags,
        source_url: DEMO_GENE_SET_API_URL,
        source_label: "Translator geneset_extractor",
    };
}

export function demoGeneSetCatalogItem(record) {
    const provenance = demoGeneSetProvenanceFromRecord(record);
    return {
        node_id: demoGeneSetNodeId(record),
        node_type: "gene_set",
        type: "gene_set",
        label: formatDemoGeneSetLabel(record.standard_name),
        subtitle: `${record.collection_name || "Demo"} · demo gene set`,
        demo_gene_set: provenance,
    };
}

export function isDemoGeneSetGraphNode(node) {
    if (node?.demo_gene_set?.standard_name) {
        return true;
    }
    return DEMO_GENE_SET_NODE_ID_PATTERN.test(String(node?.id || node?.node_id || ""));
}

export function demoGeneSetProvenanceForNode(node) {
    if (node?.demo_gene_set?.standard_name) {
        return node.demo_gene_set;
    }
    const match = String(node?.id || node?.node_id || "").match(/^gene_set:demo:(\d+)$/i);
    if (!match) {
        return null;
    }
    const geneSetId = Number(match[1]);
    if (!Number.isFinite(geneSetId) || !catalogCache) {
        return null;
    }
    const record = catalogCache.find((row) => row.gene_set_id === geneSetId);
    return record ? demoGeneSetProvenanceFromRecord(record) : null;
}

function mergeOriginTags(existing, additions) {
    return [...new Set([...(existing || []), ...(additions || [])])];
}

function normalizeDemoGraphNode(raw) {
    const id = raw.id || raw.node_id;
    if (!id) {
        return null;
    }
    return {
        ...raw,
        id,
        node_id: id,
        type: "gene_set",
        node_type: "gene_set",
        label: raw.label || id,
        subtitle: raw.subtitle || "Demo gene set",
        is_anchor: false,
        origin_tags: mergeOriginTags(raw.origin_tags, ["manual", "demo_gene_set"]),
        demo_gene_set: raw.demo_gene_set || null,
    };
}

/**
 * Place demo gene sets on the graph without node-links API (not in REVEAL catalog).
 */
export function addDemoGeneSetsToGraphLocally(session, rows = []) {
    const items = (rows || [])
        .map((row) => ({
            node_id: row.node_id || row.id,
            node_type: "gene_set",
            type: "gene_set",
            label: row.label || row.node_id,
            subtitle: row.subtitle || "Demo gene set",
            demo_gene_set: row.demo_gene_set || null,
        }))
        .filter((item) => item.node_id && item.demo_gene_set?.standard_name);

    if (!items.length) {
        return session;
    }

    const graphNodes = [...(session.graphNodes || [])];
    const existingIds = new Set(graphNodes.map((node) => node.id));
    const newItems = items.filter((item) => !existingIds.has(item.node_id));
    if (!newItems.length) {
        return session;
    }

    for (const item of newItems) {
        graphNodes.push(normalizeDemoGraphNode(item));
    }

    const reasonByNodeId = Object.fromEntries(newItems.map((item) => [item.node_id, "yes"]));
    let retrievalLedger = mergeRetrievalLedger(
        { retrievalLedger: session.retrievalLedger || {} },
        newItems.map((item) => ({
            candidate: {
                node_id: item.node_id,
                node_type: "gene_set",
                label: item.label,
                subtitle: item.subtitle,
            },
            aggregate_score: 0,
            raw_max_score: 0,
            raw_mean_score: 0,
        })),
        { reasonByNodeId }
    );
    retrievalLedger = markGraphNodesShownInLedger(retrievalLedger, graphNodes);

    return {
        ...session,
        graphNodes,
        retrievalLedger,
    };
}
