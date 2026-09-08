import { findFactorTraitLinks, findFactorGeneSetLinks } from "./scopeKgFactorLinks.js";

/**
 * Builds the 4-row Gene / Gene Set / Factor / Trait network graph shown at the top of the
 * CFDE KG tab, from `findKgEvidence()`'s existing 3 routes plus the 2 new factor-side edge
 * types (`scopeKgFactorLinks.js`) that those routes never queried.
 *
 * Deliberately only fetches factor-trait/factor-geneSet links for factors that already have
 * a *confirmed* gene->factor edge in the factor route's own results — a resolved-but-
 * unconfirmed candidate factor (semantic search match with no real geneToFactor edge) never
 * entered `kgEvidence.routes`'s factor edges in the first place, so it shouldn't appear as a
 * node here either.
 */

const ROW_ORDER = ["gene", "geneSet", "factor", "trait"];

function addNode(nodes, id, label, type) {
    if (!id) return;
    if (!nodes.has(id)) {
        nodes.set(id, { id, label: label || id, type });
    } else if (label && nodes.get(id).label === id) {
        // Fill in a real label if the node was first added label-less.
        nodes.set(id, { ...nodes.get(id), label });
    }
}

function edgeKey(type, source, target) {
    return `${type}|${source}|${target}`;
}

/**
 * @param {object} kgEvidence - findKgEvidence()'s result ({ routes, resolvedFactors, ... })
 * @returns {Promise<{ nodes: Array<{id: string, label: string, type: string}>, edges: Array<{source: string, target: string, weight: number|null, type: string}>, rowOrder: string[] }>}
 */
export async function buildKgNetworkGraph(kgEvidence) {
    if (!kgEvidence || !Array.isArray(kgEvidence.routes)) {
        return { nodes: [], edges: [], rowOrder: ROW_ORDER };
    }

    const directRoute = kgEvidence.routes.find((r) => r.id === "direct");
    const factorRoute = kgEvidence.routes.find((r) => r.id === "factor");
    const geneSetRoute = kgEvidence.routes.find((r) => r.id === "geneSet");

    const nodes = new Map();
    const edgesByKey = new Map();

    function addEdge(type, source, target, weight) {
        if (!source || !target) return;
        const key = edgeKey(type, source, target);
        if (!edgesByKey.has(key)) {
            edgesByKey.set(key, { source, target, weight: weight == null ? null : weight, type });
        }
    }

    (directRoute ? directRoute.edges : []).forEach((e) => {
        addNode(nodes, e.gene, e.geneLabel, "gene");
        addNode(nodes, e.trait, e.traitLabel, "trait");
        addEdge("geneToTrait", e.gene, e.trait, e.weight);
    });

    (factorRoute ? factorRoute.edges : []).forEach((e) => {
        addNode(nodes, e.gene, e.geneLabel, "gene");
        addNode(nodes, e.factor, e.factorLabel, "factor");
        addEdge("geneToFactor", e.gene, e.factor, e.geneFactorWeight);
        if (e.trait) {
            addNode(nodes, e.trait, e.traitLabel, "trait");
            addEdge("traitToFactor", e.trait, e.factor, e.traitFactorWeight);
        }
    });

    (geneSetRoute ? geneSetRoute.edges : []).forEach((e) => {
        addNode(nodes, e.gene, e.geneLabel, "gene");
        addNode(nodes, e.geneSet, e.geneSetLabel, "geneSet");
        addNode(nodes, e.trait, e.traitLabel, "trait");
        addEdge("geneInGeneSet", e.gene, e.geneSet, null);
        addEdge("geneSetToTrait", e.geneSet, e.trait, e.weight);
    });

    const confirmedFactorIris = Array.from(
        new Set((factorRoute ? factorRoute.edges : []).map((e) => e.factor).filter(Boolean))
    );

    const [factorTraitResults, factorGeneSetResults] = await Promise.all([
        Promise.all(confirmedFactorIris.map((iri) => findFactorTraitLinks(iri).catch(() => []))),
        Promise.all(confirmedFactorIris.map((iri) => findFactorGeneSetLinks(iri).catch(() => []))),
    ]);

    factorTraitResults.flat().forEach((link) => {
        addNode(nodes, link.factor, null, "factor");
        addNode(nodes, link.trait, link.traitLabel, "trait");
        addEdge("traitToFactor", link.trait, link.factor, link.weight);
    });

    factorGeneSetResults.flat().forEach((link) => {
        addNode(nodes, link.factor, null, "factor");
        addNode(nodes, link.geneSet, link.geneSetLabel, "geneSet");
        addEdge("geneSetToFactor", link.geneSet, link.factor, link.weight);
    });

    return {
        nodes: Array.from(nodes.values()),
        edges: Array.from(edgesByKey.values()),
        rowOrder: ROW_ORDER,
    };
}
