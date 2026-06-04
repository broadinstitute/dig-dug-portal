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
// REVEAL KG Workspace — saved graphs (localStorage)
// One store for all saved graphs. A seed-only graph is just nodes with no edges.
// Records are normalized on read/write so the Library and canvas can share one shape.
// ---------------------------------------------------------------------------

const REVEAL_KG_GRAPHS_KEY = "_reveal_kg_graphs";
const REVEAL_KG_GRAPH_SCHEMA_VERSION = 1;
const MAX_SAVED_GRAPHS = 50;

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
    // Saved graphs store key node ids in `highlighted` (legacy field name).
    const raw =
        record?.highlighted ||
        record?.highlightedNodeIds ||
        record?.reanchorSelection ||
        [];
    const nodeIds = graphNodeIdSet(nodes);
    return Array.from(new Set((raw || []).filter((id) => nodeIds.has(id))));
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
        starterBuckets: cloneJson(record.starterBuckets, null),
        addNeighboringNodes:
            record.addNeighboringNodes !== undefined ? record.addNeighboringNodes : true,
        // Inspector evidence fetched in-session (required for snapshots / resume).
        nodeConnectionEvidenceCache: cloneJson(record.nodeConnectionEvidenceCache, {}),
        nodeExpressionProfileCache: cloneJson(record.nodeExpressionProfileCache, {}),
        nodeExpressionReferenceById: cloneJson(record.nodeExpressionReferenceById, {}),
        edgeProvenanceById: cloneJson(record.edgeProvenanceById, {}),
        nodeSigChainPacketCache: cloneJson(record.nodeSigChainPacketCache, {}),
        nodeFactorLoadingsCache: cloneJson(record.nodeFactorLoadingsCache, {}),
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
    localStorage.setItem(REVEAL_KG_GRAPHS_KEY, JSON.stringify(trimmed));
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
    const record = normalizeGraphRecord(graph);
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
        ...(patch || {}),
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

//Build a saved-graph payload from the live workspace session object.
function graphPayloadFromSession(session, { label } = {}) {
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
    return {
        label: label !== undefined ? label : session.label,
        context: session.context || "",
        nodes,
        edges: session.graphEdges || session.edges || [],
        highlighted,
        highlightedNodeIds: highlighted,
        controls: session.controls || {},
        visibilityFilters: session.visibilityFilters || {},
        appliedGraphFilter: session.appliedGraphFilter || null,
        retrievalLedger: session.retrievalLedger || {},
        contextualEdges: session.contextualEdges || [],
        contextualEdgeSignature: session.contextualEdgeSignature || "",
        starterBuckets: session.starterBuckets || null,
        addNeighboringNodes:
            session.addNeighboringNodes !== undefined ? session.addNeighboringNodes : true,
        hypotheses: session.hypotheses || session.sigChainRuns || [],
        dataProvenanceRuns: session.dataProvenanceRuns || session.datasetRuns || [],
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

//Restore a workspace session-shaped object from a saved graph (for Library load).
function sessionFromGraph(record) {
    const graph = record && record.id ? getGraph(record.id) : normalizeGraphRecord(record);
    if (!graph) {
        return null;
    }
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
        appliedGraphFilter: graph.appliedGraphFilter
            ? cloneJson(graph.appliedGraphFilter, null)
            : null,
        retrievalLedger: cloneJson(graph.retrievalLedger, {}),
        contextualEdges: cloneJson(graph.contextualEdges, []),
        contextualEdgeSignature: graph.contextualEdgeSignature,
        starterBuckets: cloneJson(graph.starterBuckets, null),
        addNeighboringNodes:
            graph.addNeighboringNodes !== undefined ? graph.addNeighboringNodes : true,
        hypotheses: cloneJson(graph.hypotheses, []),
        sigChainRuns: cloneJson(graph.hypotheses, []),
        dataProvenanceRuns: cloneJson(graph.dataProvenanceRuns, []),
        datasetRuns: cloneJson(graph.dataProvenanceRuns, []),
        nodeConnectionEvidenceCache: cloneJson(graph.nodeConnectionEvidenceCache, {}),
        nodeExpressionProfileCache: cloneJson(graph.nodeExpressionProfileCache, {}),
        nodeExpressionReferenceById: cloneJson(graph.nodeExpressionReferenceById, {}),
        edgeProvenanceById: cloneJson(graph.edgeProvenanceById, {}),
        nodeSigChainPacketCache: cloneJson(graph.nodeSigChainPacketCache, {}),
        nodeFactorLoadingsCache: cloneJson(graph.nodeFactorLoadingsCache, {}),
        savedGraphId: graph.id,
        savedAt: graph.savedAt,
    };
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
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
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
    saveGraphFromSession,
    updateGraphFromSession,
    sessionFromGraph,
    graphPayloadFromSession,
    duplicateGraph,
    formatGraphCounts,
    formatGraphWhen,
    buildLibraryExportBundle,
    exportLibraryToFile,
    importLibrary,
    parseLibraryImportFile,
};
