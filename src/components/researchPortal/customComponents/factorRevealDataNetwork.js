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
 */
export function buildFactorConnectivityNetwork({
    phenotype,
    factorObj,
    factorData = {},
    phenotypeDisplay,
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

    addNode({ id: phenotypeNodeId, label: phenoLabel, type: "Phenotype" });
    addNode({
        id: factorNodeId,
        label: factorLabel,
        type: "Factor",
    });
    addEdge({ source: phenotypeNodeId, target: factorNodeId, predicate: "associated_with" });

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
        const gsNodeId = `gs:${pheno}|${factor}|${gs}`;
        geneSetNodeByName[gs] = gsNodeId;
        addNode({
            id: gsNodeId,
            label: gs,
            type: "Pathway",
            metadata: { program: topPrograms[idx] || "" },
        });
        addEdge({ source: factorNodeId, target: gsNodeId, predicate: "linked_to_pathway" });
    });

    const factorGenes = factorObj.genes || {};
    const globalGenes = pData.genes || {};
    const factorGeneSets = factorObj.geneSets || {};
    const fallbackGs = topGeneSets.length ? topGeneSets[0] : "";
    Object.keys(factorGenes).forEach((geneName) => {
        const gene = String(geneName || "").trim();
        if (!gene) return;
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
        addNode({
            id: geneNodeId,
            label: gene,
            type: "Gene",
            metadata: {
                gwas_support: gwas,
                functional_support: functional,
                combined_score: combined,
            },
        });

        let linked = 0;
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
            addEdge({
                source: geneNodeId,
                target: gsNodeId,
                predicate: "contributes_to_pathway",
                metadata: { functional_support: functional },
            });
        });
        if (!linked) {
            if (fallbackGs && geneSetNodeByName[fallbackGs]) {
                addEdge({
                    source: geneNodeId,
                    target: geneSetNodeByName[fallbackGs],
                    predicate: "contributes_to_pathway",
                    metadata: { functional_support: functional, linkage_fallback: true },
                    dashes: true,
                });
            } else {
                addEdge({
                    source: geneNodeId,
                    target: factorNodeId,
                    predicate: "associated_with_cluster",
                    metadata: { functional_support: functional, no_pathway_membership: true },
                    dashes: true,
                });
            }
        }
    });

    return { nodes, edges };
}

/**
 * Merge connectivity graphs for each phenotype × factor pair in view.
 * @param {Array} pairs from buildHeatmapPairs()
 */
export function buildMergedFactorDataNetwork(pairs, factorData = {}, { phenotypeDisplay } = {}) {
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
                },
            };
        })
        .filter((g) => g.gene);
}
