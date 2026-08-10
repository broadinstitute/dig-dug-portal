/**
 * Mechanism-hypothesis normalization for Multi Query REVEAL: attaches KG-derived gene scores
 * and builds supporting/core-spine networks for display.
 */

import {
    buildMechanismFlowNetworkFromHypothesisKg,
    buildNetworkFromFlattenedRowIds,
    extractGeneConnectionsFromFlattened,
    extractRelevantFactorsAndGeneSetsFromFlattened,
    filterSupportingNetworkToCandidateGenes,
    getGeneScoresFromFlattenedKG,
} from "./revealMqNetworkBuild.js";
import { resolveSupportingRowIdsFromCitations } from "./revealMqFreeTextLlmFeed.js";

function isGeneSetHypothesisPath(vm) {
    return !!(vm && vm.searchPath === "genes");
}

function nonEmptyString(value) {
    if (value == null) return null;
    const s = String(value).trim();
    return s ? s : null;
}

/**
 * Coerce common off-schema LLM aliases into geneSetMechanismHypothesisResponse.v1 shape.
 * Gene-set path only. Idempotent for already-correct payloads.
 */
function coerceGeneSetHypothesisShape(raw) {
    if (!raw || typeof raw !== "object") return raw;
    const h = { ...raw };

    // genes[].symbol → gene; synthesize role when omitted
    if (Array.isArray(h.genes)) {
        h.genes = h.genes.map((g) => {
            if (!g || typeof g !== "object") return g;
            const gene = nonEmptyString(g.gene) || nonEmptyString(g.symbol);
            let role =
                nonEmptyString(g.role) || nonEmptyString(g.reason) || nonEmptyString(g.description);
            if (!role && gene) {
                if (g.is_input === true) role = "Search anchor gene from input set.";
                else if (/primary mechanistic/i.test(String(g.group || ""))) {
                    role = "Primary mechanistic candidate from factorization evidence.";
                } else {
                    role = "Supporting network gene from cited factors.";
                }
            }
            const next = { ...g };
            if (gene) next.gene = gene;
            if (role) next.role = role;
            return next;
        });
    }

    // phenotype_name / phenotype_id → term
    if (Array.isArray(h.phenotype_disease_mappings)) {
        h.phenotype_disease_mappings = h.phenotype_disease_mappings.map((m) => {
            if (!m || typeof m !== "object") return m;
            const term =
                nonEmptyString(m.term) ||
                nonEmptyString(m.phenotype_name) ||
                nonEmptyString(m.name) ||
                nonEmptyString(m.phenotype_id) ||
                nonEmptyString(m.id);
            const source_refs = Array.isArray(m.source_refs)
                ? m.source_refs.map((s) => String(s).trim()).filter(Boolean)
                : [];
            const idRef = nonEmptyString(m.phenotype_id) || nonEmptyString(m.id);
            if (idRef && !source_refs.includes(idRef)) source_refs.push(idRef);
            return {
                ...m,
                term: term || "—",
                provenance: nonEmptyString(m.provenance) || "LLM_INFERRED",
                source_refs: source_refs.length ? source_refs : ["—"],
            };
        });
    }

    // next_steps: description → action (+ reason fallback)
    if (Array.isArray(h.next_steps)) {
        h.next_steps = h.next_steps.map((step) => {
            if (!step || typeof step !== "object") return step;
            const action =
                nonEmptyString(step.action) ||
                nonEmptyString(step.description) ||
                nonEmptyString(step.text);
            const reason =
                nonEmptyString(step.reason) ||
                (action && !nonEmptyString(step.action) && nonEmptyString(step.description)
                    ? "Supports follow-up on this mechanism."
                    : action);
            return {
                ...step,
                category: nonEmptyString(step.category) || "Literature Review",
                action: action || "—",
                reason: reason || "—",
            };
        });
    }

    if (typeof h.warning_flag === "boolean") {
        h.warning_flag = h.warning_flag ? "Warning" : null;
    }

    // hypothesis_spine: array nodes + hypothesis_spine_edges → { caption, nodes, edges }
    const spineRaw = h.hypothesis_spine;
    const edgesRaw = Array.isArray(h.hypothesis_spine_edges)
        ? h.hypothesis_spine_edges
        : Array.isArray(h.spine_edges)
          ? h.spine_edges
          : null;

    const normalizeSpineNode = (n, idx) => {
        if (!n || typeof n !== "object") return null;
        const id = nonEmptyString(n.id) || `n${idx + 1}`;
        const type =
            nonEmptyString(n.type) ||
            nonEmptyString(n.node_type) ||
            nonEmptyString(n.group) ||
            "OTHER";
        return {
            ...n,
            id,
            label: nonEmptyString(n.label) || id,
            type,
            ref: Object.prototype.hasOwnProperty.call(n, "ref") ? n.ref : null,
        };
    };

    const normalizeSpineEdge = (e) => {
        if (!e || typeof e !== "object") return null;
        const from = nonEmptyString(e.from) || nonEmptyString(e.source);
        const to = nonEmptyString(e.to) || nonEmptyString(e.target);
        if (!from || !to) return null;
        return {
            from,
            to,
            predicate: nonEmptyString(e.predicate) || nonEmptyString(e.label) || "OTHER",
            ...(nonEmptyString(e.label) ? { label: nonEmptyString(e.label) } : {}),
        };
    };

    if (Array.isArray(spineRaw)) {
        const nodes = spineRaw.map(normalizeSpineNode).filter(Boolean);
        const edges = (edgesRaw || []).map(normalizeSpineEdge).filter(Boolean);
        const caption =
            nonEmptyString(h.hypothesis_spine_caption) ||
            nodes.map((n) => n.label).filter(Boolean).join(" → ");
        h.hypothesis_spine = { caption: caption || "", nodes, edges };
    } else if (spineRaw && typeof spineRaw === "object") {
        const nodesIn = Array.isArray(spineRaw.nodes) ? spineRaw.nodes : [];
        const edgesIn = Array.isArray(spineRaw.edges) ? spineRaw.edges : edgesRaw || [];
        const nodes = nodesIn.map(normalizeSpineNode).filter(Boolean);
        const edges = edgesIn.map(normalizeSpineEdge).filter(Boolean);
        h.hypothesis_spine = {
            caption:
                nonEmptyString(spineRaw.caption) ||
                nodes.map((n) => n.label).filter(Boolean).join(" → ") ||
                "",
            nodes,
            edges,
        };
    }

    return h;
}

/** Best factor_relevance / gene_score for a symbol from slim gene-set-entry LLM feed or factorData. */
function lookupGeneSetEntryGeneScores(vm, geneSymbol) {
    const sym = String(geneSymbol || "").trim();
    const symU = sym.toUpperCase();
    if (!sym) {
        return {
            combined: null,
            gwas: null,
            functional: null,
            factor_relevance: null,
            gene_score: null,
            is_input: null,
        };
    }

    let bestRel = null;
    let bestGeneScore = null;
    let isInput = null;

    const consider = (rel, gs, inputFlag) => {
        if (typeof inputFlag === "boolean" && isInput == null) isInput = inputFlag;
        if (rel != null && (bestRel == null || Math.abs(rel) > Math.abs(bestRel))) bestRel = rel;
        if (gs != null && (bestGeneScore == null || Math.abs(gs) > Math.abs(bestGeneScore))) {
            bestGeneScore = gs;
        }
    };

    const feed = vm && vm.lastGeneSetEntryLlmFeed;
    if (feed && Array.isArray(feed.factors)) {
        for (const factor of feed.factors) {
            const genes = Array.isArray(factor && factor.genes) ? factor.genes : [];
            for (const g of genes) {
                if (!g || String(g.symbol || "").trim().toUpperCase() !== symU) continue;
                const rel =
                    g.factor_relevance != null && !Number.isNaN(Number(g.factor_relevance))
                        ? Number(g.factor_relevance)
                        : null;
                const gs =
                    g.gene_score != null && !Number.isNaN(Number(g.gene_score))
                        ? Number(g.gene_score)
                        : null;
                consider(rel, gs, typeof g.is_input === "boolean" ? g.is_input : null);
            }
        }
    }

    const data = (vm && vm.factorData) || {};
    Object.keys(data).forEach((fid) => {
        const bucket = data[fid];
        const factorObj = bucket && Array.isArray(bucket.factors) && bucket.factors[0] ? bucket.factors[0] : null;
        const geneMap =
            (factorObj && factorObj.genes && typeof factorObj.genes === "object" ? factorObj.genes : null) ||
            (bucket && bucket.genes && typeof bucket.genes === "object" ? bucket.genes : {}) ||
            {};
        const key = Object.prototype.hasOwnProperty.call(geneMap, sym)
            ? sym
            : Object.keys(geneMap).find((k) => String(k).toUpperCase() === symU);
        if (!key) return;
        const entry = geneMap[key];
        if (!entry || typeof entry !== "object") return;
        let inputFlag = null;
        if (entry.includedFromRequest === true) inputFlag = true;
        else if (typeof entry.is_input === "boolean") inputFlag = entry.is_input;
        const relRaw =
            entry.factor_value != null
                ? entry.factor_value
                : entry.factorRelevance != null
                  ? entry.factorRelevance
                  : entry.factor_relevance;
        const rel = relRaw != null && !Number.isNaN(Number(relRaw)) ? Number(relRaw) : null;
        const gs =
            entry.gene_score != null && !Number.isNaN(Number(entry.gene_score))
                ? Number(entry.gene_score)
                : null;
        consider(rel, gs, inputFlag);
    });

    return {
        combined: bestRel,
        gwas: null,
        functional: bestGeneScore,
        factor_relevance: bestRel,
        gene_score: bestGeneScore,
        is_input: isInput,
    };
}

/**
 * Build evidence lists for gene-set schema hypotheses from cited IDs + factorData/feed.
 */
function enrichGeneSetHypothesisEvidence(vm, h, out) {
    const citedSets = Array.isArray(h.cited_gene_set_names)
        ? h.cited_gene_set_names.map((s) => String(s).trim()).filter(Boolean)
        : [];
    const factorIds = Array.isArray(h.associated_factor_ids)
        ? h.associated_factor_ids.map((s) => String(s).trim()).filter(Boolean)
        : [];
    out.cited_gene_symbols = Array.isArray(h.cited_gene_symbols)
        ? h.cited_gene_symbols.map((s) => String(s).trim()).filter(Boolean)
        : [];
    out.cited_gene_set_names = citedSets;
    out.associated_factor_ids = factorIds;
    out.phenotype_disease_mappings = Array.isArray(h.phenotype_disease_mappings)
        ? h.phenotype_disease_mappings
        : [];
    out.rationale =
        h.rationale != null && String(h.rationale).trim() ? String(h.rationale).trim() : null;

    if (!Array.isArray(out.relevant_gene_sets) || !out.relevant_gene_sets.length) {
        out.relevant_gene_sets = citedSets.slice();
    }
    if (!Array.isArray(out.relevant_factors) || !out.relevant_factors.length) {
        out.relevant_factors = factorIds.slice();
    }

    const geneConnections = {};
    const genes = out.candidate_genes || h.genes || [];
    genes.forEach((g) => {
        const symbol = g && (g.gene != null ? String(g.gene).trim() : "");
        if (!symbol) return;
        const src = Array.isArray(g.source_factor_ids)
            ? g.source_factor_ids.map((s) => String(s).trim()).filter(Boolean)
            : factorIds.slice();
        geneConnections[symbol] = {
            gene_sets: citedSets.slice(),
            factors: src,
        };
    });
    if (Object.keys(geneConnections).length) {
        out.gene_connections = geneConnections;
    }
}

/**
 * Normalize mechanism hypotheses for display. LLM returns genes (no scores); we attach scores from the KG.
 * @param {Object} vm - shell instance (reads factorData; calls filterMechanismReportPhenotypes /
 *   buildGeneConnectionsFromAssociatedRows, which stay table/selection-state-coupled shell methods).
 * @param {Array} hypotheses - Raw hypotheses from LLM.
 * @param {Array|null|undefined} flattenedOverride - If provided, use for scoring/networks instead of lastFlattenedKG (ad-hoc single-pair runs).
 */
function normalizeMechanismHypotheses(vm, hypotheses, flattenedOverride) {
    const flattened =
        flattenedOverride !== undefined && flattenedOverride !== null ? flattenedOverride : vm.lastFlattenedKG;
    const geneSetPath = isGeneSetHypothesisPath(vm);
    return (hypotheses || []).map((rawH) => {
        const h = geneSetPath ? coerceGeneSetHypothesisShape(rawH) : rawH;
        const out = { ...h };
        if (Array.isArray(h.genes) && out.candidate_genes == null) {
            const withScores = h.genes.map((g) => {
                const scoresFromKg = geneSetPath
                    ? lookupGeneSetEntryGeneScores(vm, g.gene)
                    : flattened
                      ? getGeneScoresFromFlattenedKG(flattened, g.gene)
                      : { combined: null, gwas: null, functional: null };
                const isInput =
                    typeof g.is_input === "boolean"
                        ? g.is_input
                        : scoresFromKg.is_input != null
                          ? scoresFromKg.is_input
                          : null;
                return {
                    gene: g.gene,
                    group: g.group,
                    scores: {
                        combined: scoresFromKg.combined,
                        gwas: scoresFromKg.gwas,
                        functional: scoresFromKg.functional,
                        factor_relevance:
                            scoresFromKg.factor_relevance != null
                                ? scoresFromKg.factor_relevance
                                : scoresFromKg.combined,
                        gene_score:
                            scoresFromKg.gene_score != null
                                ? scoresFromKg.gene_score
                                : scoresFromKg.functional,
                    },
                    is_input: isInput,
                    source_factor_ids: Array.isArray(g.source_factor_ids) ? g.source_factor_ids : undefined,
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
        // Free-text report no longer surfaces these optional LLM fields.
        out.cross_route_crosstalk_model = null;
        out.candidate_inventory = null;
        out.cellular_assignment = null;
        out.depot_contrast = null;
        out.effect_direction_notes = [];
        if (!geneSetPath) {
            const citedSets = Array.isArray(h.cited_gene_set_names)
                ? h.cited_gene_set_names.map((s) => String(s).trim()).filter(Boolean)
                : [];
            if (citedSets.length) {
                out.cited_gene_set_names = citedSets;
                if (!Array.isArray(out.relevant_gene_sets) || !out.relevant_gene_sets.length) {
                    out.relevant_gene_sets = citedSets.slice();
                }
            }
            const hasSupportingIds =
                Array.isArray(h.supporting_row_ids) && h.supporting_row_ids.length > 0;
            if (!hasSupportingIds && flattened && flattened.length) {
                out.supporting_row_ids = resolveSupportingRowIdsFromCitations(flattened, {
                    ...h,
                    cited_gene_set_names: citedSets,
                    genes: h.genes,
                    associated_pairs: h.associated_pairs,
                });
            }
        }
        if (h.network != null && out.supporting_network == null) out.supporting_network = h.network;
        if (
            (out.supporting_network == null || !out.supporting_network.nodes?.length) &&
            Array.isArray(out.supporting_row_ids || h.supporting_row_ids) &&
            flattened &&
            flattened.length > 0
        ) {
            out.supporting_network = buildNetworkFromFlattenedRowIds(
                flattened,
                out.supporting_row_ids || h.supporting_row_ids
            );
        }
        if (Array.isArray(out.supporting_row_ids || h.supporting_row_ids) && flattened && flattened.length > 0) {
            const supportIds = out.supporting_row_ids || h.supporting_row_ids;
            const fd = vm.factorData || {};
            const { relevant_phenotypes, relevant_factors, relevant_gene_sets } =
                extractRelevantFactorsAndGeneSetsFromFlattened(flattened, supportIds, fd);
            out.relevant_phenotypes = vm.filterMechanismReportPhenotypes(
                relevant_phenotypes,
                h.associated_pairs
            );
            out.relevant_factors = relevant_factors;
            if (!Array.isArray(out.relevant_gene_sets) || !out.relevant_gene_sets.length) {
                out.relevant_gene_sets = relevant_gene_sets;
            }
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
                : extractGeneConnectionsFromFlattened(flattened, supportIds, fd);
        }
        if (geneSetPath) {
            enrichGeneSetHypothesisEvidence(vm, h, out);
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

        // Gene-set schema uses hypothesis_spine; free-text uses hypothesis_in_kg.
        let hik = h.hypothesis_in_kg;
        if (
            geneSetPath &&
            (!hik || !Array.isArray(hik.nodes) || !hik.nodes.length) &&
            h.hypothesis_spine &&
            typeof h.hypothesis_spine === "object"
        ) {
            hik = h.hypothesis_spine;
            out.hypothesis_spine = h.hypothesis_spine;
            out.hypothesis_in_kg = {
                caption:
                    h.hypothesis_spine.caption != null ? String(h.hypothesis_spine.caption) : "",
            };
        }

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
                        out.hypothesis_in_kg.caption != null
                            ? String(out.hypothesis_in_kg.caption)
                            : hik.caption != null
                              ? String(hik.caption)
                              : "";
                    out.hypothesis_in_kg = cap ? { caption: cap } : null;
                } else if (hik.caption != null && String(hik.caption).trim()) {
                    out.hypothesis_in_kg = { caption: String(hik.caption).trim() };
                }
            }
        } else if (
            !geneSetPath &&
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

export { normalizeMechanismHypotheses };
