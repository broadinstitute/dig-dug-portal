/**
 * Free-text path: scope factorData and build a slim hypothesis LLM feed
 * (indexed gene-set membership, diagnostic meta, route headers — no CSV/summary/bundle duplication).
 */

import {
    HEATMAP_SELECTION_KIND,
    rowSelectionKey,
} from "./revealMqHeatmapSelection.js";
import { normalizeLlmTermList } from "./revealMqExtraction.js";

/** User-chosen LLM feed scope (free-text Data Continue gate). */
export const FREE_TEXT_LLM_FEED_SCOPE = {
    /** Only heatmap/network selections. */
    SELECTED: "selected",
    /** Selections, plus genes of interest from extraction. */
    SELECTED_PLUS_GOI: "selected_plus_goi",
    /** All retrieved evidence (after association legend filters). */
    FULL: "full",
};

export const FREE_TEXT_LLM_FEED_SCOPE_OPTIONS = [
    {
        value: FREE_TEXT_LLM_FEED_SCOPE.SELECTED,
        label: "Selected",
        help: "only phenotypes, gene set clusters, genes, and gene sets you selected in the visualizer",
    },
    {
        value: FREE_TEXT_LLM_FEED_SCOPE.SELECTED_PLUS_GOI,
        label: "Selected + genes of interest",
        help: "your selections, plus genes of interest from search-term extraction and their clusters",
    },
    {
        value: FREE_TEXT_LLM_FEED_SCOPE.FULL,
        label: "Full data",
        help: "all retrieved phenotype × gene set cluster evidence (respecting association legend filters)",
    },
];

function cloneJson(value, fallback) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return fallback;
    }
}

function goiSetFrom(genesOfInterest) {
    return new Set(
        normalizeLlmTermList(genesOfInterest).map((g) => String(g).toUpperCase()).filter(Boolean)
    );
}

function factorDirection(factor) {
    if (!factor) return "";
    if (factor.fetched_direction != null && String(factor.fetched_direction).trim() !== "") {
        return String(factor.fetched_direction).trim();
    }
    if (factor.route_category != null && String(factor.route_category).trim() !== "") {
        return String(factor.route_category).trim();
    }
    return "";
}

function factorRowKey(phenotype, factor) {
    return rowSelectionKey({
        phenotype,
        factor: factor && factor.factor != null ? factor.factor : "",
        fetchedDirection: factorDirection(factor),
    });
}

/**
 * Collect selection sets from heatmap/network selection nodes (free-text phenotype×factor rows).
 */
function collectFreeTextSelectionSets(selectedNodes) {
    const rowKeys = new Set();
    const phenotypes = new Set();
    const genes = new Set();
    const geneSets = new Set();

    (Array.isArray(selectedNodes) ? selectedNodes : []).forEach((n) => {
        if (!n || !n.kind) return;
        if (n.kind === HEATMAP_SELECTION_KIND.ROW) {
            if (n.key) rowKeys.add(n.key);
            if (n.phenotype != null && String(n.phenotype).trim() !== "") {
                phenotypes.add(String(n.phenotype));
            }
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
            if (n.rowKey) rowKeys.add(n.rowKey);
            if (n.phenotype != null && String(n.phenotype).trim() !== "") {
                phenotypes.add(String(n.phenotype));
            }
            const col = String(n.colLabel || "").trim();
            if (!col) return;
            if (n.colIsGeneSet) geneSets.add(col);
            else genes.add(col);
            return;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.NETWORK_NODE) {
            const typ = String(n.nodeType || n.type || "").trim();
            const label = String(n.label || n.nodeLabel || "").trim();
            const id = String(n.nodeId || n.id || n.networkNodeId || "").trim();
            if (typ === "Phenotype") {
                const ph = label || id.replace(/^pheno:/i, "");
                if (ph) phenotypes.add(ph);
            } else if (typ === "Factor") {
                const m = id.match(/^factor:([^|]+)\|/);
                if (m && m[1]) phenotypes.add(m[1]);
                if (n.key) rowKeys.add(n.key);
            } else if (typ === "Gene") {
                if (label) genes.add(label);
            } else if (typ === "Pathway" || typ === "Gene set" || typ === "GeneSet") {
                if (label) geneSets.add(label);
            }
        }
    });

    return { rowKeys, phenotypes, genes, geneSets };
}

function rebuildPhenotypeBucket(bucket, factors) {
    if (!factors.length) return null;
    const genes = {};
    const phenoGenes = (bucket && bucket.genes) || {};
    factors.forEach((factor) => {
        Object.keys(factor.genes || {}).forEach((gene) => {
            if (genes[gene]) return;
            if (phenoGenes[gene]) {
                genes[gene] = phenoGenes[gene];
                return;
            }
            const v = factor.genes[gene].factorRelevance ?? factor.genes[gene].factor_value;
            genes[gene] = {
                combined: v != null && !isNaN(Number(v)) ? Number(v) : null,
                gwasSupport: null,
                geneSetSupport: null,
            };
        });
    });
    return {
        genes,
        factors,
        allFactors: factors,
    };
}

function filterFactorColumns(factor, selectedGenes, selectedGeneSets, hasColSel) {
    if (!hasColSel) {
        return {
            ...factor,
            genes: { ...(factor.genes || {}) },
            geneSets: { ...(factor.geneSets || {}) },
        };
    }
    const genes = {};
    Object.keys(factor.genes || {}).forEach((g) => {
        if (selectedGenes.has(g)) genes[g] = factor.genes[g];
    });
    const geneSets = {};
    Object.keys(factor.geneSets || {}).forEach((gs) => {
        if (selectedGeneSets.has(gs)) geneSets[gs] = factor.geneSets[gs];
    });
    if (!Object.keys(genes).length && !Object.keys(geneSets).length) return null;
    return { ...factor, genes, geneSets };
}

/**
 * Restrict factorData to heatmap/network selections.
 */
function projectSelectedFactorData(factorData, selectedNodes, { requireSelection }) {
    const selected = collectFreeTextSelectionSets(selectedNodes);
    const hasRowSel = selected.rowKeys.size > 0 || selected.phenotypes.size > 0;
    const hasColSel = selected.genes.size > 0 || selected.geneSets.size > 0;
    const hasAny = hasRowSel || hasColSel;
    if (!hasAny) return requireSelection ? {} : cloneJson(factorData, {});

    const out = {};
    Object.keys(factorData || {}).forEach((phenotypeId) => {
        const bucket = factorData[phenotypeId];
        if (!bucket) return;
        const factors = Array.isArray(bucket.factors) ? bucket.factors : [];
        const nextFactors = [];

        factors.forEach((factor) => {
            const rk = factorRowKey(phenotypeId, factor);
            const rowSelected =
                selected.rowKeys.has(rk) ||
                (selected.phenotypes.has(String(phenotypeId)) && !selected.rowKeys.size);
            const hasSelectedGene = Object.keys(factor.genes || {}).some((g) => selected.genes.has(g));
            const hasSelectedSet = Object.keys(factor.geneSets || {}).some((gs) =>
                selected.geneSets.has(gs)
            );

            if (hasRowSel && !rowSelected && !(hasColSel && (hasSelectedGene || hasSelectedSet))) {
                return;
            }
            if (!hasRowSel && hasColSel && !hasSelectedGene && !hasSelectedSet) return;

            const filtered = filterFactorColumns(factor, selected.genes, selected.geneSets, hasColSel);
            if (filtered) nextFactors.push(filtered);
        });

        const rebuilt = rebuildPhenotypeBucket(bucket, nextFactors);
        if (rebuilt) out[phenotypeId] = rebuilt;
    });

    return out;
}

/**
 * Ensure every gene-of-interest present in `sourceData` appears in `scoped`.
 */
function ensureGoiGenesInScoped(scoped, sourceData, genesOfInterest) {
    const goiSet = goiSetFrom(genesOfInterest);
    if (!goiSet.size) return scoped;
    const out = cloneJson(scoped, {}) || {};

    Object.keys(sourceData || {}).forEach((phenotypeId) => {
        const srcBucket = sourceData[phenotypeId];
        if (!srcBucket) return;
        const srcFactors = Array.isArray(srcBucket.factors) ? srcBucket.factors : [];

        srcFactors.forEach((srcFactor) => {
            const srcGenes = srcFactor.genes || {};
            const matchingGenes = Object.keys(srcGenes).filter((g) =>
                goiSet.has(String(g).toUpperCase())
            );
            if (!matchingGenes.length) return;

            if (!out[phenotypeId]) {
                const genes = {};
                matchingGenes.forEach((g) => {
                    genes[g] = srcGenes[g];
                });
                const geneSets = {};
                Object.keys(srcFactor.geneSets || {}).forEach((gsName) => {
                    const gs = srcFactor.geneSets[gsName];
                    const members = Array.isArray(gs && gs.genes) ? gs.genes : [];
                    if (members.some((m) => goiSet.has(String(m).toUpperCase()))) {
                        geneSets[gsName] = gs;
                    }
                });
                out[phenotypeId] = rebuildPhenotypeBucket(srcBucket, [
                    { ...srcFactor, genes, geneSets },
                ]);
                return;
            }

            const dstFactors = Array.isArray(out[phenotypeId].factors) ? out[phenotypeId].factors : [];
            let dstFactor = dstFactors.find(
                (f) =>
                    String(f.factor) === String(srcFactor.factor) &&
                    factorDirection(f) === factorDirection(srcFactor)
            );
            if (!dstFactor) {
                const genes = {};
                matchingGenes.forEach((g) => {
                    genes[g] = srcGenes[g];
                });
                dstFactor = { ...srcFactor, genes, geneSets: {} };
                dstFactors.push(dstFactor);
                out[phenotypeId] = rebuildPhenotypeBucket(srcBucket, dstFactors);
                return;
            }
            if (!dstFactor.genes) dstFactor.genes = {};
            matchingGenes.forEach((g) => {
                if (!dstFactor.genes[g]) dstFactor.genes[g] = srcGenes[g];
            });
            out[phenotypeId] = rebuildPhenotypeBucket(out[phenotypeId], dstFactors);
        });
    });

    return out;
}

/**
 * Scope free-text factorData for LLM hypothesis generation.
 * @returns {{ factorData: Object, scopeMode: string, emptyReason: string|null }}
 */
function scopeFreeTextFactorDataForLlm(factorData, options = {}) {
    const scopeMode = options.scopeMode || FREE_TEXT_LLM_FEED_SCOPE.FULL;
    const selectedNodes = options.selectedNodes || [];
    const genesOfInterest = options.genesOfInterest || [];
    const source = factorData && typeof factorData === "object" ? factorData : {};

    let scoped = cloneJson(source, {}) || {};
    let emptyReason = null;

    if (scopeMode === FREE_TEXT_LLM_FEED_SCOPE.SELECTED) {
        scoped = projectSelectedFactorData(source, selectedNodes, { requireSelection: true });
        if (!Object.keys(scoped).length) {
            emptyReason =
                "Select at least one phenotype, gene set cluster, gene, or gene set in the visualizer.";
        }
    } else if (scopeMode === FREE_TEXT_LLM_FEED_SCOPE.SELECTED_PLUS_GOI) {
        const selected = collectFreeTextSelectionSets(selectedNodes);
        const hasAny =
            selected.rowKeys.size > 0 ||
            selected.phenotypes.size > 0 ||
            selected.genes.size > 0 ||
            selected.geneSets.size > 0;
        // Empty selection → start blank and add GOI only (do not fall back to full data).
        const selectedPart = hasAny
            ? projectSelectedFactorData(source, selectedNodes, { requireSelection: false })
            : {};
        scoped = ensureGoiGenesInScoped(selectedPart, source, genesOfInterest);
        if (!Object.keys(scoped).length) {
            emptyReason =
                "Nothing to send: select items in the visualizer and/or ensure genes of interest are present in the retrieved data.";
        }
    }

    if (!emptyReason && !Object.keys(scoped).length) {
        emptyReason = "No phenotype–gene set cluster evidence available for hypothesis generation.";
    }

    return { factorData: scoped, scopeMode, emptyReason };
}


const FREE_TEXT_LLM_FEED_SCHEMA_VERSION = 1;

function uniqStrings(values) {
    const out = [];
    const seen = new Set();
    (Array.isArray(values) ? values : []).forEach((v) => {
        const s = v != null ? String(v).trim() : "";
        if (!s) return;
        const key = s.toUpperCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(s);
    });
    return out;
}

/**
 * Diagnostic fields only (Case 1–4). Merges session meta with per-route metas.
 */
function slimDiagnosticMeta(hybridMeta, routeBundles) {
    const m = hybridMeta && typeof hybridMeta === "object" ? hybridMeta : {};
    const pickArr = (key) => {
        const acc = [];
        if (Array.isArray(m[key])) acc.push(...m[key]);
        (Array.isArray(routeBundles) ? routeBundles : []).forEach((b) => {
            const bm = b && b.meta && typeof b.meta === "object" ? b.meta : null;
            if (bm && Array.isArray(bm[key])) acc.push(...bm[key]);
        });
        return uniqStrings(acc);
    };
    const out = {
        genes_of_interest_requested: pickArr("genes_of_interest_requested"),
        genes_of_interest_missing_from_response: pickArr("genes_of_interest_missing_from_response"),
        genes_of_interest_absent_from_db: pickArr("genes_of_interest_absent_from_db"),
    };
    const fusion =
        m.lexical_fusion_used === true ||
        (Array.isArray(routeBundles) &&
            routeBundles.some((b) => b && b.meta && b.meta.lexical_fusion_used === true));
    if (fusion) out.lexical_fusion_used = true;
    return out;
}

/**
 * Per-route context without top_hits (those duplicate cluster evidence).
 */
function slimRoutesHeader(routeBundles) {
    return (Array.isArray(routeBundles) ? routeBundles : [])
        .map((b) => {
            if (!b || typeof b !== "object") return null;
            const row = {
                route_id: b.route_id != null ? String(b.route_id) : null,
                category: b.category != null ? String(b.category) : null,
                biological_query_variation:
                    b.biological_query_variation != null ? String(b.biological_query_variation) : null,
            };
            if (b.sanitized_query != null && String(b.sanitized_query).trim()) {
                row.sanitized_query = String(b.sanitized_query).trim();
            }
            if (b.extracted_terms != null && typeof b.extracted_terms === "object") {
                row.extracted_terms = b.extracted_terms;
            }
            if (b.constraint_mode != null && String(b.constraint_mode).trim()) {
                row.constraint_mode = String(b.constraint_mode).trim();
            }
            return row.route_id || row.category ? row : null;
        })
        .filter(Boolean);
}

function sortGeneSymbolsForFeed(symbols, geneMap, goiSet) {
    return [...symbols].sort((a, b) => {
        const aIn =
            (geneMap[a] && geneMap[a].includedFromRequest === true) || goiSet.has(String(a).toUpperCase())
                ? 1
                : 0;
        const bIn =
            (geneMap[b] && geneMap[b].includedFromRequest === true) || goiSet.has(String(b).toUpperCase())
                ? 1
                : 0;
        if (bIn !== aIn) return bIn - aIn;
        return String(a).localeCompare(String(b));
    });
}

function slimClusterFromFactor(phenotypeId, factor, goiSet) {
    const geneMap = (factor && factor.genes && typeof factor.genes === "object" ? factor.genes : {}) || {};
    const geneSetMap =
        (factor && factor.geneSets && typeof factor.geneSets === "object" ? factor.geneSets : {}) || {};
    const symbols = sortGeneSymbolsForFeed(Object.keys(geneMap), geneMap, goiSet);
    const indexByGene = new Map(symbols.map((g, i) => [g, i]));
    const genes = symbols.map((symbol) => {
        const g = geneMap[symbol] || {};
        const isInput =
            g.includedFromRequest === true || goiSet.has(String(symbol).toUpperCase());
        return { symbol, is_input: !!isInput };
    });

    const geneSetNames = new Set(Object.keys(geneSetMap));
    if (typeof factor.top_gene_sets === "string" && factor.top_gene_sets) {
        factor.top_gene_sets.split(";").forEach((s) => {
            const t = s.trim();
            if (t) geneSetNames.add(t);
        });
    }

    const gene_sets = [...geneSetNames]
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((name) => {
            const gs = geneSetMap[name] || {};
            const members = Array.isArray(gs.genes) ? gs.genes : [];
            const gene_indices = [
                ...new Set(
                    members
                        .map((m) => indexByGene.get(String(m)))
                        .filter((i) => i != null)
                ),
            ].sort((a, b) => a - b);
            return { name, gene_indices };
        });

    const label =
        (factor.factorLabel != null && String(factor.factorLabel).trim()) ||
        (factor.label != null && String(factor.label).trim()) ||
        (factor.factor != null ? String(factor.factor) : "");
    const route = factorDirection(factor) || null;

    return {
        phenotype: String(phenotypeId),
        factor: factor.factor != null ? String(factor.factor) : "",
        label,
        route,
        genes,
        gene_sets,
    };
}

/**
 * Build slim free-text hypothesis feed from already-scoped factorData.
 * @returns {{ feed: Object|null, emptyReason: string|null }}
 */
function buildFreeTextLlmFeed(factorData, options = {}) {
    const data = factorData && typeof factorData === "object" ? factorData : {};
    const goiSet = goiSetFrom(options.genesOfInterest);
    const clusters = [];
    Object.keys(data).forEach((phenotypeId) => {
        const bucket = data[phenotypeId];
        const factors = bucket && Array.isArray(bucket.factors) ? bucket.factors : [];
        factors.forEach((factor) => {
            if (!factor) return;
            clusters.push(slimClusterFromFactor(phenotypeId, factor, goiSet));
        });
    });
    if (!clusters.length) {
        return { feed: null, emptyReason: "No phenotype–gene set cluster evidence available for hypothesis generation." };
    }

    const associated_pairs = Array.isArray(options.associatedPairs) && options.associatedPairs.length
        ? options.associatedPairs
              .map((p) => ({
                  phenotype: p && p.phenotype != null ? String(p.phenotype).trim() : "",
                  factor: p && p.factor != null ? String(p.factor).trim() : "",
              }))
              .filter((p) => p.phenotype && p.factor)
        : clusters
              .map((c) => ({
                  phenotype: c.phenotype,
                  factor: c.label || c.factor,
              }))
              .filter((p) => p.phenotype && p.factor);

    const feed = {
        schema_version: FREE_TEXT_LLM_FEED_SCHEMA_VERSION,
        search_path: "query",
        genes_of_interest: normalizeLlmTermList(options.genesOfInterest),
        diagnostic_meta: slimDiagnosticMeta(options.hybridMeta, options.routeBundles),
        routes: slimRoutesHeader(options.routeBundles),
        associated_pairs,
        clusters,
    };
    return { feed, emptyReason: null };
}

function buildFreeTextHypothesesUserPrompt(feed, researchContext) {
    const ctx = researchContext != null ? String(researchContext).trim() : "";
    const routeCount = feed && Array.isArray(feed.routes) ? feed.routes.length : 0;
    const multiRouteNote =
        routeCount >= 2
            ? `\n**Multi-route note:** ${routeCount} retrieval directions are listed under \`routes\` and tagged on \`clusters[].route\`. Compare directions in \`hypothesis\` / \`novelty\` when supported; populate \`overall_summary\`.\n`
            : "";
    return [
        "**Free-text hybrid evidence (slim JSON). Membership: gene_sets[].gene_indices index into that cluster's genes[].**",
        "```json",
        JSON.stringify(feed),
        "```",
        multiRouteNote,
        `**Research context:** ${ctx || "(none provided)"}`,
        "",
        "Generate mechanistic hypotheses per your system instructions. Return ONLY JSON including diagnostic_assessment and overall_summary. The hypotheses array must be non-empty only when can_generate_hypothesis is true; otherwise leave hypotheses empty and follow rejection / warning / suggested_optimized_query rules.",
    ].join("\n");
}

/**
 * Map LLM entity citations → flattened KG row ids (for supporting network / evidence tables).
 */
function resolveSupportingRowIdsFromCitations(flattened, hypothesis) {
    const rows = Array.isArray(flattened) ? flattened : [];
    if (!rows.length || !hypothesis) return [];

    const geneSet = new Set(
        [
            ...(Array.isArray(hypothesis.cited_gene_symbols) ? hypothesis.cited_gene_symbols : []),
            ...(Array.isArray(hypothesis.genes)
                ? hypothesis.genes.map((g) => (g && g.gene != null ? g.gene : ""))
                : []),
        ]
            .map((g) => String(g || "").trim().toUpperCase())
            .filter(Boolean)
    );
    const geneSetNames = new Set(
        [
            ...(Array.isArray(hypothesis.cited_gene_set_names) ? hypothesis.cited_gene_set_names : []),
            ...(Array.isArray(hypothesis.relevant_gene_sets) ? hypothesis.relevant_gene_sets : []),
        ]
            .map((s) => String(s || "").trim())
            .filter(Boolean)
    );
    const phenotypes = new Set(
        (Array.isArray(hypothesis.associated_pairs) ? hypothesis.associated_pairs : [])
            .map((p) => (p && p.phenotype != null ? String(p.phenotype).trim() : ""))
            .filter(Boolean)
    );

    const ids = [];
    const seen = new Set();
    rows.forEach((row) => {
        if (!row || row.id == null) return;
        const id = Number(row.id);
        if (Number.isNaN(id) || seen.has(id)) return;
        const pred = String(row.predicate || "");
        const subj = row.subject != null ? String(row.subject) : "";
        const obj = row.object != null ? String(row.object) : "";
        let keep = false;
        if (pred === "contains_gene") {
            keep =
                (!phenotypes.size || phenotypes.has(subj)) &&
                geneSet.has(obj.toUpperCase());
        } else if (pred === "associated_with") {
            keep =
                (!phenotypes.size || phenotypes.has(subj)) &&
                (geneSetNames.size ? geneSetNames.has(obj) : false);
        } else if (pred === "contributes_to_pathway") {
            keep =
                geneSet.has(subj.toUpperCase()) &&
                (geneSetNames.size ? geneSetNames.has(obj) : false);
        }
        if (!keep) return;
        seen.add(id);
        ids.push(id);
    });
    return ids;
}

export {
    FREE_TEXT_LLM_FEED_SCHEMA_VERSION,
    buildFreeTextHypothesesUserPrompt,
    buildFreeTextLlmFeed,
    collectFreeTextSelectionSets,
    ensureGoiGenesInScoped,
    projectSelectedFactorData,
    resolveSupportingRowIdsFromCitations,
    scopeFreeTextFactorDataForLlm,
    slimDiagnosticMeta,
    slimRoutesHeader,
};
