/** Association score matrix helpers (Playground SigChainNodeSummaryPanel parity; API: sig-chains/packet). */

import { formatInspectorValue } from "./revealKgInspectorUtils.js";

const GENE_TRAIT_PRIOR = 0.05;

export function posteriorFromLogBf(logBf, prior = GENE_TRAIT_PRIOR) {
    const numeric = Number(logBf);
    if (!Number.isFinite(numeric)) {
        return null;
    }
    const odds = (prior / (1 - prior)) * Math.exp(numeric);
    return odds / (1 + odds);
}

export function formatProbabilityFromLogBf(logBf) {
    const probability = posteriorFromLogBf(logBf);
    return probability === null ? "NA" : formatInspectorValue(probability, 3);
}

export const GENE_TRAIT_PROBABILITY_COLUMNS = [
    {
        key: "combined_score",
        label: "Combined prob.",
        format: (value) => formatProbabilityFromLogBf(value),
    },
    {
        key: "direct_score",
        label: "Direct prob.",
        format: (value) => formatProbabilityFromLogBf(value),
    },
    {
        key: "indirect_score",
        label: "Indirect prob.",
        format: (value) => formatProbabilityFromLogBf(value),
    },
];

export function buildMatrixCellLookup(matrix) {
    const lookup = new Map();
    for (const cell of matrix?.cells || []) {
        lookup.set(`${cell.row_id}::${cell.column_id}`, cell);
    }
    return lookup;
}

/** Build a graph-local chain payload for trait packet requests. */
export function buildGraphSigChainForTrait(traitNode, session) {
    const traitId = traitNode?.id;
    if (!traitId || !session) {
        return null;
    }
    const nodeIds = new Set([traitId]);
    const edges = [];
    for (const edge of [
        ...(session.graphEdges || []),
        ...(session.contextualEdges || []),
    ]) {
        if (!edge?.source || !edge?.target) {
            continue;
        }
        if (edge.source !== traitId && edge.target !== traitId) {
            continue;
        }
        edges.push(edge);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
    }
    const nodes = (session.graphNodes || [])
        .filter((node) => nodeIds.has(node.id))
        .map((node) => ({
            id: node.id,
            label: node.label || node.id,
            type: node.node_type || node.type || "",
            node_type: node.node_type || node.type || "",
        }));
    return {
        chain_id: `trait-inspector:${traitId}`,
        title: traitNode.label || traitId,
        nodes,
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            family: edge.family || edge.relation || "",
            label: edge.label || "",
        })),
    };
}

/** Trait rows for SigChainNodeSummaryPanel (trait node type). */
export function buildTraitSigChainSummaryRows(node, packet) {
    if (!node?.id || !packet?.matrices) {
        return { geneRows: [], factorRows: [] };
    }
    const geneTrait = packet.matrices.gene_trait || {};
    const factorTrait = packet.matrices.factor_trait || {};
    const geneTraitLookup = buildMatrixCellLookup(geneTrait);
    const factorTraitLookup = buildMatrixCellLookup(factorTrait);

    const geneRows = (geneTrait.rows || [])
        .map((row) => {
            const cell = geneTraitLookup.get(`${row.id}::${node.id}`);
            if (!cell) {
                return null;
            }
            return {
                gene: row.label,
                combined_score: cell.score,
                direct_score: cell.direct_score,
                indirect_score: cell.indirect_score,
            };
        })
        .filter(Boolean);

    const factorRows = (factorTrait.rows || [])
        .map((row) => {
            const cell = factorTraitLookup.get(`${row.id}::${node.id}`);
            if (!cell) {
                return null;
            }
            return {
                factor: row.label,
                relevance_score: cell.score,
                family: cell.family || "",
            };
        })
        .filter(Boolean);

    return { geneRows, factorRows };
}

/** Build a graph-local chain payload for mechanism (factor) packet requests. */
export function buildGraphSigChainForFactor(factorNode, session) {
    const factorId = factorNode?.id;
    if (!factorId || !session) {
        return null;
    }
    const nodeIds = new Set([factorId]);
    const edges = [];
    for (const edge of [
        ...(session.graphEdges || []),
        ...(session.contextualEdges || []),
    ]) {
        if (!edge?.source || !edge?.target) {
            continue;
        }
        if (edge.source !== factorId && edge.target !== factorId) {
            continue;
        }
        edges.push(edge);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
    }
    const nodes = (session.graphNodes || [])
        .filter((node) => nodeIds.has(node.id))
        .map((node) => ({
            id: node.id,
            label: node.label || node.id,
            type: node.node_type || node.type || "",
            node_type: node.node_type || node.type || "",
        }));
    return {
        chain_id: `mechanism-inspector:${factorId}`,
        title: factorNode.label || factorId,
        nodes,
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            family: edge.family || edge.relation || "",
            label: edge.label || "",
        })),
    };
}

/** Mechanism rows for SigChainNodeSummaryPanel (factor node type). */
export function buildFactorSigChainSummaryRows(node, packet) {
    if (!node?.id || !packet?.matrices) {
        return { geneRows: [], traitRows: [], geneSetRows: [] };
    }
    const geneFactor = packet.matrices.gene_factor || {};
    const factorTrait = packet.matrices.factor_trait || {};
    const geneFactorLookup = buildMatrixCellLookup(geneFactor);
    const factorTraitLookup = buildMatrixCellLookup(factorTrait);

    const geneRows = (geneFactor.rows || [])
        .map((row) => {
            const cell = geneFactorLookup.get(`${row.id}::${node.id}`);
            if (!cell) {
                return null;
            }
            return {
                gene: row.label,
                loading: cell.loading,
                relative_loading: cell.relative_loading,
                combined_loading: cell.combined_loading,
            };
        })
        .filter(Boolean);

    const traitRows = (factorTrait.columns || [])
        .map((column) => {
            const cell = factorTraitLookup.get(`${node.id}::${column.id}`);
            if (!cell) {
                return null;
            }
            return {
                trait: column.label,
                relevance_score: cell.score,
                family: cell.family || "",
            };
        })
        .filter(Boolean);

    const geneSetRows = (packet.factor_details?.[node.id]?.top_gene_sets || []).map(
        (row) => ({
            gene_set: row.gene_set || row.label || "",
            loading: row.loading,
            beta_uncorrected: row.beta_uncorrected ?? row.beta,
        })
    );

    return { geneRows, traitRows, geneSetRows };
}
