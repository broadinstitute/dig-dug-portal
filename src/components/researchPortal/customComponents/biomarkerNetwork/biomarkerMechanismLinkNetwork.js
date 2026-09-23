import { normalizeGeneSymbol } from "./geneNodeIds.js";

const MAX_MECHANISM_LABEL = 42;
const MAX_BIOMARKER_LABEL = 22;

function truncateLabel(text, max) {
    const value = String(text || "").trim();
    if (!value) return "—";
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1)}…`;
}

function readGeneBridges(summary) {
    if (!summary || typeof summary !== "object") return [];
    if (Array.isArray(summary.gene_bridges)) return summary.gene_bridges;
    if (Array.isArray(summary.mapped_gene_bridges)) return summary.mapped_gene_bridges;
    return [];
}

function readHighlightedBiomarkers(summary) {
    if (!summary || typeof summary !== "object") return [];
    return Array.isArray(summary.highlighted_biomarkers)
        ? summary.highlighted_biomarkers
        : [];
}

/**
 * Build a left-to-right causal bridge network from the LLM JSON summary:
 * highlighted biomarkers → gene bridges → target mechanism.
 *
 * @param {object} summary - parsed LLM summary JSON
 * @param {string} mechanismLabel
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function buildCausalPathNetwork(summary, mechanismLabel = "Mechanism") {
    const geneBridges = readGeneBridges(summary);
    const highlighted = readHighlightedBiomarkers(summary);

    const bridgeGenes = new Set();
    geneBridges.forEach((bridge) => {
        const sym = normalizeGeneSymbol(bridge && bridge.gene_symbol);
        if (sym) bridgeGenes.add(sym);
    });

    if (!bridgeGenes.size) {
        return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    const edgeIds = new Set();

    const mechanismId = "mechanism:root";
    nodes.push({
        id: mechanismId,
        label: truncateLabel(mechanismLabel, MAX_MECHANISM_LABEL),
        title: String(mechanismLabel || "Mechanism").trim() || "Mechanism",
        type: "Mechanism",
        level: 3,
    });
    nodeIds.add(mechanismId);

    geneBridges.forEach((bridge) => {
        const sym = normalizeGeneSymbol(bridge && bridge.gene_symbol);
        if (!sym) return;
        const geneId = `gene:${sym}`;
        if (!nodeIds.has(geneId)) {
            nodes.push({
                id: geneId,
                label: sym,
                title: sym,
                type: "Gene",
                level: 2,
                confidence: bridge.confidence || "",
            });
            nodeIds.add(geneId);
        }
        const edgeId = `edge:gene-mechanism:${sym}`;
        if (!edgeIds.has(edgeId)) {
            edges.push({ id: edgeId, from: geneId, to: mechanismId });
            edgeIds.add(edgeId);
        }
    });

    highlighted.forEach((item) => {
        const biomarkerId = String((item && item.biomarker_id) || "").trim();
        if (!biomarkerId) return;

        const linkedGenes = (item.associated_genes || [])
            .map((gene) => normalizeGeneSymbol(gene))
            .filter((gene) => gene && bridgeGenes.has(gene));
        if (!linkedGenes.length) return;

        const nodeId = `biomarker:${biomarkerId}`;
        if (!nodeIds.has(nodeId)) {
            nodes.push({
                id: nodeId,
                label: truncateLabel(biomarkerId, MAX_BIOMARKER_LABEL),
                title: biomarkerId,
                type: "Biomarker",
                level: 1,
            });
            nodeIds.add(nodeId);
        }

        linkedGenes.forEach((gene) => {
            const geneId = `gene:${gene}`;
            const edgeId = `edge:bio-gene:${biomarkerId}:${gene}`;
            if (edgeIds.has(edgeId)) return;
            edges.push({ id: edgeId, from: nodeId, to: geneId });
            edgeIds.add(edgeId);
        });
    });

    const biomarkerNodes = nodes.filter((node) => node.type === "Biomarker");
    if (!biomarkerNodes.length) {
        return { nodes: [], edges: [] };
    }

    return { nodes, edges };
}

/**
 * Reverse causal bridge: seed biomarker → gene bridges → highlighted mechanisms.
 *
 * @param {object} summary
 * @param {string} seedBiomarkerLabel
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function buildReverseCausalPathNetwork(summary, seedBiomarkerLabel = "Biomarker") {
    const geneBridges = readGeneBridges(summary);
    const highlighted = Array.isArray(summary && summary.highlighted_mechanisms)
        ? summary.highlighted_mechanisms
        : [];

    const bridgeGenes = new Set();
    geneBridges.forEach((bridge) => {
        const sym = normalizeGeneSymbol(bridge && bridge.gene_symbol);
        if (sym) bridgeGenes.add(sym);
    });

    if (!bridgeGenes.size || !highlighted.length) {
        return { nodes: [], edges: [] };
    }

    const seedLabel = String(seedBiomarkerLabel || "").trim() || "Biomarker";
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    const edgeIds = new Set();

    const seedId = "biomarker:seed";
    nodes.push({
        id: seedId,
        label: truncateLabel(seedLabel, MAX_BIOMARKER_LABEL),
        title: seedLabel,
        type: "Biomarker",
        level: 1,
    });
    nodeIds.add(seedId);

    geneBridges.forEach((bridge) => {
        const sym = normalizeGeneSymbol(bridge && bridge.gene_symbol);
        if (!sym) return;
        const geneId = `gene:${sym}`;
        if (!nodeIds.has(geneId)) {
            nodes.push({
                id: geneId,
                label: sym,
                title: sym,
                type: "Gene",
                level: 2,
                confidence: bridge.confidence || "",
            });
            nodeIds.add(geneId);
        }
        const edgeId = `edge:bio-gene:${sym}`;
        if (!edgeIds.has(edgeId)) {
            edges.push({ id: edgeId, from: seedId, to: geneId });
            edgeIds.add(edgeId);
        }
    });

    highlighted.forEach((item, index) => {
        const mechanismLabel = String((item && item.mechanism_label) || "").trim();
        if (!mechanismLabel) return;

        const linkedGenes = (item.genes || [])
            .map((gene) => normalizeGeneSymbol(gene))
            .filter((gene) => gene && bridgeGenes.has(gene));
        const genesForEdges = linkedGenes.length
            ? linkedGenes
            : Array.from(bridgeGenes).slice(0, 3);
        if (!genesForEdges.length) return;

        const mechanismId = `mechanism:${index}:${mechanismLabel.slice(0, 24)}`;
        if (!nodeIds.has(mechanismId)) {
            nodes.push({
                id: mechanismId,
                label: truncateLabel(mechanismLabel, MAX_MECHANISM_LABEL),
                title: mechanismLabel,
                type: "Mechanism",
                level: 3,
                support: item.support || "",
            });
            nodeIds.add(mechanismId);
        }

        genesForEdges.forEach((gene) => {
            const geneId = `gene:${gene}`;
            if (!nodeIds.has(geneId)) return;
            const edgeId = `edge:gene-mechanism:${gene}:${index}`;
            if (edgeIds.has(edgeId)) return;
            edges.push({ id: edgeId, from: geneId, to: mechanismId });
            edgeIds.add(edgeId);
        });
    });

    const mechanismNodes = nodes.filter((node) => node.type === "Mechanism");
    if (!mechanismNodes.length) {
        return { nodes: [], edges: [] };
    }

    return { nodes, edges };
}

export function causalPathNetworkHasContent(network) {
    return !!(
        network &&
        Array.isArray(network.nodes) &&
        network.nodes.length &&
        Array.isArray(network.edges) &&
        network.edges.length
    );
}
