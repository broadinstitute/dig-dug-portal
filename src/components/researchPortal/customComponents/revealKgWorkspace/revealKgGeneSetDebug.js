/** Dev console logging for gene set inspect / add data (descriptions, subtitles, API payloads). */

const TAG = "[KG gene_set]";

function shouldLog() {
    return process.env.NODE_ENV === "development";
}

function pickGeneSetFields(row = {}) {
    if (!row || typeof row !== "object") {
        return row;
    }
    const keys = [
        "node_id",
        "id",
        "node_type",
        "type",
        "label",
        "name",
        "subtitle",
        "description",
        "search_text",
        "node_key",
        "sub_collection",
        "collection",
        "rationale",
        "score",
    ];
    const picked = {};
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
            picked[key] = row[key];
        }
    }
    return Object.keys(picked).length ? picked : row;
}

export function logGeneSetInspect(phase, data = {}) {
    if (!shouldLog()) {
        return;
    }
    console.groupCollapsed(`${TAG} inspect — ${phase}`);
    if (data.graphNode) {
        console.log("graph node", pickGeneSetFields(data.graphNode));
    }
    if (data.connectionsPayload !== undefined) {
        console.log("connections API payload", data.connectionsPayload);
    }
    if (data.candidates !== undefined) {
        console.log(
            "connection candidates",
            (data.candidates || []).map((row) => pickGeneSetFields(row?.candidate || row))
        );
    }
    if (data.extra !== undefined) {
        console.log("extra", data.extra);
    }
    console.groupEnd();
}

export function logGeneSetAdd(phase, data = {}) {
    if (!shouldLog()) {
        return;
    }
    console.groupCollapsed(`${TAG} add — ${phase}`);
    if (data.query !== undefined) {
        console.log("query", data.query);
    }
    if (data.inputRows !== undefined) {
        console.log("input rows", (data.inputRows || []).map(pickGeneSetFields));
    }
    if (data.searchPayload !== undefined) {
        console.log("search API raw payload", data.searchPayload);
    }
    if (data.searchItems !== undefined) {
        console.log("search normalized items", (data.searchItems || []).map(pickGeneSetFields));
    }
    if (data.nodeLinksPayload !== undefined) {
        console.log("node-links API payload", data.nodeLinksPayload);
    }
    if (data.mergedNodes !== undefined) {
        console.log("merged graph nodes", (data.mergedNodes || []).map(pickGeneSetFields));
    }
    if (data.extra !== undefined) {
        console.log("extra", data.extra);
    }
    console.groupEnd();
}

export function isGeneSetRow(row) {
    const type = String(row?.node_type || row?.type || "").toLowerCase();
    return type === "gene_set";
}
