/**
 * Mechanism-hypothesis normalization for Multi Query REVEAL: attaches KG-derived gene scores,
 * builds supporting/core-spine networks, and reshapes the LLM candidate-gene inventory for display.
 */

import {
    buildMechanismFlowNetworkFromHypothesisKg,
    buildNetworkFromFlattenedRowIds,
    extractGeneConnectionsFromFlattened,
    extractRelevantFactorsAndGeneSetsFromFlattened,
    filterSupportingNetworkToCandidateGenes,
    getGeneScoresFromFlattenedKG,
} from "./revealMqNetworkBuild.js";

const CANDIDATE_INVENTORY_CATEGORIES = [
    "core_pathway_anchors",
    "route_specific_support_genes",
    "downstream_structural_remodeling_candidates",
    "cross_tissue_endocrine_candidates",
    "requested_genes_not_sufficiently_connected",
];

function normalizeCandidateInventory(raw) {
    const categories = CANDIDATE_INVENTORY_CATEGORIES;
    const out = {};
    const bestBySymbol = {};
    const priority = {
        requested_genes_not_sufficiently_connected: 1,
        cross_tissue_endocrine_candidates: 2,
        downstream_structural_remodeling_candidates: 3,
        core_pathway_anchors: 4,
        route_specific_support_genes: 5,
    };
    categories.forEach((key) => {
        const value = raw && raw[key] != null ? raw[key] : [];
        const items = Array.isArray(value) ? value : [value];
        out[key] = [];
        items
            .map((item) => {
                if (item == null) return null;
                if (typeof item === "string") {
                    const symbol = item.trim();
                    return symbol ? { symbol, provenance: [], reason: "" } : null;
                }
                if (typeof item !== "object") return null;
                const symbol = item.symbol != null
                    ? String(item.symbol).trim()
                    : (item.gene != null ? String(item.gene).trim() : "");
                const provenance = Array.isArray(item.provenance)
                    ? item.provenance.map((p) => String(p || "").trim()).filter(Boolean)
                    : (item.provenance != null
                        ? String(item.provenance).split(/[,;|]/).map((p) => p.trim()).filter(Boolean)
                        : []);
                const reason = item.reason != null
                    ? String(item.reason).trim()
                    : (item.note != null ? String(item.note).trim() : "");
                return symbol ? { symbol, provenance, reason } : null;
            })
            .filter(Boolean)
            .forEach((entry, originalIndex) => {
                const symbolKey = String(entry.symbol || "").trim().toUpperCase();
                if (!symbolKey) return;
                if (symbolKey === "SPARSE/MISSING") {
                    out[key].push(entry);
                    return;
                }
                const candidate = {
                    key,
                    entry,
                    priority: priority[key] || 99,
                    originalIndex,
                };
                const prev = bestBySymbol[symbolKey];
                if (!prev || candidate.priority < prev.priority) {
                    bestBySymbol[symbolKey] = candidate;
                }
            });
    });
    Object.keys(bestBySymbol).forEach((symbolKey) => {
        const picked = bestBySymbol[symbolKey];
        if (!out[picked.key]) out[picked.key] = [];
        out[picked.key].push(picked.entry);
    });
    categories.forEach((key) => {
        out[key] = (out[key] || []).slice(0, 5);
    });
    return out;
}

function candidateInventoryRows(inventory) {
    if (!inventory || typeof inventory !== "object") return [];
    const labels = [
        ["core_pathway_anchors", "Core pathway anchors"],
        ["route_specific_support_genes", "Route-specific support genes"],
        ["downstream_structural_remodeling_candidates", "Downstream structural/remodeling candidates"],
        ["cross_tissue_endocrine_candidates", "Cross-tissue/endocrine candidates"],
        ["requested_genes_not_sufficiently_connected", "Requested genes not sufficiently connected"],
    ];
    const rows = [];
    labels.forEach(([key, label]) => {
        (Array.isArray(inventory[key]) ? inventory[key] : []).forEach((item) => {
            rows.push({
                category: label,
                symbol: item.symbol || "Sparse/missing",
                provenance: Array.isArray(item.provenance) && item.provenance.length
                    ? item.provenance.join(", ")
                    : "-",
                reason: item.reason || "Category sparse/missing based on current graph boundaries.",
            });
        });
    });
    return rows;
}

/**
 * Normalize mechanism hypotheses for display. LLM returns genes (no scores); we attach scores from the KG.
 * @param {Object} vm - shell instance (reads factorData; calls filterMechanismReportPhenotypes /
 *   buildGeneConnectionsFromAssociatedRows / normalizeCellularAssignment / normalizeDepotContrast /
 *   normalizeEffectDirectionNotes, which stay table/selection-state-coupled shell methods).
 * @param {Array} hypotheses - Raw hypotheses from LLM.
 * @param {Array|null|undefined} flattenedOverride - If provided, use for scoring/networks instead of lastFlattenedKG (ad-hoc single-pair runs).
 */
function normalizeMechanismHypotheses(vm, hypotheses, flattenedOverride) {
    const flattened =
        flattenedOverride !== undefined && flattenedOverride !== null ? flattenedOverride : vm.lastFlattenedKG;
    return (hypotheses || []).map((h) => {
        const out = { ...h };
        if (Array.isArray(h.genes) && out.candidate_genes == null) {
            const withScores = h.genes.map((g) => {
                const scoresFromKg = flattened ? getGeneScoresFromFlattenedKG(flattened, g.gene) : { combined: null, gwas: null, functional: null };
                return {
                    gene: g.gene,
                    group: g.group,
                    scores: {
                        combined: scoresFromKg.combined,
                        gwas: scoresFromKg.gwas,
                        functional: scoresFromKg.functional,
                    },
                    reason: g.role != null ? g.role : g.reason,
                };
            });
            const primaryBoost = (row) => (/primary mechanistic/i.test(String(row.group || "")) ? 1 : 0);
            withScores.sort((a, b) => {
                const pb = primaryBoost(b) - primaryBoost(a);
                if (pb !== 0) return pb;
                return (b.scores?.combined ?? -Infinity) - (a.scores?.combined ?? -Infinity);
            });
            out.candidate_genes = withScores;
        }
        if (h.novelty != null && out.novelty_explanation == null) out.novelty_explanation = h.novelty;
        out.pathway_shift_rationale =
            h.pathway_shift_rationale != null && String(h.pathway_shift_rationale).trim()
                ? String(h.pathway_shift_rationale).trim()
                : null;
        out.cross_route_crosstalk_model =
            h.cross_route_crosstalk_model != null && String(h.cross_route_crosstalk_model).trim()
                ? String(h.cross_route_crosstalk_model).trim()
                : null;
        out.candidate_inventory =
            h.candidate_inventory != null && typeof h.candidate_inventory === "object"
                ? normalizeCandidateInventory(h.candidate_inventory)
                : null;
        out.cellular_assignment = vm.normalizeCellularAssignment(h.cellular_assignment);
        out.depot_contrast = vm.normalizeDepotContrast(h.depot_contrast);
        out.effect_direction_notes = vm.normalizeEffectDirectionNotes(h.effect_direction_notes);
        if (h.network != null && out.supporting_network == null) out.supporting_network = h.network;
        if (
            (out.supporting_network == null || !out.supporting_network.nodes?.length) &&
            Array.isArray(h.supporting_row_ids) &&
            flattened &&
            flattened.length > 0
        ) {
            out.supporting_network = buildNetworkFromFlattenedRowIds(flattened, h.supporting_row_ids);
        }
        if (Array.isArray(h.supporting_row_ids) && flattened && flattened.length > 0) {
            const fd = vm.factorData || {};
            const { relevant_phenotypes, relevant_factors, relevant_gene_sets } =
                extractRelevantFactorsAndGeneSetsFromFlattened(flattened, h.supporting_row_ids, fd);
            out.relevant_phenotypes = vm.filterMechanismReportPhenotypes(
                relevant_phenotypes,
                h.associated_pairs
            );
            out.relevant_factors = relevant_factors;
            out.relevant_gene_sets = relevant_gene_sets;
            const rowAligned = vm.buildGeneConnectionsFromAssociatedRows(
                { ...out, associated_pairs: h.associated_pairs },
                out.candidate_genes || h.genes
            );
            const hasRowAligned = Object.values(rowAligned).some(
                (c) =>
                    (Array.isArray(c.gene_sets) && c.gene_sets.length) ||
                    (Array.isArray(c.factors) && c.factors.length)
            );
            out.gene_connections = hasRowAligned
                ? rowAligned
                : extractGeneConnectionsFromFlattened(flattened, h.supporting_row_ids, fd);
        }
        const candForNet = out.candidate_genes || h.candidate_genes;
        if (
            Array.isArray(candForNet) &&
            candForNet.length > 0 &&
            out.supporting_network &&
            Array.isArray(out.supporting_network.nodes) &&
            out.supporting_network.nodes.length > 0
        ) {
            out.supporting_network = filterSupportingNetworkToCandidateGenes(
                out.supporting_network,
                candForNet
            );
        }
        out.next_steps = Array.isArray(h.next_steps) ? h.next_steps : [];
        out.next_queries = Array.isArray(h.next_queries) ? h.next_queries : [];
        out.hypothesis_in_kg =
            h.hypothesis_in_kg != null && typeof h.hypothesis_in_kg === "object"
                ? { ...h.hypothesis_in_kg }
                : null;
        out.core_spine_network = null;
        const hik = h.hypothesis_in_kg;
        if (
            hik &&
            Array.isArray(hik.nodes) &&
            hik.nodes.length > 0 &&
            Array.isArray(hik.edges) &&
            hik.edges.length > 0
        ) {
            const flow = buildMechanismFlowNetworkFromHypothesisKg(hik);
            if (flow && flow.nodes.length && flow.edges.length) {
                out.core_spine_network = flow;
                if (out.hypothesis_in_kg && typeof out.hypothesis_in_kg === "object") {
                    const cap =
                        out.hypothesis_in_kg.caption != null ? String(out.hypothesis_in_kg.caption) : "";
                    out.hypothesis_in_kg = cap ? { caption: cap } : null;
                }
            }
        } else if (
            flattened &&
            flattened.length > 0 &&
            hik &&
            Array.isArray(hik.core_spine_row_ids) &&
            hik.core_spine_row_ids.length > 0
        ) {
            const flatIdSet = new Set(
                (flattened || []).map((r) => Number(r.id)).filter((n) => !Number.isNaN(n))
            );
            const supportSet = new Set(
                (Array.isArray(h.supporting_row_ids) ? h.supporting_row_ids : [])
                    .map(Number)
                    .filter((n) => !Number.isNaN(n))
            );
            let spineIds = hik.core_spine_row_ids
                .map(Number)
                .filter((id) => !Number.isNaN(id) && flatIdSet.has(id) && supportSet.has(id));
            if (spineIds.length === 0) {
                spineIds = hik.core_spine_row_ids
                    .map(Number)
                    .filter((id) => !Number.isNaN(id) && flatIdSet.has(id));
            }
            spineIds = spineIds.slice(0, 8);
            if (spineIds.length > 0) {
                out.core_spine_network = buildNetworkFromFlattenedRowIds(flattened, spineIds);
            }
        }
        return out;
    });
}

export { candidateInventoryRows, normalizeCandidateInventory, normalizeMechanismHypotheses };
