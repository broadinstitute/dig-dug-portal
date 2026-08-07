/**
 * Gene-set path: scope factorData, then emit slim LLM feed (factors + gene_indices).
 * Scope is applied before formatting. No knowledgeGraphCsv.
 */

import {
    HEATMAP_SELECTION_KIND,
    normalizeHeatmapViewFilters,
} from "./revealMqHeatmapSelection.js";
import { buildGeneSetEntryRawExport } from "./revealMqGeneSetEntryRawExport.js";

/** User-chosen LLM feed scope (gene-set entry Continue gate). */
export const GENE_SET_ENTRY_LLM_FEED_SCOPE = {
    /** Only heatmap/network selections. */
    SELECTED: "selected",
    /** Selections, plus ensure search/input genes are present. */
    SELECTED_PLUS_SEARCH: "selected_plus_search",
    /** Everything currently visible given viz view filters (incl. Only selected if on). */
    VISUALIZER: "visualizer",
};

export const GENE_SET_ENTRY_LLM_FEED_SCOPE_OPTIONS = [
    {
        value: GENE_SET_ENTRY_LLM_FEED_SCOPE.SELECTED,
        label: "Selected only",
        help: "only gene set clusters, genes, and gene sets you selected in the visualizer",
    },
    {
        value: GENE_SET_ENTRY_LLM_FEED_SCOPE.SELECTED_PLUS_SEARCH,
        label: "Selected + searched genes",
        help: "your selections, plus search/input genes and their gene set clusters from the visualizer",
    },
    {
        value: GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER,
        label: "Full data in the visualizer",
        help: "everything currently shown given the Gene set clusters / Gene sets / Genes / Genes in search / Only selected filters",
    },
];

function cloneJson(value, fallback) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return fallback;
    }
}

function inputSetFrom(inputGenes) {
    return new Set(
        (Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()).filter(Boolean)
    );
}

function factorKey(phenotypeOrFactor) {
    return phenotypeOrFactor != null ? String(phenotypeOrFactor) : "";
}

/**
 * Collect selection sets from heatmap/network selection nodes.
 */
function collectSelectionSets(selectedNodes) {
    const factorIds = new Set();
    const genes = new Set();
    const geneSets = new Set();
    (Array.isArray(selectedNodes) ? selectedNodes : []).forEach((n) => {
        if (!n || !n.kind) return;
        if (n.kind === HEATMAP_SELECTION_KIND.ROW) {
            const id = factorKey(n.phenotype != null ? n.phenotype : n.factor);
            if (id) factorIds.add(id);
            return;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.GENE) {
            const g = String(n.gene || n.label || "").trim();
            if (g) genes.add(g);
            return;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.GENE_SET) {
            const gs = String(n.geneSetId || n.label || "").trim();
            if (gs) geneSets.add(gs);
            return;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.CROSSING) {
            const id = factorKey(n.phenotype != null ? n.phenotype : n.factor);
            if (id) factorIds.add(id);
            const col = String(n.colLabel || "").trim();
            if (!col) return;
            if (n.colIsGeneSet) geneSets.add(col);
            else genes.add(col);
            return;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.NETWORK_NODE) {
            const typ = String(n.nodeType || n.type || "").trim();
            const label = String(n.label || n.nodeLabel || "").trim();
            const id = String(n.nodeId || n.id || "").trim();
            if (typ === "Factor" || typ === "Phenotype") {
                const fid = factorKey(label || id.replace(/^factor:/i, ""));
                if (fid) factorIds.add(fid);
            } else if (typ === "Gene") {
                if (label) genes.add(label);
            } else if (typ === "Pathway" || typ === "Gene set" || typ === "GeneSet") {
                if (label) geneSets.add(label);
            }
        }
    });
    return { factorIds, genes, geneSets };
}

function getFactorObj(bucket) {
    if (!bucket || !Array.isArray(bucket.factors) || !bucket.factors[0]) return null;
    return bucket.factors[0];
}

function rebuildBucket(factorId, factorObj, genes, geneSets) {
    const topSets = Object.keys(geneSets || {}).join(";");
    const nextFactor = {
        ...factorObj,
        genes: genes || {},
        geneSets: geneSets || {},
        top_gene_sets: topSets,
    };
    return {
        genes: { ...(genes || {}) },
        factors: [nextFactor],
        allFactors: [nextFactor],
    };
}

/**
 * Apply Gene sets / Genes / Genes in search / Only selected the same way the heatmap does.
 */
function projectVisualizerFactorData(factorData, viewFilters, selectedNodes, inputGenes) {
    const vf = normalizeHeatmapViewFilters(viewFilters);
    const inputSet = inputSetFrom(inputGenes);
    const selected = collectSelectionSets(selectedNodes);
    const hasRowSel = selected.factorIds.size > 0;
    const hasColSel = selected.genes.size > 0 || selected.geneSets.size > 0;
    const data = factorData && typeof factorData === "object" ? factorData : {};
    const out = {};

    Object.keys(data).forEach((factorId) => {
        if (vf.onlySelected && hasRowSel && !selected.factorIds.has(factorId)) return;

        const bucket = data[factorId];
        const factorObj = getFactorObj(bucket);
        if (!factorObj) return;

        const srcGenes = factorObj.genes && typeof factorObj.genes === "object" ? factorObj.genes : {};
        const srcSets =
            factorObj.geneSets && typeof factorObj.geneSets === "object" ? factorObj.geneSets : {};

        let genes = {};
        if (vf.genesInSearchOnly) {
            Object.keys(srcGenes).forEach((g) => {
                const entry = srcGenes[g] || {};
                if (entry.includedFromRequest === true || inputSet.has(String(g).toUpperCase())) {
                    genes[g] = entry;
                }
            });
        } else if (vf.showGenes) {
            genes = { ...srcGenes };
        }

        let geneSets = vf.showGeneSets ? { ...srcSets } : {};

        if (vf.onlySelected && hasColSel) {
            const nextGenes = {};
            Object.keys(genes).forEach((g) => {
                if (selected.genes.has(g)) nextGenes[g] = genes[g];
            });
            genes = nextGenes;
            const nextSets = {};
            Object.keys(geneSets).forEach((gs) => {
                if (selected.geneSets.has(gs)) nextSets[gs] = geneSets[gs];
            });
            geneSets = nextSets;
        }

        if (!Object.keys(genes).length && !Object.keys(geneSets).length) return;
        out[factorId] = rebuildBucket(factorId, factorObj, genes, geneSets);
    });

    return out;
}

/**
 * Restrict to selection. Column rule mirrors heatmap Only selected:
 * - row-only selection → keep all columns on those factors (after base projection)
 * - col selection → keep only selected columns (and factors that have them or are row-selected)
 */
function projectSelectedFactorData(visualizerData, selectedNodes, { requireSelection }) {
    const selected = collectSelectionSets(selectedNodes);
    const hasAny =
        selected.factorIds.size > 0 || selected.genes.size > 0 || selected.geneSets.size > 0;
    if (!hasAny) return requireSelection ? {} : cloneJson(visualizerData, {});

    const hasRowSel = selected.factorIds.size > 0;
    const hasColSel = selected.genes.size > 0 || selected.geneSets.size > 0;
    const out = {};

    Object.keys(visualizerData || {}).forEach((factorId) => {
        const bucket = visualizerData[factorId];
        const factorObj = getFactorObj(bucket);
        if (!factorObj) return;

        const srcGenes = factorObj.genes || {};
        const srcSets = factorObj.geneSets || {};

        const factorSelected = selected.factorIds.has(factorId);
        const hasSelectedGene = Object.keys(srcGenes).some((g) => selected.genes.has(g));
        const hasSelectedSet = Object.keys(srcSets).some((gs) => selected.geneSets.has(gs));
        if (hasRowSel && !factorSelected && !(hasColSel && (hasSelectedGene || hasSelectedSet))) {
            return;
        }
        if (!hasRowSel && hasColSel && !hasSelectedGene && !hasSelectedSet) return;

        let genes = { ...srcGenes };
        let geneSets = { ...srcSets };
        if (hasColSel) {
            const nextGenes = {};
            Object.keys(genes).forEach((g) => {
                if (selected.genes.has(g)) nextGenes[g] = genes[g];
            });
            genes = nextGenes;
            const nextSets = {};
            Object.keys(geneSets).forEach((gs) => {
                if (selected.geneSets.has(gs)) nextSets[gs] = geneSets[gs];
            });
            geneSets = nextSets;
        }

        if (!Object.keys(genes).length && !Object.keys(geneSets).length) return;
        out[factorId] = rebuildBucket(factorId, factorObj, genes, geneSets);
    });

    return out;
}

/**
 * Ensure every search gene present in `sourceData` appears in `scoped`.
 * Adds factors from source when needed.
 */
function ensureSearchGenesInScoped(scoped, sourceData, inputGenes) {
    const inputSet = inputSetFrom(inputGenes);
    if (!inputSet.size) return scoped;
    const out = cloneJson(scoped, {}) || {};

    Object.keys(sourceData || {}).forEach((factorId) => {
        const srcBucket = sourceData[factorId];
        const srcFactor = getFactorObj(srcBucket);
        if (!srcFactor) return;
        const srcGenes = srcFactor.genes || {};

        Object.keys(srcGenes).forEach((gene) => {
            if (!inputSet.has(String(gene).toUpperCase())) return;
            if (!out[factorId]) {
                // Start factor with this search gene only; gene sets from source that include it.
                const genes = { [gene]: srcGenes[gene] };
                const geneSets = {};
                Object.keys(srcFactor.geneSets || {}).forEach((gsName) => {
                    const gs = srcFactor.geneSets[gsName];
                    const members = Array.isArray(gs && gs.genes) ? gs.genes : [];
                    if (members.some((m) => String(m) === gene)) {
                        geneSets[gsName] = gs;
                    }
                });
                out[factorId] = rebuildBucket(factorId, srcFactor, genes, geneSets);
                return;
            }
            const dstFactor = getFactorObj(out[factorId]);
            if (!dstFactor) return;
            if (!dstFactor.genes) dstFactor.genes = {};
            if (!dstFactor.genes[gene]) {
                dstFactor.genes[gene] = srcGenes[gene];
                out[factorId].genes = { ...dstFactor.genes };
            }
        });
    });

    return out;
}

/**
 * Scope gene-set entry factorData for LLM feed.
 * @returns {{ factorData: Object, scopeMode: string, emptyReason: string|null }}
 */
function scopeGeneSetEntryFactorDataForLlm(factorData, options = {}) {
    const scopeMode = options.scopeMode || GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER;
    const inputGenes = Array.isArray(options.inputGenes) ? options.inputGenes : [];
    const selectedNodes = options.selectedNodes || [];
    const viewFilters = options.viewFilters || {};

    // Base = current visualizer projection (checkbox filters). For selected* modes,
    // ignore Only selected on the viz so selection radios define the cut.
    const filtersForBase =
        scopeMode === GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER
            ? viewFilters
            : { ...normalizeHeatmapViewFilters(viewFilters), onlySelected: false };

    const visualizerData = projectVisualizerFactorData(
        factorData,
        filtersForBase,
        selectedNodes,
        inputGenes
    );

    let scoped = visualizerData;
    let emptyReason = null;

    if (scopeMode === GENE_SET_ENTRY_LLM_FEED_SCOPE.SELECTED) {
        scoped = projectSelectedFactorData(visualizerData, selectedNodes, {
            requireSelection: true,
        });
        if (!Object.keys(scoped).length) {
            emptyReason = "Select at least one factor, gene, or gene set in the visualizer.";
        }
    } else if (scopeMode === GENE_SET_ENTRY_LLM_FEED_SCOPE.SELECTED_PLUS_SEARCH) {
        const selectedPart = projectSelectedFactorData(visualizerData, selectedNodes, {
            requireSelection: false,
        });
        scoped = ensureSearchGenesInScoped(selectedPart, visualizerData, inputGenes);
        if (!Object.keys(scoped).length) {
            emptyReason =
                "Nothing to send: select items in the visualizer and/or ensure searched genes are visible.";
        }
    } else if (!Object.keys(scoped).length) {
        emptyReason =
            "Visualizer is empty under the current Gene sets / Genes / Genes in search / Only selected filters.";
    }

    return { factorData: scoped, scopeMode, emptyReason };
}

/**
 * Build slim LLM feed JSON for gene-set entry hypothesis generation.
 * @returns {{ feed: Object|null, emptyReason: string|null, scopeMode: string, scopedFactorData: Object }}
 */
function buildGeneSetEntryLlmFeed(factorData, options = {}) {
    const { factorData: scoped, scopeMode, emptyReason } = scopeGeneSetEntryFactorDataForLlm(
        factorData,
        options
    );
    if (emptyReason || !scoped || !Object.keys(scoped).length) {
        return { feed: null, emptyReason: emptyReason || "No data in scope.", scopeMode, scopedFactorData: {} };
    }
    const feed = buildGeneSetEntryRawExport(scoped, {
        inputGenes: options.inputGenes,
        source: options.source || "bayes_gene/pigean",
        searchPath: options.searchPath || "genes",
    });
    return {
        feed,
        emptyReason: feed ? null : "No data in scope.",
        scopeMode,
        scopedFactorData: scoped,
    };
}

function buildGeneSetEntryHypothesesUserPrompt(feed, researchContext) {
    const ctx = researchContext != null ? String(researchContext).trim() : "";
    return [
        "**Gene-set factorization evidence (slim JSON). Membership: gene_sets[].gene_indices index into that factor's genes[].**",
        "```json",
        JSON.stringify(feed, null, 2),
        "```",
        "",
        `**Research context / intention:** ${ctx || "(none provided)"}`,
        "",
        "Generate mechanistic hypotheses per your system instructions. Return ONLY JSON.",
    ].join("\n");
}

export {
    buildGeneSetEntryHypothesesUserPrompt,
    buildGeneSetEntryLlmFeed,
    collectSelectionSets,
    projectVisualizerFactorData,
    scopeGeneSetEntryFactorDataForLlm,
};
