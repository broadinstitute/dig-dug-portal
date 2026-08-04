/** Build phenotype → factor → gene set → gene networks for REVEAL data views. */

import { resolveCfdeFactorClusterDisplayLabel } from "@/utils/cfdeUtils";

function clusterDisplayLabel(factorObj, fallback = "") {
    const clusterKey =
        factorObj && factorObj.label != null && String(factorObj.label).trim() !== ""
            ? String(factorObj.label).trim()
            : factorObj && factorObj.factor != null
              ? String(factorObj.factor)
              : fallback;
    return resolveCfdeFactorClusterDisplayLabel(clusterKey || fallback);
}

/**
 * @param {object} params
 * @param {string} params.phenotype
 * @param {object} params.factorObj
 * @param {object} params.factorData
 * @param {(id: string) => string} params.phenotypeDisplay
 * @param {boolean} [params.linkGenesToGeneSets=true] - When false (genes-entry /
 *   factorization), skip gene↔gene-set edges and attach genes to the factor instead.
 *   Membership from bayes_gene/pigean is only a co-loading approximation.
 * @param {boolean} [params.includePhenotypeNode=true] - When false, omit the phenotype
 *   hub (genes-entry uses factor id as phenotype key; the red Phenotype node is noise).
 * @param {boolean} [params.includeGeneSets=true] - Include pathway / gene-set nodes.
 * @param {boolean} [params.includeGenes=true] - Include gene nodes.
 * @param {boolean} [params.genesInSearchOnly=false] - When true, only genes with
 *   includedFromRequest (search genes).
 * @param {Set<string>|null} [params.allowedGeneSets=null] - When set, only these gene-set ids.
 * @param {Set<string>|null} [params.allowedGenes=null] - When set, only these gene symbols.
 */
export function buildFactorConnectivityNetwork({
    phenotype,
    factorObj,
    factorData = {},
    phenotypeDisplay,
    linkGenesToGeneSets = true,
    includePhenotypeNode = true,
    includeGeneSets = true,
    includeGenes = true,
    genesInSearchOnly = false,
    allowedGeneSets = null,
    allowedGenes = null,
} = {}) {
    if (!phenotype || !factorObj || factorObj.factor == null) {
        return { nodes: [], edges: [] };
    }
    const pheno = String(phenotype).trim();
    const factor = String(factorObj.factor).trim();
    if (!pheno || !factor) return { nodes: [], edges: [] };

    const pData = factorData[pheno];
    if (!pData) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const nodeSeen = new Set();
    const edgeSeen = new Set();
    const addNode = (n) => {
        if (!n || !n.id || nodeSeen.has(n.id)) return;
        nodeSeen.add(n.id);
        nodes.push(n);
    };
    const addEdge = (e) => {
        if (!e || !e.source || !e.target) return;
        const id = `${e.source}|${e.predicate || e.label || ""}|${e.target}`;
        if (edgeSeen.has(id)) return;
        edgeSeen.add(id);
        edges.push(e);
    };

    const phenotypeNodeId = `pheno:${pheno}`;
    const factorNodeId = `factor:${pheno}|${factor}`;
    const factorLabel = clusterDisplayLabel(factorObj, factor);
    const phenoLabel =
        typeof phenotypeDisplay === "function" ? phenotypeDisplay(pheno) : pheno;

    if (includePhenotypeNode) {
        addNode({ id: phenotypeNodeId, label: phenoLabel, type: "Phenotype" });
    }
    addNode({
        id: factorNodeId,
        label: factorLabel,
        type: "Factor",
    });
    if (includePhenotypeNode) {
        addEdge({ source: phenotypeNodeId, target: factorNodeId, predicate: "associated_with" });
    }

    const topGeneSets =
        typeof factorObj.top_gene_sets === "string" && factorObj.top_gene_sets
            ? factorObj.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
            : [];
    const topPrograms =
        typeof factorObj.gene_set_program === "string" && factorObj.gene_set_program
            ? factorObj.gene_set_program.split("|").map((s) => s.trim()).filter(Boolean)
            : [];
    const geneSetNodeByName = {};
    const allGeneSetNames = new Set(topGeneSets);
    Object.keys(factorObj.genes || {}).forEach((geneName) => {
        const rel = factorObj.genes[geneName] || {};
        (rel.geneSetIds || []).forEach((gs) => {
            if (gs) allGeneSetNames.add(String(gs).trim());
        });
    });
    Object.keys(factorObj.geneSets || {}).forEach((gs) => {
        if (gs) allGeneSetNames.add(String(gs).trim());
    });
    [...allGeneSetNames].forEach((gs, idx) => {
        if (!includeGeneSets) return;
        if (allowedGeneSets && !allowedGeneSets.has(gs)) return;
        const gsNodeId = `gs:${pheno}|${factor}|${gs}`;
        geneSetNodeByName[gs] = gsNodeId;
        const gsMeta = (factorObj.geneSets && factorObj.geneSets[gs]) || {};
        const geneSetScore =
            gsMeta.gene_set_score != null && !isNaN(Number(gsMeta.gene_set_score))
                ? Number(gsMeta.gene_set_score)
                : null;
        const gsFactorValue =
            gsMeta.factor_value != null && !isNaN(Number(gsMeta.factor_value))
                ? Number(gsMeta.factor_value)
                : null;
        addNode({
            id: gsNodeId,
            label: gs,
            type: "Pathway",
            metadata: {
                program: topPrograms[idx] || "",
                gene_set_score: geneSetScore,
                p_value: gsMeta.p_value != null && !isNaN(Number(gsMeta.p_value))
                    ? Number(gsMeta.p_value)
                    : null,
                // Prefer -log10(p) (stored as gene_set_score); fall back to Overall factor value.
                node_score:
                    geneSetScore != null ? Math.abs(geneSetScore) : gsFactorValue != null ? Math.abs(gsFactorValue) : null,
                factor_value: gsFactorValue,
            },
        });
        addEdge({
            source: factorNodeId,
            target: gsNodeId,
            predicate: "linked_to_pathway",
            metadata: { factor_value: gsFactorValue != null ? Math.abs(gsFactorValue) : null },
        });
    });

    const factorGenes = factorObj.genes || {};
    const globalGenes = pData.genes || {};
    const factorGeneSets = factorObj.geneSets || {};
    const fallbackGs = topGeneSets.length ? topGeneSets[0] : "";
    Object.keys(factorGenes).forEach((geneName) => {
        if (!includeGenes) return;
        const gene = String(geneName || "").trim();
        if (!gene) return;
        const rel = factorGenes[gene] || {};
        if (genesInSearchOnly && rel.includedFromRequest !== true) return;
        if (allowedGenes && !allowedGenes.has(gene)) return;
        const geneNodeId = `gene:${gene}`;
        const stats = globalGenes[gene] || {};
        const gwas =
            stats.gwasSupport != null && !isNaN(Number(stats.gwasSupport))
                ? Number(stats.gwasSupport)
                : null;
        const functional =
            stats.geneSetSupport != null && !isNaN(Number(stats.geneSetSupport))
                ? Number(stats.geneSetSupport)
                : null;
        const combined =
            stats.combined != null && !isNaN(Number(stats.combined))
                ? Number(stats.combined)
                : null;
        const geneScore =
            rel.gene_score != null && !isNaN(Number(rel.gene_score))
                ? Number(rel.gene_score)
                : stats.gene_score != null && !isNaN(Number(stats.gene_score))
                  ? Number(stats.gene_score)
                  : null;
        const geneFactorValue =
            rel.factor_value != null && !isNaN(Number(rel.factor_value))
                ? Number(rel.factor_value)
                : rel.factorRelevance != null && !isNaN(Number(rel.factorRelevance))
                  ? Number(rel.factorRelevance)
                  : null;
        addNode({
            id: geneNodeId,
            label: gene,
            type: "Gene",
            metadata: {
                gwas_support: gwas,
                functional_support: functional,
                combined_score: combined,
                gene_score: geneScore,
                node_score: geneScore != null ? Math.abs(geneScore) : null,
                factor_value: geneFactorValue,
            },
        });

        let linked = 0;
        if (linkGenesToGeneSets) {
            const explicitGeneSetIds = Array.isArray(factorGenes[gene] && factorGenes[gene].geneSetIds)
                ? factorGenes[gene].geneSetIds.map((x) => String(x || "").trim()).filter(Boolean)
                : [];
            const connectedSets = explicitGeneSetIds.length
                ? explicitGeneSetIds
                : Object.keys(factorGeneSets).filter((gsName) => {
                      const members =
                          factorGeneSets[gsName] && Array.isArray(factorGeneSets[gsName].genes)
                              ? factorGeneSets[gsName].genes
                              : [];
                      return members.includes(gene);
                  });
            connectedSets.forEach((gsName) => {
                const gsNodeId = geneSetNodeByName[gsName];
                if (!gsNodeId) return;
                linked += 1;
                const gsMeta = factorGeneSets[gsName] || {};
                const gsFv =
                    gsMeta.factor_value != null && !isNaN(Number(gsMeta.factor_value))
                        ? Math.abs(Number(gsMeta.factor_value))
                        : null;
                addEdge({
                    source: geneNodeId,
                    target: gsNodeId,
                    predicate: "contributes_to_pathway",
                    metadata: {
                        functional_support: functional,
                        // Overall factor value drives edge length (prefer gene loading, else gene-set loading).
                        factor_value:
                            geneFactorValue != null ? Math.abs(geneFactorValue) : gsFv,
                    },
                });
            });
            if (!linked) {
                if (fallbackGs && geneSetNodeByName[fallbackGs]) {
                    addEdge({
                        source: geneNodeId,
                        target: geneSetNodeByName[fallbackGs],
                        predicate: "contributes_to_pathway",
                        metadata: {
                            functional_support: functional,
                            linkage_fallback: true,
                            factor_value: geneFactorValue != null ? Math.abs(geneFactorValue) : null,
                        },
                        dashes: true,
                    });
                    linked = 1;
                }
            }
        }
        if (!linked) {
            addEdge({
                source: geneNodeId,
                target: factorNodeId,
                predicate: "associated_with_cluster",
                metadata: {
                    functional_support: functional,
                    no_pathway_membership: !linkGenesToGeneSets ? undefined : true,
                    factor_value: geneFactorValue != null ? Math.abs(geneFactorValue) : null,
                },
                dashes: !!linkGenesToGeneSets,
            });
        }
    });

    return { nodes, edges };
}

/**
 * Merge connectivity graphs for each phenotype × factor pair in view.
 * @param {Array} pairs from buildHeatmapPairs()
 */
export function buildMergedFactorDataNetwork(
    pairs,
    factorData = {},
    {
        phenotypeDisplay,
        linkGenesToGeneSets = true,
        includePhenotypeNode = true,
        includeGeneSets = true,
        includeGenes = true,
        genesInSearchOnly = false,
        allowedGeneSets = null,
        allowedGenes = null,
    } = {}
) {
    const merged = { nodes: [], edges: [] };
    const nodeSeen = new Set();
    const edgeSeen = new Set();
    (pairs || []).forEach((pair) => {
        if (!pair || !pair.factorObj) return;
        const net = buildFactorConnectivityNetwork({
            phenotype: pair.phenotype,
            factorObj: pair.factorObj,
            factorData,
            phenotypeDisplay,
            linkGenesToGeneSets,
            includePhenotypeNode,
            includeGeneSets,
            includeGenes,
            genesInSearchOnly,
            allowedGeneSets,
            allowedGenes,
        });
        (net.nodes || []).forEach((n) => {
            if (!n || !n.id || nodeSeen.has(n.id)) return;
            nodeSeen.add(n.id);
            merged.nodes.push(n);
        });
        (net.edges || []).forEach((e) => {
            if (!e || !e.source || !e.target) return;
            const id = `${e.source}|${e.predicate || e.label || ""}|${e.target}`;
            if (edgeSeen.has(id)) return;
            edgeSeen.add(id);
            merged.edges.push(e);
        });
    });
    return merged;
}

export function genesFromFactorDataNetwork(network) {
    return (network?.nodes || [])
        .filter((n) => n && n.type === "Gene")
        .map((n) => {
            const gene = String(n.label || n.id || "").replace(/^gene:/, "").trim();
            const meta = n.metadata || {};
            return {
                gene,
                group: meta.group || "",
                scores: {
                    combined: meta.combined_score,
                    gwas: meta.gwas_support,
                    functional: meta.functional_support,
                    gene_score: meta.gene_score,
                },
            };
        })
        .filter((g) => g.gene);
}
