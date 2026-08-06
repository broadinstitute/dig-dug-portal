/**
 * Network/graph building helpers for Multi Query REVEAL (factor connectivity, flattened-KG
 * row-id networks, hypothesis-in-KG flow diagrams, gene score lookup).
 */

import { buildFactorConnectivityNetwork as buildFactorConnectivityNetworkFromData } from "../factorRevealDataNetwork.js";

function factorLabelsForPhenotypeGene(factorData, phenotype, geneSymbol) {
    const pData = factorData && factorData[phenotype];
    const out = [];
    if (!pData || !Array.isArray(pData.factors)) return out;
    const g = String(geneSymbol || "").trim();
    if (!g) return out;
    pData.factors.forEach((f) => {
        if (!f || !f.genes || !Object.prototype.hasOwnProperty.call(f.genes, g)) return;
        out.push(
            f.label != null && String(f.label).trim() !== ""
                ? String(f.label).trim()
                : String(f.factor).trim()
        );
    });
    return out;
}

/** Build a { nodes, edges } connectivity graph for one (phenotype, factor) pair from `vm.factorData`. */
function buildFactorConnectivityNetwork(vm, item) {
    if (!item || item.phenotype == null || item.factor == null) {
        return { nodes: [], edges: [] };
    }
    const phenotype = String(item.phenotype).trim();
    const factor = String(item.factor).trim();
    if (!phenotype || !factor) return { nodes: [], edges: [] };
    const pData = vm.factorData && vm.factorData[phenotype] ? vm.factorData[phenotype] : null;
    if (!pData) return { nodes: [], edges: [] };
    const factors = pData.factors || [];
    const allFactors = pData.allFactors || [];
    const factorItem =
        factors.find((x) => String(x.factor) === factor) ||
        allFactors.find((x) => String(x.factor) === factor);
    if (!factorItem) return { nodes: [], edges: [] };

    const isGeneSetEntry =
        !!(vm.isGeneSetEntryMode) ||
        String(factorItem.source || pData.source || "") === "bayes_gene_pigean";

    return buildFactorConnectivityNetworkFromData({
        phenotype,
        factorObj: factorItem,
        factorData: vm.factorData || {},
        phenotypeDisplay: (id) =>
            typeof vm.getPhenotypeDisplay === "function" ? vm.getPhenotypeDisplay(id) : id,
        linkGenesToGeneSets: !isGeneSetEntry,
        includePhenotypeNode: !isGeneSetEntry,
    });
}

/**
 * Extract relevant phenotype ids, gene-set-cluster labels (inferred from merged factorData), and gene set names
 * from flattened KG rows by supporting row ids (hybrid KG: phenotype-gene set via associated_with).
 * @param {Object} [factorData] - Merged phenotype/factor payload; when omitted, relevant_factors stays empty.
 */
function extractRelevantFactorsAndGeneSetsFromFlattened(flattened, rowIds, factorData) {
    const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
    const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
    const phenotypes = new Set();
    const geneSets = new Set();
    const inferredFactors = new Set();
    const ASSOCIATED_WITH = "associated_with";
    const CONTAINS_GENE = "contains_gene";
    const CONTRIBUTES_TO_PATHWAY = "contributes_to_pathway";
    rows.forEach((row) => {
        const pred = row.predicate != null ? String(row.predicate).trim() : "";
        const sub = row.subject != null ? String(row.subject).trim() : "";
        const obj = row.object != null ? String(row.object).trim() : "";
        if (pred === ASSOCIATED_WITH && sub) phenotypes.add(sub);
        if (pred === ASSOCIATED_WITH && obj) geneSets.add(obj);
        if (pred === CONTRIBUTES_TO_PATHWAY && obj) geneSets.add(obj);
    });
    if (factorData) {
        (flattened || []).forEach((row) => {
            if (!idSet.has(Number(row.id))) return;
            const pred = String(row.predicate || "").trim();
            const sub = row.subject != null ? String(row.subject).trim() : "";
            const obj = row.object != null ? String(row.object).trim() : "";
            Object.keys(factorData).forEach((pheno) => {
                const pData = factorData[pheno];
                if (!pData || !Array.isArray(pData.factors)) return;
                pData.factors.forEach((f) => {
                    const fid = f.factor != null ? String(f.factor).trim() : "";
                    if (!fid) return;
                    const gss =
                        typeof f.top_gene_sets === "string" && f.top_gene_sets
                            ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                            : [];
                    const geneKeys = Object.keys(f.genes || {});
                    let hit = false;
                    if (pred === ASSOCIATED_WITH && sub === pheno && gss.includes(obj)) hit = true;
                    if (pred === CONTAINS_GENE && sub === pheno && geneKeys.includes(obj)) hit = true;
                    if (pred === CONTRIBUTES_TO_PATHWAY && geneKeys.includes(sub) && gss.includes(obj)) {
                        hit = true;
                    }
                    if (!hit) return;
                    inferredFactors.add(
                        f.label != null && String(f.label).trim() !== ""
                            ? String(f.label).trim()
                            : fid
                    );
                });
            });
        });
    }
    return {
        relevant_phenotypes: [...phenotypes].sort(),
        relevant_factors: [...inferredFactors].sort(),
        relevant_gene_sets: [...geneSets].sort(),
    };
}

/**
 * Build per-gene connections (gene-set-cluster labels + gene sets) from flattened KG rows by supporting ids.
 * Cluster labels are recovered from factorData for contains_gene (phenotype -> gene) edges.
 */
function extractGeneConnectionsFromFlattened(flattened, rowIds, factorData) {
    const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
    const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
    const map = {};
    const CONTAINS_GENE = "contains_gene";
    const CONTRIBUTES_TO_PATHWAY = "contributes_to_pathway";

    const ensure = (gene) => {
        const g = String(gene || "").trim();
        if (!g) return null;
        if (!map[g]) map[g] = { factors: new Set(), gene_sets: new Set() };
        return g;
    };

    rows.forEach((row) => {
        const pred = row.predicate != null ? String(row.predicate).trim() : "";
        const sub = row.subject != null ? String(row.subject).trim() : "";
        const obj = row.object != null ? String(row.object).trim() : "";
        if (pred === CONTAINS_GENE) {
            const gene = ensure(obj);
            if (gene && sub) {
                if (factorData) {
                    factorLabelsForPhenotypeGene(factorData, sub, obj).forEach((lb) =>
                        map[gene].factors.add(lb)
                    );
                }
            }
        } else if (pred === CONTRIBUTES_TO_PATHWAY) {
            const gene = ensure(sub);
            if (gene && obj) map[gene].gene_sets.add(obj);
        }
    });

    const out = {};
    Object.keys(map).forEach((gene) => {
        out[gene] = {
            factors: [...map[gene].factors].sort(),
            gene_sets: [...map[gene].gene_sets].sort(),
        };
    });
    return out;
}

/**
 * LLM biological mechanism map: nodes (id, label, group) and edges (from, to, label) -> network for vis.
 * @param {Object} hik - hypothesis_in_kg from LLM.
 * @returns {{ nodes: Array, edges: Array } | null}
 */
function buildMechanismFlowNetworkFromHypothesisKg(hik) {
    if (!hik || typeof hik !== "object") return null;
    const rawNodes = Array.isArray(hik.nodes) ? hik.nodes : [];
    const rawEdges = Array.isArray(hik.edges) ? hik.edges : [];
    if (!rawNodes.length || !rawEdges.length) return null;

    const GROUP_ALIASES = {
        gene: "Gene",
        protein: "Gene",
        phenotype: "Phenotype",
        disease: "Phenotype",
        metabolite: "Metabolite",
        process: "Process",
        cell: "Cell",
        drug: "Drug",
        pathway_db: "Pathway",
        pathway: "Pathway",
        "gene set": "Pathway",
        geneset: "Pathway",
        gene_set: "Pathway",
        factor: "Factor",
        other: "Entity",
    };

    const normalizeGroup = (g) => {
        const s = g != null ? String(g).trim() : "";
        if (!s) return "Entity";
        const low = s.toLowerCase();
        if (GROUP_ALIASES[low]) return GROUP_ALIASES[low];
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const customNodes = [];
    const seenNodeIds = new Set();
    for (let i = 0; i < rawNodes.length && customNodes.length < 12; i++) {
        const n = rawNodes[i];
        if (!n || n.id == null || String(n.id).trim() === "") continue;
        const id = String(n.id).trim();
        if (seenNodeIds.has(id)) continue;
        seenNodeIds.add(id);
        const label = n.label != null && String(n.label).trim() !== "" ? String(n.label).trim() : id;
        customNodes.push({
            id,
            label,
            type: normalizeGroup(
                n.group != null ? n.group : n.type != null ? n.type : n.node_type
            ),
            metadata: {},
        });
    }

    const nodeIds = new Set(customNodes.map((n) => n.id));
    const customEdges = rawEdges
        .filter((e) => e != null && e.from != null && e.to != null)
        .map((e) => {
            const source = String(e.from).trim();
            const target = String(e.to).trim();
            const predRaw =
                e.label != null && String(e.label).trim() !== ""
                    ? String(e.label).trim()
                    : e.predicate != null
                      ? String(e.predicate).trim()
                      : "";
            return { source, target, predicate: predRaw };
        })
        .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    if (customNodes.length < 2 || customEdges.length === 0) return null;
    return { nodes: customNodes, edges: customEdges };
}

/**
 * Build network { nodes, edges } from flattened KG rows by row ids (for LLM response with supporting_row_ids).
 * @param {Array} flattened - Flat rows from flattenKGData (id, subject, predicate, object, context_*).
 * @param {Array<number>} rowIds - Row id values from LLM (supporting_row_ids).
 * @returns {{ nodes: Array, edges: Array }} - Shape expected by FactorBaseRevealNetwork.
 */
function buildNetworkFromFlattenedRowIds(flattened, rowIds) {
    const idSet = new Set((rowIds || []).map(Number).filter((n) => !isNaN(n)));
    const rows = (flattened || []).filter((r) => idSet.has(Number(r.id)));
    const CONTEXT_TO_TYPES = {
        PhenotypeToGeneSet: { subject: "Phenotype", object: "Pathway" },
        PhenotypeToGene: { subject: "Phenotype", object: "Gene" },
        GeneToPathway: { subject: "Gene", object: "Pathway" },
        PhenotypeToFactor: { subject: "Phenotype", object: "Factor" },
        FactorToPathway: { subject: "Factor", object: "Pathway" },
        FactorToGene: { subject: "Factor", object: "Gene" },
    };
    const nodesMap = new Map();
    const edges = [];

    const pickLabelFromApi = (row) =>
        row.context_label_from_api != null && String(row.context_label_from_api).trim() !== ""
            ? String(row.context_label_from_api).trim()
            : null;

    rows.forEach((row) => {
        const ctxType = row.context_type != null ? String(row.context_type).trim() : "";
        const types = CONTEXT_TO_TYPES[ctxType] || { subject: "Factor", object: "Gene" };
        const subId = row.subject != null ? String(row.subject).trim() : "";
        const objId = row.object != null ? String(row.object).trim() : "";
        if (subId && !nodesMap.has(subId)) {
            const meta = {};
            const lfSub = pickLabelFromApi(row);
            if (types.subject === "Factor" && lfSub) meta.labelFromApi = lfSub;
            nodesMap.set(subId, {
                id: subId,
                label: subId,
                type: types.subject,
                metadata: meta,
            });
        } else if (subId) {
            const lfSub = pickLabelFromApi(row);
            if (types.subject === "Factor" && lfSub) {
                const n = nodesMap.get(subId);
                if (n && n.type === "Factor" && !n.metadata.labelFromApi) n.metadata.labelFromApi = lfSub;
            }
        }
        if (objId) {
            const meta = {};
            if (row.context_combined_score != null) meta.combined_score = row.context_combined_score;
            if (row.context_gwas_support != null) meta.gwas_support = row.context_gwas_support;
            if (row.context_functional_support != null) meta.functional_support = row.context_functional_support;
            if (row.context_category != null) meta.category = row.context_category;
            if (row.context_factor_relevance != null) meta.factor_relevance = row.context_factor_relevance;
            const lfObj = pickLabelFromApi(row);
            if (types.object === "Factor" && lfObj) meta.labelFromApi = lfObj;
            if (nodesMap.has(objId)) {
                if (Object.keys(meta).length) Object.assign(nodesMap.get(objId).metadata, meta);
            } else {
                nodesMap.set(objId, { id: objId, label: objId, type: types.object, metadata: meta });
            }
        }
        if (subId && objId) {
            edges.push({
                source: subId,
                target: objId,
                predicate: row.predicate != null ? String(row.predicate) : "",
            });
        }
    });

    return {
        nodes: Array.from(nodesMap.values()),
        edges,
    };
}

/**
 * Keep only Gene nodes whose symbols appear in candidate_genes; drop other genes and edges that reference them.
 * Phenotype / Pathway (gene set) nodes are unchanged; legacy Factor nodes, if present, are unchanged.
 */
function filterSupportingNetworkToCandidateGenes(network, candidateGenes) {
    const nodesIn = network && Array.isArray(network.nodes) ? network.nodes : [];
    const edgesIn = network && Array.isArray(network.edges) ? network.edges : [];
    const allowed = new Set();
    (candidateGenes || []).forEach((g) => {
        const sym = g && g.gene != null ? String(g.gene).trim() : "";
        if (sym) allowed.add(sym.toUpperCase());
    });
    if (allowed.size === 0) return { nodes: nodesIn, edges: edgesIn };

    const geneSymbolKey = (n) => {
        const id = n && n.id != null ? String(n.id).trim() : "";
        const label = n && n.label != null ? String(n.label).trim() : "";
        return (id || label).toUpperCase();
    };

    const nodes = nodesIn.filter((n) => {
        if (!n || n.type !== "Gene") return true;
        return allowed.has(geneSymbolKey(n));
    });
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = edgesIn.filter((e) => e && nodeIds.has(e.source) && nodeIds.has(e.target));
    return { nodes, edges };
}

/**
 * Get combined, gwas, functional scores for a gene from flattened KG (contains_gene rows with context_*).
 * @param {Array} flattened - Flat rows from flattenKGData.
 * @param {string} geneSymbol - Gene symbol (object of contains_gene row).
 * @returns {{ combined: number|null, gwas: number|null, functional: number|null }}
 */
function getGeneScoresFromFlattenedKG(flattened, geneSymbol) {
    const sym = String(geneSymbol || "").trim();
    const rows = (flattened || []).filter(
        (r) =>
            String(r.predicate || "").trim() === "contains_gene" &&
            String(r.object || "").trim() === sym
    );
    if (!rows.length) return { combined: null, gwas: null, functional: null };
    const num = (v) => (v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : null);
    let best = rows[0];
    let bestC = num(best.context_combined_score);
    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const c = num(r.context_combined_score);
        if (c != null && (bestC == null || c > bestC)) {
            best = r;
            bestC = c;
        }
    }
    return {
        combined: num(best.context_combined_score),
        gwas: num(best.context_gwas_support),
        functional: num(best.context_functional_support),
    };
}

export {
    buildFactorConnectivityNetwork,
    buildMechanismFlowNetworkFromHypothesisKg,
    buildNetworkFromFlattenedRowIds,
    extractGeneConnectionsFromFlattened,
    extractRelevantFactorsAndGeneSetsFromFlattened,
    factorLabelsForPhenotypeGene,
    filterSupportingNetworkToCandidateGenes,
    getGeneScoresFromFlattenedKG,
};
