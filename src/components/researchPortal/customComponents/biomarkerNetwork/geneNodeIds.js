/**
 * Gene node identity for the biomarker network.
 * One gene symbol maps to exactly one canonical vis-network node id.
 */

export function normalizeGeneSymbol(symbol) {
    return String(symbol || "").trim().toUpperCase();
}

/** Hyphen separator keeps ids safe inside generated edge ids. */
export function canonicalGeneNodeId(symbol) {
    const sym = normalizeGeneSymbol(symbol);
    return sym ? `gene-${sym}` : "";
}

export function geneSymbolFromNodeId(nodeId) {
    const id = String(nodeId || "");
    return id.startsWith("gene-") ? id.slice(5) : "";
}
