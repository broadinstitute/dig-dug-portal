/** CFDE dataset discovery helpers (Playground InteractiveReveal parity; Canvas uses selected genes). */

import { hierarchyLayerIndex } from "./revealKgGraphColors.js";
import { normalizeKeyNodeIds } from "./revealKgGraphBootstrap.js";

export const CFDE_GRAPH_TRAIT_LAYER = 3;
export const CFDE_DATASET_GRAPH_LIMIT = 15;

function graphNodeSnapshot(node) {
    return {
        id: node.id,
        node_id: node.id,
        label: node.label || node.id,
        type: node.node_type || node.type || "",
        node_type: node.node_type || node.type || "",
        node_key: node.node_key || node.id.split(":").slice(1).join(":"),
        subtitle: node.subtitle || "",
    };
}

export function isGeneNode(node) {
    const nodeType = String(node?.node_type || node?.type || "").toLowerCase();
    return nodeType === "gene";
}

export function getCfdeActiveSetNodesFromSession(session) {
    const selectedIds = new Set(normalizeKeyNodeIds(session));
    return (session?.graphNodes || [])
        .filter((node) => selectedIds.has(node.id))
        .filter(isGeneNode)
        .map(graphNodeSnapshot);
}

export function getCfdeActiveSetKey(activeSetNodes) {
    return (activeSetNodes || [])
        .map((node) => node.id || node.node_id)
        .filter(Boolean)
        .sort()
        .join("|");
}

export function cfdeDatasetRunMatchesActiveSet(run, activeSetKey) {
    if (!run || !activeSetKey) {
        return false;
    }
    if (run.status !== "success" && run.status !== "error") {
        return false;
    }
    return getCfdeActiveSetKey(run.activeSetNodes || []) === activeSetKey;
}

export function buildCfdeDatasetRun(activeSetNodes) {
    return {
        id: `cfde-dataset-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: "loading",
        startedAt: new Date().toISOString(),
        completedAt: "",
        activeSetNodes: activeSetNodes || [],
        payload: null,
        error: "",
    };
}

export function patchCfdeDatasetRun(run, patch) {
    if (!run) {
        return run;
    }
    return { ...run, ...patch };
}

export function formatCfdeDatasetRunHeadline(datasetCount, status) {
    if (status === "loading") {
        return "Finding CFDE gene sets for selected genes";
    }
    if (status === "error") {
        return "CFDE gene-set search failed";
    }
    if (!datasetCount) {
        return "No CFDE gene sets found";
    }
    return `${datasetCount} CFDE gene set${datasetCount === 1 ? "" : "s"} for selected genes`;
}

function formatCfdeDatasetSourceValue(value) {
    if (value == null || value === "") {
        return "";
    }
    if (Array.isArray(value)) {
        return value.map((entry) => String(entry || "").trim()).filter(Boolean).join(", ");
    }
    return String(value).trim();
}

export function resolveCfdeDatasetSource(item = {}, candidate = {}) {
    const raw =
        candidate.source ||
        candidate.data_source ||
        candidate.source_kind ||
        candidate.source_gmt ||
        candidate.source_gmts ||
        item.source ||
        item.data_source ||
        item.source_kind ||
        item.source_gmt ||
        item.source_gmts ||
        "";
    return formatCfdeDatasetSourceValue(raw);
}

export function cfdeDatasetRowsHaveSource(rows = []) {
    return (rows || []).some((row) => Boolean(row?.source));
}

export function buildCfdeDatasetTableRows(datasets = []) {
    return (datasets || []).map((item) => {
        const candidate = item.candidate || {};
        return {
            node_id: candidate.node_id || candidate.id,
            label: candidate.label || candidate.node_id || candidate.id,
            subtitle: candidate.subtitle || "",
            source: resolveCfdeDatasetSource(item, candidate),
            aggregate_score: item.aggregate_score,
            raw_max_score: item.raw_max_score,
            raw_mean_score: item.raw_mean_score,
            support_anchor_count: item.support_anchor_count,
            support_path_count: item.support_path_count,
        };
    });
}

export function mapCfdeGraphNodes(graphPayload, activeSetNodeIds = []) {
    const activeIds = new Set(activeSetNodeIds);
    return (graphPayload?.nodes || [])
        .filter((node) => hierarchyLayerIndex(node) !== CFDE_GRAPH_TRAIT_LAYER)
        .map((node) => {
            const id = node.id || node.node_id;
            return {
                id,
                label: node.label || id,
                node_type: node.node_type || node.type || "",
                type: node.node_type || node.type || "",
                is_anchor: activeIds.has(id),
            };
        });
}

export function mapCfdeGraphEdges(graphPayload, graphNodes = []) {
    const nodeIds = new Set(graphNodes.map((node) => node.id));
    return (graphPayload?.edges || []).filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
}

export function buildCfdeDatasetSearchPayload(session, activeSetNodes) {
    return {
        active_items: activeSetNodes,
        context: session?.context || "",
        reducer: "mean",
        graph_limit: CFDE_DATASET_GRAPH_LIMIT,
    };
}

export function cfdeDatasetRunTimestampLabel(run) {
    const raw = run?.completedAt || run?.startedAt;
    if (!raw) {
        return "";
    }
    try {
        return new Date(raw).toLocaleString();
    } catch {
        return "";
    }
}

export function cfdeDatasetRunSummaryLabel(run) {
    const count = run?.payload?.datasets?.length || 0;
    if (!count) {
        return "No gene sets found";
    }
    return `${count} gene set${count === 1 ? "" : "s"}`;
}

export function successfulCfdeDatasetRuns(session) {
    const runs = session?.datasetRuns || session?.dataProvenanceRuns || [];
    return runs.filter((run) => run.status === "success").slice().reverse();
}

export function datasetRunsFromSession(session) {
    if (!session) {
        return [];
    }
    const byId = new Map();
    const addRun = (run) => {
        if (!run?.id) {
            return;
        }
        const previous = byId.get(run.id);
        byId.set(run.id, previous ? { ...previous, ...run } : run);
    };
    const provenanceRuns = Array.isArray(session.dataProvenanceRuns)
        ? session.dataProvenanceRuns
        : [];
    const datasetRuns = Array.isArray(session.datasetRuns) ? session.datasetRuns : [];
    if (provenanceRuns.length) {
        for (const run of provenanceRuns) {
            addRun(run);
        }
    }
    for (const run of datasetRuns) {
        addRun(run);
    }
    if (session.datasetRun?.id) {
        addRun(session.datasetRun);
    }
    return Array.from(byId.values()).sort((left, right) => {
        const leftTime = Date.parse(left?.completedAt || left?.startedAt || 0);
        const rightTime = Date.parse(right?.completedAt || right?.startedAt || 0);
        return rightTime - leftTime;
    });
}

export function activeCfdeDatasetRunFromSession(session, runs = null) {
    const mergedRuns = runs || datasetRunsFromSession(session);
    if (session?.datasetRun?.id) {
        return (
            mergedRuns.find((run) => run.id === session.datasetRun.id) ||
            session.datasetRun
        );
    }
    return mergedRuns.find((run) => run.status === "success") || mergedRuns[0] || null;
}
