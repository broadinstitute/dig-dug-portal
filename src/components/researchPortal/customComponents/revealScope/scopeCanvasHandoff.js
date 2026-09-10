/**
 * SCOPE → REVEAL CANVAS CFDE KG handoff.
 *
 * Export builds a distinct JSON file (`kind: "reveal-scope-canvas-handoff"`).
 * Canvas Import detects that kind and resolves catalog nodes (see
 * revealKgWorkspace/revealKgScopeHandoffImport.js).
 */
import { kcURL } from "@/utils/cfdeUtils";

export const SCOPE_CANVAS_HANDOFF_KIND = "reveal-scope-canvas-handoff";
export const SCOPE_CANVAS_HANDOFF_SCHEMA_VERSION = 1;
export const CANVAS_PAGE_PATH = "/r/reveal_canvas";

const SCOPE_TYPE_TO_CANVAS = {
    gene: "gene",
    geneSet: "gene_set",
    gene_set: "gene_set",
    factor: "factor",
    trait: "trait",
};

const FACTOR_TRAIT_CONTEXT_RE = /^(.*?)\s*\(\s*trait\s+context\s*:\s*(.*?)\s*\)\s*$/i;

/**
 * Split Factor labels like "Mechanism name (trait context: Disease)" into
 * catalog search text + trait-context match string.
 */
export function splitFactorLabel(label) {
    const text = String(label || "").trim();
    if (!text) {
        return { searchLabel: "", matchTrait: null };
    }
    const match = text.match(FACTOR_TRAIT_CONTEXT_RE);
    if (!match) {
        return { searchLabel: text, matchTrait: null };
    }
    const searchLabel = String(match[1] || "").trim();
    const matchTrait = String(match[2] || "").trim();
    return {
        searchLabel: searchLabel || text,
        matchTrait: matchTrait || null,
    };
}

export function canvasNodeTypeFromScope(type) {
    return SCOPE_TYPE_TO_CANVAS[String(type || "").trim()] || null;
}

export function isScopeCanvasHandoff(record) {
    return Boolean(
        record &&
            typeof record === "object" &&
            record.kind === SCOPE_CANVAS_HANDOFF_KIND &&
            Number(record.schemaVersion) === SCOPE_CANVAS_HANDOFF_SCHEMA_VERSION
    );
}

/**
 * Build the handoff payload from SCOPE's CFDE KG network graph.
 * @param {{ kgNetworkGraph: object, hypothesisText?: string, title?: string }} params
 */
export function toCanvasHandoff({ kgNetworkGraph, hypothesisText = "", title = "" } = {}) {
    const graph = kgNetworkGraph || {};
    const nodes = [];
    const seenScopeIds = new Set();

    (graph.nodes || []).forEach((node) => {
        if (!node || !node.id) return;
        const canvasType = canvasNodeTypeFromScope(node.type);
        if (!canvasType) return;
        const scopeId = String(node.id);
        if (seenScopeIds.has(scopeId)) return;
        seenScopeIds.add(scopeId);

        const label = String(node.label || scopeId).trim() || scopeId;
        let searchLabel = label;
        let matchTrait = null;
        if (canvasType === "factor") {
            const split = splitFactorLabel(label);
            searchLabel = split.searchLabel;
            matchTrait = split.matchTrait;
        }

        const entry = {
            type: canvasType,
            label,
            searchLabel,
            scopeId,
        };
        if (matchTrait) {
            entry.matchTrait = matchTrait;
        }
        nodes.push(entry);
    });

    const edges = (graph.edges || [])
        .map((edge) => {
            if (!edge || !edge.source || !edge.target) return null;
            const sourceScopeId = String(edge.source);
            const targetScopeId = String(edge.target);
            if (!seenScopeIds.has(sourceScopeId) || !seenScopeIds.has(targetScopeId)) {
                return null;
            }
            return {
                sourceScopeId,
                targetScopeId,
                type: edge.type || null,
                weight: edge.weight == null ? null : edge.weight,
            };
        })
        .filter(Boolean);

    return {
        kind: SCOPE_CANVAS_HANDOFF_KIND,
        schemaVersion: SCOPE_CANVAS_HANDOFF_SCHEMA_VERSION,
        source: "scope-cfde-kg",
        exportedAt: new Date().toISOString(),
        title: String(title || "").trim() || "SCOPE CFDE KG",
        hypothesisText: String(hypothesisText || "").trim(),
        nodes,
        edges,
    };
}

export function defaultCanvasHandoffFilename() {
    return `scope-cfde-kg-canvas-${new Date().toISOString().slice(0, 10)}`;
}

function withJsonExtension(filename) {
    const name =
        filename && String(filename).trim() ? String(filename).trim() : defaultCanvasHandoffFilename();
    return name.toLowerCase().endsWith(".json") ? name : `${name}.json`;
}

function downloadHandoff(handoff, filename) {
    const blob = new Blob([JSON.stringify(handoff, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = withJsonExtension(filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Save handoff JSON via native Save-As when available.
 * @returns {Promise<{ ok: true } | { ok: false, cancelled: true }>}
 */
export async function saveCanvasHandoffFile(handoff, filename) {
    const jsonText = JSON.stringify(handoff, null, 2);
    if (typeof window !== "undefined" && typeof window.showSaveFilePicker === "function") {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: withJsonExtension(filename),
                types: [
                    {
                        description: "SCOPE CFDE KG for REVEAL CANVAS",
                        accept: { "application/json": [".json"] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(jsonText);
            await writable.close();
            return { ok: true };
        } catch (error) {
            if (error && error.name === "AbortError") {
                return { ok: false, cancelled: true };
            }
            // Fall through to plain download.
        }
    }
    downloadHandoff(handoff, filename);
    return { ok: true };
}

/** Environment-appropriate URL to open REVEAL CANVAS in a new tab. */
export function buildCanvasOpenUrl() {
    return kcURL(CANVAS_PAGE_PATH);
}
