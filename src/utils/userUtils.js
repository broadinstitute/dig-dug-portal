// Utility functions for custom user data

//function to save custom phenotype list for user
function savePhenotypes(phenotypes) {
    localStorage.setItem("_phenotypes", JSON.stringify(phenotypes));
}

//function to get custom phenotype list for user
function getPhenotypes() {
    return JSON.parse(localStorage.getItem("_phenotypes"));
}

//function to clear custom phenotype list for user
function clearPhenotypes() {
    localStorage.removeItem("_phenotypes");
}

//function to add a phenotype to the custom phenotype list for user
//phenotype: object with name and id
function addPhenotype(phenotype) {
    if (!!phenotype) {
        //check if phenotype have name and id
        if (!phenotype.name || !phenotype.id) {
            console.error("Phenotype input is missing name or id");
            return;
        }

        let phenotypes = getPhenotypes();
        if (phenotypes === null) {
            phenotypes = [];
        }
        let index = phenotypes.findIndex(p => p.id === phenotype.id);
        if (index === -1) {
            phenotypes.push(phenotype);
            savePhenotypes(phenotypes);
        } else {
            console.error("Phenotype already exists");
        }
    } else {
        console.error("Phenotype is null");
        return;
    }
}

//function to remove a phenotype from the custom phenotype list for user
//phenotype: object with name and id
function removePhenotype(phenotype) {
    if (!!phenotype) {
        let phenotypes = getPhenotypes();
        if (phenotypes === null) {
            phenotypes = [];
        }
        let index = phenotypes.findIndex(p => p.id === phenotype.id);
        if (index > -1) {
            phenotypes.splice(index, 1);
            savePhenotypes(phenotypes);
        }
    } else {
        console.error("Phenotype is null");
        return;
    }
}

function saveContext(GROUP, context) {
    //console.log(GROUP, context)
    localStorage.setItem(GROUP, JSON.stringify(context));
}

function getContext(GROUP) {
    //console.log(GROUP)
    return JSON.parse(localStorage.getItem(GROUP));
}

function clearContext(GROUP) {
    //console.log(GROUP)
    localStorage.removeItem(GROUP);
}

// ---------------------------------------------------------------------------
// REVEAL KG Canvas — saved graphs (localStorage)
// One store for all saved graphs. A seed-only graph is just nodes with no edges.
// Records are normalized on read/write so the Library and canvas can share one shape.
// ---------------------------------------------------------------------------

const REVEAL_KG_GRAPHS_KEY = "_reveal_kg_graphs";
const REVEAL_KG_CANVAS_OPEN_COUNT_KEY = "_reveal_kg_canvas_open_count";
const REVEAL_KG_LEARN_COMPANION_MAX_OPENS = 5;
const REVEAL_KG_GRAPH_SCHEMA_VERSION = 1;
const MAX_SAVED_GRAPHS = 50;
const GRAPH_STORE_QUOTA_ERROR = "GRAPH_STORE_QUOTA_EXCEEDED";
const GRAPH_STORE_WRITE_ERROR = "GRAPH_STORE_WRITE_FAILED";

let lastGraphSaveWarning = "";

function isStorageQuotaError(error) {
    return (
        error?.name === "QuotaExceededError" ||
        (error instanceof DOMException && (error.code === 22 || error.code === 1014))
    );
}

function estimateJsonBytes(value) {
    try {
        return new Blob([JSON.stringify(value)]).size;
    } catch (e) {
        return 0;
    }
}

function formatStorageBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) {
        return `${size} B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function emptyInspectorCacheFields() {
    return {
        nodeConnectionEvidenceCache: {},
        nodeExpressionProfileCache: {},
        nodeExpressionReferenceById: {},
        edgeProvenanceById: {},
        nodeSigChainPacketCache: {},
        nodeFactorLoadingsCache: {},
    };
}

function stripInspectorCachesFromPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return payload;
    }
    return {
        ...payload,
        ...emptyInspectorCacheFields(),
    };
}

function consumeGraphSaveWarning() {
    const warning = lastGraphSaveWarning;
    lastGraphSaveWarning = "";
    return warning;
}

function makeGraphId() {
    return `g_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function cloneJson(value, fallback) {
    if (value === null || value === undefined) {
        return fallback;
    }
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return fallback;
    }
}

function graphNodesFromRecord(record) {
    if (Array.isArray(record?.nodes) && record.nodes.length) {
        return record.nodes;
    }
    if (Array.isArray(record?.graphNodes) && record.graphNodes.length) {
        return record.graphNodes;
    }
    return [];
}

function graphEdgesFromRecord(record) {
    if (Array.isArray(record?.edges)) {
        return record.edges;
    }
    if (Array.isArray(record?.graphEdges)) {
        return record.graphEdges;
    }
    return [];
}

function graphNodeIdSet(nodes) {
    const ids = new Set();
    for (const node of nodes || []) {
        if (node?.id) {
            ids.add(node.id);
        }
        if (node?.node_id) {
            ids.add(node.node_id);
        }
    }
    return ids;
}

function highlightedFromRecord(record, nodes) {
    // Saved graphs store selected node ids in `highlighted` (legacy field name).
    const raw =
        record?.highlighted ||
        record?.highlightedNodeIds ||
        record?.reanchorSelection ||
        [];
    const nodeIds = graphNodeIdSet(nodes);
    return Array.from(new Set((raw || []).filter((id) => nodeIds.has(id))));
}

function sigChainRunsFromSession(session) {
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
    const hypothesisRuns = Array.isArray(session.hypotheses) ? session.hypotheses : [];
    const sigChainRuns = Array.isArray(session.sigChainRuns) ? session.sigChainRuns : [];
    if (hypothesisRuns.length) {
        for (const run of hypothesisRuns) {
            addRun(run);
        }
    }
    for (const run of sigChainRuns) {
        addRun(run);
    }
    if (session.sigChainRun?.id) {
        addRun(session.sigChainRun);
    }
    return Array.from(byId.values()).sort((left, right) => {
        const leftTime = Date.parse(left?.completedAt || left?.startedAt || 0);
        const rightTime = Date.parse(right?.completedAt || right?.startedAt || 0);
        return rightTime - leftTime;
    });
}

function activeSigChainRunFromSession(session, runs = null) {
    const mergedRuns = runs || sigChainRunsFromSession(session);
    if (session?.sigChainRun?.id) {
        return (
            mergedRuns.find((run) => run.id === session.sigChainRun.id) ||
            session.sigChainRun
        );
    }
    return mergedRuns.find((run) => run.status === "success") || mergedRuns[0] || null;
}

function datasetRunsFromSession(session) {
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

function activeDatasetRunFromSession(session, runs = null) {
    const mergedRuns = runs || datasetRunsFromSession(session);
    if (session?.datasetRun?.id) {
        return (
            mergedRuns.find((run) => run.id === session.datasetRun.id) ||
            session.datasetRun
        );
    }
    return mergedRuns.find((run) => run.status === "success") || mergedRuns[0] || null;
}

//normalize inbound graph/session payloads into the canonical saved record
function normalizeGraphRecord(record) {
    if (!record || typeof record !== "object") {
        return null;
    }
    const nodes = cloneJson(graphNodesFromRecord(record), []);
    if (!nodes.length) {
        return null;
    }
    const edges = cloneJson(graphEdgesFromRecord(record), []);
    const savedAt = record.savedAt || new Date().toISOString();
    return {
        schemaVersion: REVEAL_KG_GRAPH_SCHEMA_VERSION,
        id: record.id || makeGraphId(),
        savedAt,
        label: String(record.label || "").trim() || "Untitled graph",
        context: String(record.context || ""),
        nodes,
        edges,
        highlighted: highlightedFromRecord(record, nodes),
        controls: cloneJson(record.controls, {}),
        visibilityFilters: cloneJson(record.visibilityFilters, {}),
        visibilityFilterLayers: cloneJson(record.visibilityFilterLayers, []),
        appliedGraphFilter: record.appliedGraphFilter
            ? cloneJson(record.appliedGraphFilter, null)
            : null,
        retrievalLedger: cloneJson(record.retrievalLedger, {}),
        contextualEdges: cloneJson(record.contextualEdges, []),
        contextualEdgeSignature: String(record.contextualEdgeSignature || ""),
        // Optional analysis payloads persisted with the graph (when present).
        hypotheses: cloneJson(record.hypotheses || record.sigChainRuns, []),
        dataProvenanceRuns: cloneJson(
            record.dataProvenanceRuns || record.datasetRuns,
            []
        ),
        graphInterpretations: cloneJson(record.graphInterpretations, []),
        graphInterpretation: cloneJson(record.graphInterpretation, null),
        explainContext: String(record.explainContext || record.context || ""),
        starterBuckets: cloneJson(record.starterBuckets, null),
        addNeighboringNodes:
            record.addNeighboringNodes !== undefined ? record.addNeighboringNodes : false,
        // Library graphs never store inspector caches (use Export graph for full workflow data).
        ...emptyInspectorCacheFields(),
    };
}

function readGraphStore() {
    try {
        const raw = localStorage.getItem(REVEAL_KG_GRAPHS_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.map(normalizeGraphRecord).filter(Boolean);
    } catch (e) {
        console.error("Could not read saved graphs from localStorage", e);
        return [];
    }
}

function writeGraphStore(records) {
    const normalized = records.map(normalizeGraphRecord).filter(Boolean);
    const sorted = [...normalized].sort((a, b) =>
        String(b.savedAt).localeCompare(String(a.savedAt))
    );
    const trimmed = sorted.slice(0, MAX_SAVED_GRAPHS);
    try {
        localStorage.setItem(REVEAL_KG_GRAPHS_KEY, JSON.stringify(trimmed));
    } catch (e) {
        if (isStorageQuotaError(e)) {
            const err = new Error(GRAPH_STORE_QUOTA_ERROR);
            err.cause = e;
            throw err;
        }
        const err = new Error(GRAPH_STORE_WRITE_ERROR);
        err.cause = e;
        throw err;
    }
    return trimmed;
}

function listGraphs() {
    return readGraphStore().sort((a, b) =>
        String(b.savedAt).localeCompare(String(a.savedAt))
    );
}

function getGraph(id) {
    if (!id) {
        return null;
    }
    return readGraphStore().find((graph) => graph.id === id) || null;
}

function saveGraph(graph) {
    const record = normalizeGraphRecord(stripInspectorCachesFromPayload(graph));
    if (!record) {
        console.error("saveGraph: a graph with at least one node is required");
        return null;
    }
    const next = writeGraphStore([
        record,
        ...readGraphStore().filter((entry) => entry.id !== record.id),
    ]);
    return next.find((entry) => entry.id === record.id) || record;
}

function updateGraph(id, patch) {
    if (!id) {
        console.error("updateGraph: id is required");
        return null;
    }
    const existing = getGraph(id);
    if (!existing) {
        console.error("updateGraph: no saved graph found for id", id);
        return null;
    }
    const record = normalizeGraphRecord({
        ...existing,
        ...stripInspectorCachesFromPayload(patch || {}),
        id,
        savedAt: new Date().toISOString(),
    });
    if (!record) {
        console.error("updateGraph: patch left graph without nodes");
        return null;
    }
    const records = readGraphStore().map((entry) =>
        entry.id === id ? record : entry
    );
    writeGraphStore(records);
    return record;
}

function deleteGraph(id) {
    if (!id) {
        return;
    }
    writeGraphStore(readGraphStore().filter((graph) => graph.id !== id));
}

function clearGraphs() {
    localStorage.removeItem(REVEAL_KG_GRAPHS_KEY);
}

function parseRevealKgCanvasOpenCount(raw) {
    const value = Number.parseInt(String(raw ?? ""), 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getRevealKgCanvasOpenCount() {
    try {
        return parseRevealKgCanvasOpenCount(
            localStorage.getItem(REVEAL_KG_CANVAS_OPEN_COUNT_KEY)
        );
    } catch (e) {
        return 0;
    }
}

function recordRevealKgCanvasOpen() {
    try {
        const nextCount = getRevealKgCanvasOpenCount() + 1;
        localStorage.setItem(REVEAL_KG_CANVAS_OPEN_COUNT_KEY, String(nextCount));
        return nextCount;
    } catch (e) {
        console.warn("Could not record REVEAL KG Canvas open count", e);
        return getRevealKgCanvasOpenCount();
    }
}

function shouldShowRevealKgLearnCompanion(
    openCount = getRevealKgCanvasOpenCount(),
    maxOpens = REVEAL_KG_LEARN_COMPANION_MAX_OPENS
) {
    return openCount > 0 && openCount <= maxOpens;
}

function graphPayloadFromSession(session, { label, includeInspectorCaches = false } = {}) {
    if (!session) {
        return null;
    }
    const nodes = session.graphNodes || session.nodes || [];
    const highlighted = highlightedFromRecord(
        {
            highlighted: session.highlighted || session.reanchorSelection || [],
        },
        nodes
    );
    const sigChainRuns = cloneJson(sigChainRunsFromSession(session), []);
    const sigChainRun = cloneJson(activeSigChainRunFromSession(session, sigChainRuns), null);
    const datasetRuns = cloneJson(datasetRunsFromSession(session), []);
    const datasetRun = cloneJson(activeDatasetRunFromSession(session, datasetRuns), null);
    const base = {
        label: label !== undefined ? label : session.label,
        context: session.context || "",
        nodes,
        edges: session.graphEdges || session.edges || [],
        highlighted,
        highlightedNodeIds: highlighted,
        controls: session.controls || {},
        visibilityFilters: session.visibilityFilters || {},
        visibilityFilterLayers: cloneJson(session.visibilityFilterLayers, []),
        appliedGraphFilter: session.appliedGraphFilter || null,
        retrievalLedger: session.retrievalLedger || {},
        contextualEdges: session.contextualEdges || [],
        contextualEdgeSignature: session.contextualEdgeSignature || "",
        starterBuckets: session.starterBuckets || null,
        addNeighboringNodes:
            session.addNeighboringNodes !== undefined ? session.addNeighboringNodes : false,
        hypotheses: sigChainRuns,
        sigChainRuns,
        sigChainRun,
        dataProvenanceRuns: datasetRuns,
        datasetRuns,
        datasetRun,
        graphInterpretations: cloneJson(session.graphInterpretations, []),
        graphInterpretation: cloneJson(session.graphInterpretation, null),
        explainContext: session.explainContext || "",
        historyEntries: cloneJson(session.historyEntries, []),
        candidateCache: cloneJson(session.candidateCache, {}),
    };
    if (!includeInspectorCaches) {
        return {
            ...base,
            ...emptyInspectorCacheFields(),
        };
    }
    return {
        ...base,
        nodeConnectionEvidenceCache: cloneJson(session.nodeConnectionEvidenceCache, {}),
        nodeExpressionProfileCache: cloneJson(session.nodeExpressionProfileCache, {}),
        nodeExpressionReferenceById: cloneJson(session.nodeExpressionReferenceById, {}),
        edgeProvenanceById: cloneJson(session.edgeProvenanceById, {}),
        nodeSigChainPacketCache: cloneJson(session.nodeSigChainPacketCache, {}),
        nodeFactorLoadingsCache: cloneJson(session.nodeFactorLoadingsCache, {}),
    };
}

function saveGraphFromSession(session, { label } = {}) {
    const payload = graphPayloadFromSession(session, { label });
    if (!payload) {
        console.error("saveGraphFromSession: no session to save");
        return null;
    }
    return saveGraph(payload);
}

function updateGraphFromSession(id, session, { label } = {}) {
    const payload = graphPayloadFromSession(session, { label });
    if (!payload) {
        console.error("updateGraphFromSession: no session to save");
        return null;
    }
    return updateGraph(id, payload);
}

function estimateGraphStoreBytes() {
    try {
        const raw = localStorage.getItem(REVEAL_KG_GRAPHS_KEY);
        if (!raw) {
            return 0;
        }
        return new Blob([raw]).size;
    } catch (e) {
        return 0;
    }
}

function estimateSessionSaveBytes(session, { label } = {}) {
    const payload = graphPayloadFromSession(session, { label });
    if (!payload) {
        return 0;
    }
    const records = readGraphStore();
    const graphId = session?.savedGraphId || session?.id || null;
    const nextRecords = graphId
        ? records.map((entry) =>
              entry.id === graphId
                  ? normalizeGraphRecord({
                        ...entry,
                        ...payload,
                        id: graphId,
                        savedAt: new Date().toISOString(),
                    })
                  : entry
          )
        : [
              normalizeGraphRecord(payload),
              ...records.filter((entry) => entry.id !== payload.id),
          ].filter(Boolean);
    return estimateJsonBytes(nextRecords.filter(Boolean));
}

//Restore a workspace session-shaped object from a saved graph (for Library load).
function sessionFromGraph(record) {
    const graph = record && record.id ? getGraph(record.id) : normalizeGraphRecord(record);
    if (!graph) {
        return null;
    }
    const sigChainRuns = cloneJson(graph.hypotheses, []);
    const sigChainRun = cloneJson(activeSigChainRunFromSession(null, sigChainRuns), null);
    const datasetRuns = cloneJson(
        datasetRunsFromSession({
            dataProvenanceRuns: graph.dataProvenanceRuns,
            datasetRuns: graph.dataProvenanceRuns,
        }),
        []
    );
    const datasetRun = cloneJson(activeDatasetRunFromSession(null, datasetRuns), null);
    return {
        id: graph.id,
        label: graph.label,
        context: graph.context,
        graphNodes: cloneJson(graph.nodes, []),
        graphEdges: cloneJson(graph.edges, []),
        highlighted: cloneJson(graph.highlighted, []),
        reanchorSelection: cloneJson(graph.highlighted, []),
        controls: cloneJson(graph.controls, {}),
        visibilityFilters: cloneJson(graph.visibilityFilters, {}),
        visibilityFilterLayers: cloneJson(graph.visibilityFilterLayers, []),
        appliedGraphFilter: graph.appliedGraphFilter
            ? cloneJson(graph.appliedGraphFilter, null)
            : null,
        retrievalLedger: cloneJson(graph.retrievalLedger, {}),
        contextualEdges: cloneJson(graph.contextualEdges, []),
        contextualEdgeSignature: graph.contextualEdgeSignature,
        starterBuckets: cloneJson(graph.starterBuckets, null),
        addNeighboringNodes:
            graph.addNeighboringNodes !== undefined ? graph.addNeighboringNodes : false,
        hypotheses: sigChainRuns,
        sigChainRuns,
        sigChainRun,
        sigChainLoading: false,
        dataProvenanceRuns: datasetRuns,
        datasetRuns,
        datasetRun,
        datasetLoading: false,
        graphInterpretations: cloneJson(graph.graphInterpretations, []),
        graphInterpretation: cloneJson(graph.graphInterpretation, null),
        explainContext: graph.explainContext || graph.context || "",
        historyEntries: cloneJson(graph.historyEntries, []),
        candidateCache: cloneJson(graph.candidateCache, {}),
        ...emptyInspectorCacheFields(),
        savedGraphId: graph.id,
        savedAt: graph.savedAt,
    };
}

const REVEAL_KG_GRAPH_EXPORT_KIND = "reveal-kg-graph-export";
const REVEAL_KG_GRAPH_EXPORT_SCHEMA_VERSION = 1;

function defaultGraphExportFilename(label) {
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = String(label || "graph")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
    return `reveal-kg-graph-${slug || "export"}-${stamp}.json`;
}

function buildGraphExportBundle(session, { label } = {}) {
    const sessionPayload = graphPayloadFromSession(session, {
        label,
        includeInspectorCaches: true,
    });
    if (!sessionPayload) {
        return null;
    }
    return {
        kind: REVEAL_KG_GRAPH_EXPORT_KIND,
        schemaVersion: REVEAL_KG_GRAPH_EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        label: String(label !== undefined ? label : session?.label || "").trim() || "Untitled graph",
        session: sessionPayload,
    };
}

function sessionPayloadFromGraphExport(record) {
    if (!record || typeof record !== "object") {
        return null;
    }
    if (record.kind === REVEAL_KG_GRAPH_EXPORT_KIND && record.session) {
        return record.session;
    }
    if (record.session && typeof record.session === "object") {
        return record.session;
    }
    if (graphNodesFromRecord(record).length) {
        return record;
    }
    return null;
}

function sessionFromGraphExport(record) {
    const payload = sessionPayloadFromGraphExport(record);
    if (!payload) {
        return null;
    }
    const nodes = cloneJson(graphNodesFromRecord(payload), []);
    if (!nodes.length) {
        return null;
    }
    const highlighted = highlightedFromRecord(payload, nodes);
    const sigChainRuns = cloneJson(
        sigChainRunsFromSession({
            hypotheses: payload.hypotheses,
            sigChainRuns: payload.sigChainRuns,
            sigChainRun: payload.sigChainRun,
        }),
        []
    );
    const sigChainRun = cloneJson(
        activeSigChainRunFromSession(
            { sigChainRun: payload.sigChainRun },
            sigChainRuns
        ),
        null
    );
    const datasetRuns = cloneJson(
        datasetRunsFromSession({
            dataProvenanceRuns: payload.dataProvenanceRuns,
            datasetRuns: payload.datasetRuns,
            datasetRun: payload.datasetRun,
        }),
        []
    );
    const datasetRun = cloneJson(
        activeDatasetRunFromSession({ datasetRun: payload.datasetRun }, datasetRuns),
        null
    );
    return {
        label: String(payload.label || record.label || "").trim() || "Untitled graph",
        context: payload.context || "",
        graphNodes: nodes,
        graphEdges: cloneJson(graphEdgesFromRecord(payload), []),
        highlighted,
        reanchorSelection: highlighted,
        controls: cloneJson(payload.controls, {}),
        visibilityFilters: cloneJson(payload.visibilityFilters, {}),
        visibilityFilterLayers: cloneJson(payload.visibilityFilterLayers, []),
        appliedGraphFilter: payload.appliedGraphFilter
            ? cloneJson(payload.appliedGraphFilter, null)
            : null,
        retrievalLedger: cloneJson(payload.retrievalLedger, {}),
        contextualEdges: cloneJson(payload.contextualEdges, []),
        contextualEdgeSignature: payload.contextualEdgeSignature || "",
        starterBuckets: cloneJson(payload.starterBuckets, null),
        addNeighboringNodes:
            payload.addNeighboringNodes !== undefined ? payload.addNeighboringNodes : false,
        hypotheses: sigChainRuns,
        sigChainRuns,
        sigChainRun,
        sigChainLoading: false,
        dataProvenanceRuns: datasetRuns,
        datasetRuns,
        datasetRun,
        datasetLoading: false,
        graphInterpretations: cloneJson(payload.graphInterpretations, []),
        graphInterpretation: cloneJson(payload.graphInterpretation, null),
        explainContext: payload.explainContext || payload.context || "",
        historyEntries: cloneJson(payload.historyEntries, []),
        candidateCache: cloneJson(payload.candidateCache, {}),
        nodeConnectionEvidenceCache: cloneJson(payload.nodeConnectionEvidenceCache, {}),
        nodeExpressionProfileCache: cloneJson(payload.nodeExpressionProfileCache, {}),
        nodeExpressionReferenceById: cloneJson(payload.nodeExpressionReferenceById, {}),
        edgeProvenanceById: cloneJson(payload.edgeProvenanceById, {}),
        nodeSigChainPacketCache: cloneJson(payload.nodeSigChainPacketCache, {}),
        nodeFactorLoadingsCache: cloneJson(payload.nodeFactorLoadingsCache, {}),
    };
}

async function exportGraphFromSession(session, { label, filename } = {}) {
    const bundle = buildGraphExportBundle(session, { label });
    if (!bundle) {
        return { ok: false, reason: "no_session" };
    }
    const exportLabel = bundle.label;
    const saveResult = await saveJsonPayloadToFile(
        filename || defaultGraphExportFilename(exportLabel),
        bundle
    );
    if (!saveResult.ok) {
        return saveResult;
    }
    return {
        ok: true,
        label: exportLabel,
        filename: saveResult.filename,
        usedSavePicker: saveResult.usedSavePicker,
    };
}

function parseGraphImportPayload(parsed) {
    return sessionFromGraphExport(parsed);
}

function duplicateGraph(id, label) {
    const source = getGraph(id);
    if (!source) {
        console.error("duplicateGraph: no saved graph found for id", id);
        return null;
    }
    const baseLabel = String(source.label || "Untitled graph").trim();
    return saveGraph({
        ...cloneJson(source, {}),
        id: makeGraphId(),
        label: String(label || "").trim() || `${baseLabel} (copy)`,
    });
}

function formatGraphCounts(record) {
    const nodes = graphNodesFromRecord(record);
    const edges = graphEdgesFromRecord(record);
    const parts = [];
    if (nodes.length) {
        parts.push(`${nodes.length} node${nodes.length === 1 ? "" : "s"}`);
    }
    if (edges.length) {
        parts.push(`${edges.length} edge${edges.length === 1 ? "" : "s"}`);
    }
    return parts.length ? parts.join(", ") : "Empty graph";
}

function formatGraphWhen(savedAt) {
    try {
        return new Date(savedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch (e) {
        return "";
    }
}

const REVEAL_KG_LIBRARY_EXPORT_KIND = "reveal-kg-library";

function defaultLibraryExportFilename() {
    const stamp = new Date().toISOString().slice(0, 10);
    return `reveal-kg-library-${stamp}.json`;
}

function normalizeExportFilename(filename) {
    let name = String(filename || "").trim();
    if (!name) {
        name = "reveal-kg-graph-export.json";
    }
    name = name.replace(/[\\/:*?"<>|]+/g, "-");
    if (!name.toLowerCase().endsWith(".json")) {
        name = `${name}.json`;
    }
    return name;
}

function triggerJsonDownload(filename, payload) {
    if (typeof document === "undefined") {
        console.error("triggerJsonDownload: document is not available");
        return false;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = normalizeExportFilename(filename);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
}

async function saveJsonPayloadToFile(filename, payload) {
    const resolvedFilename = normalizeExportFilename(filename);
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    if (
        typeof window !== "undefined" &&
        typeof window.showSaveFilePicker === "function"
    ) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: resolvedFilename,
                types: [
                    {
                        description: "JSON",
                        accept: { "application/json": [".json"] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return {
                ok: true,
                filename: handle.name || resolvedFilename,
                usedSavePicker: true,
            };
        } catch (error) {
            if (error?.name === "AbortError") {
                return { ok: false, reason: "cancelled" };
            }
        }
    }

    const ok = triggerJsonDownload(resolvedFilename, payload);
    return {
        ok,
        filename: resolvedFilename,
        usedSavePicker: false,
    };
}

//Bundle all saved graphs for export to another browser/machine.
function buildLibraryExportBundle() {
    const graphs = listGraphs();
    return {
        kind: REVEAL_KG_LIBRARY_EXPORT_KIND,
        schemaVersion: REVEAL_KG_GRAPH_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        graphCount: graphs.length,
        graphs,
    };
}

function exportLibraryToFile(filename) {
    const bundle = buildLibraryExportBundle();
    if (!bundle.graphs.length) {
        return { ok: false, reason: "empty", graphCount: 0 };
    }
    const name = String(filename || "").trim() || defaultLibraryExportFilename();
    triggerJsonDownload(name, bundle);
    return { ok: true, graphCount: bundle.graphs.length, filename: name };
}

//Accept export bundle, bare array, or { graphs: [] } from older/manual files.
function graphsFromImportPayload(payload) {
    if (!payload) {
        return [];
    }
    if (Array.isArray(payload)) {
        return payload;
    }
    if (typeof payload !== "object") {
        return [];
    }
    if (Array.isArray(payload.graphs)) {
        return payload.graphs;
    }
    if (payload.kind === REVEAL_KG_LIBRARY_EXPORT_KIND && Array.isArray(payload.graphs)) {
        return payload.graphs;
    }
    return [];
}

//Import graphs into localStorage. Default: merge; on id conflict assign a new id
//so a library from another machine does not overwrite local saves unexpectedly.
function importLibrary(payload, { onIdConflict = "rename" } = {}) {
    const rawGraphs = graphsFromImportPayload(payload);
    const incoming = rawGraphs.map(normalizeGraphRecord).filter(Boolean);
    if (!incoming.length) {
        return {
            ok: false,
            reason: "no_valid_graphs",
            imported: 0,
            skipped: rawGraphs.length,
        };
    }

    const existing = readGraphStore();
    const existingIds = new Set(existing.map((graph) => graph.id));
    const nextById = new Map(existing.map((graph) => [graph.id, graph]));
    let imported = 0;
    let renamed = 0;
    let replaced = 0;
    let skipped = 0;

    for (const graph of incoming) {
        let record = graph;
        if (existingIds.has(record.id)) {
            if (onIdConflict === "replace") {
                replaced += 1;
            } else if (onIdConflict === "rename") {
                record = {
                    ...record,
                    id: makeGraphId(),
                    savedAt: new Date().toISOString(),
                };
                renamed += 1;
            } else {
                skipped += 1;
                continue;
            }
        }
        nextById.set(record.id, record);
        existingIds.add(record.id);
        imported += 1;
    }

    writeGraphStore([...nextById.values()]);
    return {
        ok: true,
        imported,
        renamed,
        replaced,
        skipped,
        total: nextById.size,
    };
}

function parseGraphImportFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file selected."));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || ""));
                const session = parseGraphImportPayload(parsed);
                if (!session) {
                    reject(new Error("File is not a valid KG Canvas graph export."));
                    return;
                }
                resolve(session);
            } catch (e) {
                reject(
                    e?.message === "File is not a valid KG Canvas graph export."
                        ? e
                        : new Error("File is not valid JSON.")
                );
            }
        };
        reader.onerror = () => {
            reject(new Error("Could not read the selected file."));
        };
        reader.readAsText(file);
    });
}

function parseLibraryImportFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file selected."));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || ""));
                resolve(parsed);
            } catch (e) {
                reject(new Error("File is not valid JSON."));
            }
        };
        reader.onerror = () => {
            reject(new Error("Could not read the selected file."));
        };
        reader.readAsText(file);
    });
}

export default {
    savePhenotypes,
    getPhenotypes,
    clearPhenotypes,
    addPhenotype,
    removePhenotype,
    saveContext,
    getContext,
    clearContext,
    listGraphs,
    getGraph,
    saveGraph,
    updateGraph,
    deleteGraph,
    clearGraphs,
    getRevealKgCanvasOpenCount,
    recordRevealKgCanvasOpen,
    shouldShowRevealKgLearnCompanion,
    REVEAL_KG_LEARN_COMPANION_MAX_OPENS,
    saveGraphFromSession,
    updateGraphFromSession,
    sessionFromGraph,
    graphPayloadFromSession,
    consumeGraphSaveWarning,
    estimateGraphStoreBytes,
    estimateSessionSaveBytes,
    formatStorageBytes,
    GRAPH_STORE_QUOTA_ERROR,
    GRAPH_STORE_WRITE_ERROR,
    buildGraphExportBundle,
    defaultGraphExportFilename,
    exportGraphFromSession,
    normalizeExportFilename,
    sessionFromGraphExport,
    parseGraphImportPayload,
    parseGraphImportFile,
    duplicateGraph,
    formatGraphCounts,
    formatGraphWhen,
    buildLibraryExportBundle,
    exportLibraryToFile,
    importLibrary,
    parseLibraryImportFile,
};
