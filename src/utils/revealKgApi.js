/**
 * REVEAL KG Canvas — API client for cfde-reveal interactive routes.
 *
 * All workspace graph operations use `/api/interactive/*` on the same origin as the
 * portal (dig-dug-server proxies to cfde-reveal in local dev). Override with
 * `VUE_APP_REVEAL_KG_API_BASE_URL` only when the API must be called cross-origin.
 *
 * See KgWorkspaceApis.rtf for full backend catalog.
 */

import { logGeneSetAdd } from "../components/researchPortal/customComponents/revealKgWorkspace/revealKgGeneSetDebug.js";
import { DEFAULT_CANVAS_INTERACTIVE_MODEL } from "../components/researchPortal/customComponents/revealKgWorkspace/revealKgCanvasModel.js";

const INTERACTIVE_API_PREFIX = "/api/interactive";

/** Default request timeout (ms). */
export const REQUEST_TIMEOUT_MS = 2 * 60 * 1000;

/** Default cfde-reveal data bucket when no `model` URL param is set. */
export const DEFAULT_REVEAL_KG_INTERACTIVE_MODEL = DEFAULT_CANVAS_INTERACTIVE_MODEL;

/** cfde-reveal host used by dig-dug-server proxy and webpack devServer (not browser). */
export const DEFAULT_REVEAL_KG_API_BASE_URL =
    "http://ec2-3-210-5-42.compute-1.amazonaws.com";

/** POST /api/interactive/gene-set/search — body: { query, top_k } */
const DEFAULT_GENE_SET_SEARCH_PATH = `${INTERACTIVE_API_PREFIX}/gene-set/search`;

let apiBaseUrl = normalizeApiBase(
    process.env.VUE_APP_REVEAL_KG_API_BASE_URL || ""
);

let interactiveModel = DEFAULT_REVEAL_KG_INTERACTIVE_MODEL;

export function setRevealKgInteractiveModel(model) {
    interactiveModel = String(model || DEFAULT_REVEAL_KG_INTERACTIVE_MODEL).trim() ||
        DEFAULT_REVEAL_KG_INTERACTIVE_MODEL;
}

export function getRevealKgInteractiveModel() {
    return interactiveModel;
}

function shouldSendInteractiveModel() {
    return (
        String(interactiveModel || "").trim() &&
        interactiveModel !== DEFAULT_REVEAL_KG_INTERACTIVE_MODEL
    );
}

function appendInteractiveModelParam(params) {
    if (shouldSendInteractiveModel()) {
        params.set("model", interactiveModel);
    }
    return params;
}

function withInteractiveModelPayload(payload = {}) {
    if (!shouldSendInteractiveModel() || payload?.model) {
        return payload;
    }
    return {
        ...payload,
        model: interactiveModel,
    };
}

function getInteractiveJson(path, params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value != null && value !== "") {
            search.set(key, String(value));
        }
    });
    appendInteractiveModelParam(search);
    const query = search.toString();
    return requestJson(query ? `${path}?${query}` : path);
}

function postInteractiveJson(path, payload = {}) {
    return requestJson(path, {
        method: "POST",
        body: JSON.stringify(withInteractiveModelPayload(payload)),
    });
}

function normalizeApiBase(value) {
    return String(value || "")
        .trim()
        .replace(/~+$/, "")
        .replace(/\/+$/, "");
}

export function setRevealKgApiBaseUrl(url) {
    apiBaseUrl = normalizeApiBase(url);
}

export function getRevealKgApiBaseUrl() {
    return apiBaseUrl;
}

function buildApiUrl(path) {
    if (/^https?:\/\//.test(path)) {
        return path;
    }
    return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function getGeneSetSearchPath() {
    return (
        process.env.VUE_APP_REVEAL_KG_GENE_SET_SEARCH_PATH ||
        DEFAULT_GENE_SET_SEARCH_PATH
    );
}

function createRequestAbortSignal(timeoutMs, externalSignal) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
        timeoutController.abort(
            new DOMException(
                `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
                "TimeoutError"
            )
        );
    }, timeoutMs);

    if (!externalSignal) {
        return {
            signal: timeoutController.signal,
            clear: () => clearTimeout(timeoutId),
        };
    }

    const linkedController = new AbortController();

    if (externalSignal.aborted) {
        clearTimeout(timeoutId);
        linkedController.abort(externalSignal.reason);
        return { signal: linkedController.signal, clear: () => {} };
    }

    const onAbort = (source) => {
        linkedController.abort(source.reason);
        clearTimeout(timeoutId);
    };
    externalSignal.addEventListener("abort", () => onAbort(externalSignal), {
        once: true,
    });
    timeoutController.signal.addEventListener(
        "abort",
        () => onAbort(timeoutController.signal),
        { once: true }
    );

    return { signal: linkedController.signal, clear: () => clearTimeout(timeoutId) };
}

function formatRequestError(path, error, timeoutMs) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        const timedOut =
            error?.name === "TimeoutError" ||
            String(error?.message || "")
                .toLowerCase()
                .includes("timed out");
        if (timedOut) {
            return new Error(
                `Request timed out after ${Math.round(timeoutMs / 1000)} seconds (${path})`
            );
        }
        return new Error(`Request was aborted (${path})`);
    }
    return error;
}

async function requestJson(path, options = {}) {
    const {
        timeoutMs = REQUEST_TIMEOUT_MS,
        signal: externalSignal,
        ...fetchOptions
    } = options;
    const { signal, clear } = createRequestAbortSignal(timeoutMs, externalSignal);

    try {
        const response = await fetch(buildApiUrl(path), {
            headers: {
                "Content-Type": "application/json",
                ...(fetchOptions.headers || {}),
            },
            ...fetchOptions,
            signal,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Request failed: ${response.status}`);
        }
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();
        if (!contentType.includes("application/json")) {
            throw new Error(
                `Expected JSON from ${path}, got ${contentType || "unknown content type"}`
            );
        }
        try {
            return JSON.parse(text);
        } catch (parseError) {
            throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 160)}`);
        }
    } catch (error) {
        throw formatRequestError(path, error, timeoutMs);
    } finally {
        clear();
    }
}

// ---------------------------------------------------------------------------
// Health / chrome
// ---------------------------------------------------------------------------

export function getInteractiveHealth() {
    return requestJson(`${INTERACTIVE_API_PREFIX}/health`);
}

export function getInteractiveHelpManual() {
    return requestJson(`${INTERACTIVE_API_PREFIX}/help-manual`);
}

export function getInteractiveResourceSummary() {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/resource-summary`);
}

export function getInteractiveExpressionOptions() {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/expression-options`);
}

// ---------------------------------------------------------------------------
// Catalog & anchors (Change → Add nodes)
// ---------------------------------------------------------------------------

export function searchInteractiveCatalog(entityType, query, limit = 10) {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/catalog`, {
        entity_type: entityType,
        q: query,
        limit: String(limit),
    });
}

function normalizeGeneSetSearchResponse(payload) {
    const raw =
        payload?.items ??
        payload?.results ??
        payload?.matches ??
        payload?.gene_sets ??
        [];
    const list = Array.isArray(raw) ? raw : [];
    const items = list
        .map((row) => {
            if (!row || typeof row !== "object") {
                return null;
            }
            const nodeId = row.node_id ?? row.id ?? row.gene_set_id;
            if (!nodeId) {
                return null;
            }
            const nodeType = String(row.node_type || row.type || "gene_set").toLowerCase();
            return {
                ...row,
                node_id: nodeId,
                node_type: nodeType,
                type: nodeType,
                label: String(row.label ?? row.name ?? nodeId).replace(/_/g, " "),
                subtitle: row.subtitle ?? "",
            };
        })
        .filter(Boolean);
    return {
        items,
        method: payload?.method || "",
        explanation: payload?.explanation || "",
    };
}

/**
 * Search gene sets by name or natural-language query (Search & select → Gene sets).
 *
 * POST /api/interactive/gene-set/search with { query, top_k }.
 * Sends `limit` as well for servers that still honor it for result capping.
 * Override path via VUE_APP_REVEAL_KG_GENE_SET_SEARCH_PATH if needed.
 */
export async function searchInteractiveGeneSets(query, topK = 10) {
    const q = String(query || "").trim();
    if (!q) {
        return { items: [] };
    }
    const searchPath = getGeneSetSearchPath();
    const cappedTopK = Math.max(1, Number(topK) || 10);
    try {
        const payload = await postInteractiveJson(searchPath, {
            query: q,
            top_k: cappedTopK,
            limit: cappedTopK,
        });
        const normalized = normalizeGeneSetSearchResponse(payload);
        logGeneSetAdd("gene-set/search", {
            query: q,
            searchPayload: payload,
            searchItems: normalized.items,
        });
        if (normalized.method === "unavailable" && normalized.explanation) {
            return normalized;
        }
        return normalized;
    } catch (primaryError) {
        const message = String(primaryError?.message || primaryError);
        if (!message.includes("404") && !message.includes("Method Not Allowed")) {
            throw primaryError;
        }
        const catalogPayload = await searchInteractiveCatalog("gene_set", q, cappedTopK);
        logGeneSetAdd("catalog fallback (gene_set)", {
            query: q,
            searchPayload: catalogPayload,
            searchItems: catalogPayload.items,
        });
        return catalogPayload;
    }
}

export function parseInteractiveAnchor(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/anchor/parse`, payload);
}

export function getInteractiveAnchorLinks(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/anchor-links`, payload);
}

// ---------------------------------------------------------------------------
// Graph building (Change → Expand / bootstrap)
// ---------------------------------------------------------------------------

export function getInteractiveConnections(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/connections`, payload);
}

export function classifyInteractiveCandidates(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/classify-candidates`, payload);
}

export function getInteractiveSemanticMatches(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/semantic-match`, payload);
}

export function getInteractiveSessionSemanticMatches(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/session-semantic-match`, payload);
}

export function getInteractiveSessionNodeLinks(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/session-node-links`, payload);
}

export function getInteractiveSubgraphEdges(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/subgraph-edges`, payload);
}

export function getInteractiveFactorFactorEdges(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/factor-factor-edges`, payload);
}

export async function getInteractiveContextualEdges(payload) {
    try {
        return await postInteractiveJson(`${INTERACTIVE_API_PREFIX}/contextual-edges`, payload);
    } catch (error) {
        const message = String(error?.message || error);
        if (!message.includes("Method Not Allowed") && !message.includes("404")) {
            throw error;
        }
        return getInteractiveSubgraphEdges({
            node_ids: payload.node_ids || [],
            connection_scope: payload.connection_scope || "direct",
        });
    }
}

export function getInteractiveEdgeDiagnostic(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/edge-diagnostic`, payload);
}

// ---------------------------------------------------------------------------
// Analyze
// ---------------------------------------------------------------------------

export function prioritizeInteractiveSigChains(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/sig-chains/prioritize`, payload);
}

export function getInteractiveSigChainPacket(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/sig-chains/packet`, payload);
}

export async function findInteractiveCfdeDatasets(payload) {
    try {
        return await postInteractiveJson(`${INTERACTIVE_API_PREFIX}/cfde-datasets`, payload);
    } catch (primaryError) {
        const message = String(primaryError?.message || primaryError);
        if (!message.includes("Method Not Allowed") && !message.includes("404")) {
            throw primaryError;
        }
        return postInteractiveJson("/interactive/cfde-datasets", payload);
    }
}

export function interpretInteractiveNode(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/node-interpretation`, payload);
}

export function interpretInteractiveSession(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/session-interpretation`, payload);
}

// ---------------------------------------------------------------------------
// Inspector (evidence)
// ---------------------------------------------------------------------------

export function getInteractiveEdgeProvenance(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/edge-provenance`, payload);
}

export function getInteractiveFactorLoadings(
    factorId,
    geneLimit = 50000,
    geneSetLimit = 50000
) {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/factor-loadings`, {
        factor_id: factorId,
        gene_limit: String(geneLimit),
        gene_set_limit: String(geneSetLimit),
    });
}

export function getInteractiveFactorGeneSets(factorId, limit = 100, minLoading = 0) {
    return getInteractiveJson(
        `${INTERACTIVE_API_PREFIX}/factor/${encodeURIComponent(factorId)}/gene-sets`,
        {
            limit: String(limit),
            min_loading: String(minLoading),
        }
    );
}

export function getInteractiveFactorGene(factorId, gene, limit = 100, minLoading = 0) {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/factor-gene`, {
        factor_id: factorId,
        gene,
        limit: String(limit),
        min_loading: String(minLoading),
    });
}

export function getInteractiveExpressionProfile(referenceId, item, scope = {}) {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/expression-profile`, {
        reference_id: referenceId,
        node_id: item.node_id || item.id || "",
        node_type: item.node_type || item.type || "",
        label: item.label || "",
        node_key: item.node_key || "",
        tissue: scope.tissue || "",
        cell_type: scope.cell_type || "",
    });
}

export function getInteractiveExpressionFilter(payload) {
    return postInteractiveJson(`${INTERACTIVE_API_PREFIX}/expression-filter`, payload);
}

export function getInteractiveLocusZoomRegion(gene, traitId, flank = 250000) {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/locus-zoom/region`, {
        gene,
        trait_id: traitId,
        flank: String(flank),
    });
}

export function getInteractiveLocusZoomAssociations({ traitId, chromosome, start, end }) {
    return getInteractiveJson(`${INTERACTIVE_API_PREFIX}/locus-zoom/associations`, {
        trait_id: traitId,
        chr: chromosome,
        start: String(start),
        end: String(end),
    });
}

export default {
    REQUEST_TIMEOUT_MS,
    INTERACTIVE_API_PREFIX,
    DEFAULT_REVEAL_KG_API_BASE_URL,
    DEFAULT_REVEAL_KG_INTERACTIVE_MODEL,
    setRevealKgApiBaseUrl,
    getRevealKgApiBaseUrl,
    setRevealKgInteractiveModel,
    getRevealKgInteractiveModel,
    getInteractiveHealth,
    getInteractiveHelpManual,
    getInteractiveResourceSummary,
    getInteractiveExpressionOptions,
    searchInteractiveCatalog,
    searchInteractiveGeneSets,
    parseInteractiveAnchor,
    getInteractiveAnchorLinks,
    getInteractiveConnections,
    classifyInteractiveCandidates,
    getInteractiveSemanticMatches,
    getInteractiveSessionSemanticMatches,
    getInteractiveSessionNodeLinks,
    getInteractiveSubgraphEdges,
    getInteractiveFactorFactorEdges,
    getInteractiveContextualEdges,
    getInteractiveEdgeDiagnostic,
    prioritizeInteractiveSigChains,
    getInteractiveSigChainPacket,
    findInteractiveCfdeDatasets,
    interpretInteractiveNode,
    interpretInteractiveSession,
    getInteractiveEdgeProvenance,
    getInteractiveFactorLoadings,
    getInteractiveFactorGeneSets,
    getInteractiveFactorGene,
    getInteractiveExpressionProfile,
    getInteractiveExpressionFilter,
    getInteractiveLocusZoomRegion,
    getInteractiveLocusZoomAssociations,
};
