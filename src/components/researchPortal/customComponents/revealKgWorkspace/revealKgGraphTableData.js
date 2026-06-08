/** Tabbed graph table rows (Playground retrieved-nodes ledger parity). */

import { getLedgerShownReasonForSession } from "./revealKgGraphFilterUtils.js";

export const GRAPH_TABLE_PAGE_SIZE = 10;

export const GRAPH_TABLE_TABS = [
    { key: "gene", label: "Genes" },
    { key: "gene_set", label: "Gene sets" },
    { key: "factor", label: "Mechanisms" },
    { key: "trait", label: "Traits" },
];

export function formatGraphTableValue(value, digits = 3) {
    if (value === null || value === undefined || value === "") {
        return "NA";
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toFixed(digits);
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
        return numeric.toFixed(digits);
    }
    return String(value);
}

function toFiniteNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeGraphTableNodeType(nodeOrEntry) {
    const type = String(
        nodeOrEntry?.node_type || nodeOrEntry?.type || ""
    ).toLowerCase();
    if (type === "mechanism") {
        return "factor";
    }
    if (GRAPH_TABLE_TABS.some((tab) => tab.key === type)) {
        return type;
    }
    return "";
}

function mean(values) {
    if (!values.length) {
        return null;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildGraphNodeScoreMap(graphEdges = [], contextualEdges = []) {
    const scoresByNode = new Map();
    const allEdges = [...(graphEdges || []), ...(contextualEdges || [])];

    for (const edge of allEdges) {
        const norm = toFiniteNumber(edge.normalized_score ?? edge.weight ?? edge.score);
        const raw = toFiniteNumber(edge.raw_score ?? edge.score ?? edge.normalized_score);
        for (const nodeId of [edge.source, edge.target]) {
            if (!nodeId) {
                continue;
            }
            const bucket = scoresByNode.get(nodeId) || { norms: [], raws: [] };
            if (norm != null) {
                bucket.norms.push(norm);
            }
            if (raw != null) {
                bucket.raws.push(raw);
            }
            scoresByNode.set(nodeId, bucket);
        }
    }
    return scoresByNode;
}

function scoresForNode(nodeId, scoresByNode) {
    const bucket = scoresByNode.get(nodeId);
    if (!bucket?.norms?.length) {
        return {
            aggregate_score: null,
            raw_max_score: null,
            raw_mean_score: null,
        };
    }
    const norms = bucket.norms;
    const raws = bucket.raws.length ? bucket.raws : norms;
    return {
        aggregate_score: Math.max(...norms),
        raw_max_score: Math.max(...raws),
        raw_mean_score: mean(raws),
    };
}

function sortTableRows(rows) {
    return [...rows].sort((left, right) => {
        const scoreDiff =
            (right.aggregate_score ?? -Infinity) - (left.aggregate_score ?? -Infinity);
        if (scoreDiff !== 0) {
            return scoreDiff;
        }
        return String(left.label).localeCompare(String(right.label), undefined, {
            sensitivity: "base",
        });
    });
}

export function buildGraphTableRowsFromLedger(
    retrievalLedger = {},
    session = {},
    graphEdges = [],
    contextualEdges = [],
    keyNodeIds = []
) {
    const keyIds = new Set((keyNodeIds || []).filter(Boolean));
    const scoresByNode = buildGraphNodeScoreMap(graphEdges, contextualEdges);
    const rowsByType = Object.fromEntries(GRAPH_TABLE_TABS.map((tab) => [tab.key, []]));

    for (const entry of Object.values(retrievalLedger || {})) {
        const nodeType = normalizeGraphTableNodeType(entry);
        if (!nodeType || !rowsByType[nodeType]) {
            continue;
        }
        const edgeScores = scoresForNode(entry.node_id, scoresByNode);
        rowsByType[nodeType].push({
            node_id: entry.node_id,
            label: entry.label || entry.node_id,
            node_type: nodeType,
            subtitle: entry.subtitle || "",
            is_key_node: keyIds.has(entry.node_id),
            aggregate_score: entry.aggregate_score ?? edgeScores.aggregate_score,
            raw_max_score: entry.raw_max_score ?? edgeScores.raw_max_score,
            raw_mean_score: entry.raw_mean_score ?? edgeScores.raw_mean_score,
            novelty_label: entry.novelty_label || "NYA",
            relevance_label: entry.relevance_label || "NYA",
            rationale: entry.rationale || entry.subtitle || "NYA",
            shown: getLedgerShownReasonForSession(session, entry),
        });
    }

    for (const type of Object.keys(rowsByType)) {
        rowsByType[type] = sortTableRows(rowsByType[type]);
    }

    return rowsByType;
}

export function graphTableTabsForLedger(retrievalLedger = {}) {
    const counts = Object.fromEntries(GRAPH_TABLE_TABS.map((tab) => [tab.key, 0]));
    for (const entry of Object.values(retrievalLedger || {})) {
        const nodeType = normalizeGraphTableNodeType(entry);
        if (nodeType && counts[nodeType] != null) {
            counts[nodeType] += 1;
        }
    }
    const tabs = GRAPH_TABLE_TABS.filter((tab) => counts[tab.key] > 0);
    return tabs.length ? tabs : GRAPH_TABLE_TABS.slice(0, 3);
}

export function downloadGraphTableCsv(filename, rows) {
    const header = [
        "Name",
        "Aggregate score",
        "Max score",
        "Mean score",
        "Novelty",
        "Relevance",
        "Description",
        "Shown",
    ];
    const body = (rows || []).map((row) => [
        row.label || row.node_id,
        formatGraphTableValue(row.aggregate_score, 3),
        formatGraphTableValue(row.raw_max_score, 3),
        formatGraphTableValue(row.raw_mean_score, 3),
        row.novelty_label || "NYA",
        row.relevance_label || "NYA",
        row.rationale || "NYA",
        row.shown || "",
    ]);
    const lines = [header, ...body].map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
