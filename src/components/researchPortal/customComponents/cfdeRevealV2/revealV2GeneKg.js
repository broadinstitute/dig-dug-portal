/**
 * Gene-seeded CFDE KG subgraph for Reveal V2.
 * Pipeline: gene↔trait + gene↔factor, then trait↔factor intersection among those sets
 * (loop traits; keep only factors already returned by gene↔factor).
 */

import {
    CFDE_KG_GRAPH,
    CFDE_KG_PREFIXES,
    fetchCfdeKgSparql,
    sparqlEscape,
    sparqlNumber,
    sparqlString,
} from "@/components/researchPortal/customComponents/revealScope/scopeKgSparql.js";

const DEFAULT_TRAIT_LIMIT = 50;
const DEFAULT_FACTOR_LIMIT = 25;
/** Concurrent trait→factor intersection queries (endpoint is memory-sensitive). */
const TRAIT_LINK_CONCURRENCY = 8;

function exactGeneLabelFilter(geneText) {
    const escaped = sparqlEscape(String(geneText || "").trim().toLowerCase());
    if (!escaped) return "";
    return `FILTER(LCASE(STR(?geneLabel)) = "${escaped}")`;
}

function geneToTraitQuery(geneText, limit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?gene ?geneLabel ?trait ?traitLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?stmt rdf:subject ?gene ;
          rdf:predicate reveal:geneToTrait ;
          rdf:object ?trait ;
          reveal:weight ?weight .
    ?gene rdfs:label ?geneLabel .
    ?trait rdfs:label ?traitLabel .
    ${exactGeneLabelFilter(geneText)}
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

function geneToFactorQuery(geneText, limit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?gene ?geneLabel ?factor ?factorLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?stmt rdf:subject ?gene ;
          rdf:predicate reveal:geneToFactor ;
          rdf:object ?factor ;
          reveal:weight ?weight .
    ?gene rdfs:label ?geneLabel .
    OPTIONAL { ?factor rdfs:label ?factorLabel . }
    ${exactGeneLabelFilter(geneText)}
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

/**
 * For one gene-linked trait, which of the gene-linked factors also have traitToFactor?
 * VALUES constrains factors to the gene↔factor set (intersection, not open factor→any trait).
 */
function traitToGeneFactorsQuery(traitIri, factorIris) {
    const factorValues = factorIris.map((iri) => `<${iri}>`).join(" ");
    return `${CFDE_KG_PREFIXES}
SELECT ?factor ?factorLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    VALUES ?factor { ${factorValues} }
    ?stmt rdf:subject <${traitIri}> ;
          rdf:predicate reveal:traitToFactor ;
          rdf:object ?factor ;
          reveal:weight ?weight .
    OPTIONAL { ?factor rdfs:label ?factorLabel . }
  }
}
ORDER BY DESC(ABS(?weight))
`;
}

function addNode(nodes, id, label, type) {
    if (!id) return;
    if (!nodes.has(id)) {
        nodes.set(id, { id, label: label || id, type });
    } else if (label && nodes.get(id).label === id) {
        nodes.set(id, { ...nodes.get(id), label });
    }
}

function edgeKey(type, source, target) {
    return `${type}|${source}|${target}`;
}

/**
 * Build { nodes, edges } from the three edge lists (SCOPE network graph shape).
 * @param {{ geneToTrait: object[], geneToFactor: object[], traitToFactor: object[] }} edges
 */
export function buildGeneKgGraph({ geneToTrait = [], geneToFactor = [], traitToFactor = [] } = {}) {
    const nodes = new Map();
    const edgesByKey = new Map();

    function addEdge(type, source, target, weight) {
        if (!source || !target) return;
        const key = edgeKey(type, source, target);
        if (!edgesByKey.has(key)) {
            edgesByKey.set(key, {
                source,
                target,
                weight: weight == null ? null : weight,
                type,
            });
        }
    }

    geneToTrait.forEach((e) => {
        addNode(nodes, e.gene, e.geneLabel, "gene");
        addNode(nodes, e.trait, e.traitLabel, "trait");
        addEdge("geneToTrait", e.gene, e.trait, e.weight);
    });

    geneToFactor.forEach((e) => {
        addNode(nodes, e.gene, e.geneLabel, "gene");
        addNode(nodes, e.factor, e.factorLabel, "factor");
        addEdge("geneToFactor", e.gene, e.factor, e.weight);
    });

    traitToFactor.forEach((e) => {
        addNode(nodes, e.factor, e.factorLabel || null, "factor");
        addNode(nodes, e.trait, e.traitLabel, "trait");
        addEdge("traitToFactor", e.trait, e.factor, e.weight);
    });

    return {
        nodes: Array.from(nodes.values()),
        edges: Array.from(edgesByKey.values()),
        rowOrder: ["gene", "factor", "trait"],
    };
}

/**
 * Loop gene traits; for each, ask which gene factors share a traitToFactor edge.
 * Avoids a single cartesian SPARQL join (endpoint OOMs on that pattern).
 *
 * @param {Array<{ trait: string, traitLabel: string }>} geneToTrait
 * @param {string[]} factorIris
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{ trait: string, traitLabel: string, factor: string, factorLabel: string, weight: number|null }>>}
 */
async function findTraitFactorIntersection(geneToTrait, factorIris, opts = {}) {
    if (!geneToTrait.length || !factorIris.length) return [];

    const traitLabelByIri = new Map(
        geneToTrait.map((e) => [e.trait, e.traitLabel || ""])
    );
    const uniqueTraits = Array.from(new Set(geneToTrait.map((e) => e.trait).filter(Boolean)));
    const signal = opts.signal;
    const out = [];

    for (let i = 0; i < uniqueTraits.length; i += TRAIT_LINK_CONCURRENCY) {
        const chunk = uniqueTraits.slice(i, i + TRAIT_LINK_CONCURRENCY);
        const chunkResults = await Promise.all(
            chunk.map(async (traitIri) => {
                try {
                    const { bindings } = await fetchCfdeKgSparql(
                        traitToGeneFactorsQuery(traitIri, factorIris),
                        { signal }
                    );
                    return bindings.map((b) => ({
                        trait: traitIri,
                        traitLabel: traitLabelByIri.get(traitIri) || "",
                        factor: sparqlString(b.factor),
                        factorLabel: sparqlString(b.factorLabel),
                        weight: sparqlNumber(b.weight),
                    }));
                } catch (error) {
                    if (error && error.name === "AbortError") throw error;
                    return [];
                }
            })
        );
        chunkResults.forEach((rows) => {
            rows.forEach((row) => out.push(row));
        });
    }

    return out;
}

/**
 * Fetch gene-seeded CFDE KG subgraph: gene↔trait, gene↔factor, then trait↔factor intersection.
 *
 * @param {string} geneSymbol - HGNC symbol (e.g. "PCSK9")
 * @param {{ traitLimit?: number, factorLimit?: number, signal?: AbortSignal }} [opts]
 */
export async function fetchGeneKg(geneSymbol, opts = {}) {
    const geneText = String(geneSymbol || "").trim();
    if (!geneText) {
        return emptyGeneKg("");
    }

    const traitLimit = Math.max(1, Math.min(100, Number(opts.traitLimit) || DEFAULT_TRAIT_LIMIT));
    const factorLimit = Math.max(1, Math.min(50, Number(opts.factorLimit) || DEFAULT_FACTOR_LIMIT));
    const signal = opts.signal;

    const [traitResult, factorResult] = await Promise.all([
        fetchCfdeKgSparql(geneToTraitQuery(geneText, traitLimit), { signal }),
        fetchCfdeKgSparql(geneToFactorQuery(geneText, factorLimit), { signal }),
    ]);

    const geneToTrait = traitResult.bindings.map((b) => ({
        gene: sparqlString(b.gene),
        geneLabel: sparqlString(b.geneLabel),
        trait: sparqlString(b.trait),
        traitLabel: sparqlString(b.traitLabel),
        weight: sparqlNumber(b.weight),
    }));

    const geneToFactor = factorResult.bindings.map((b) => ({
        gene: sparqlString(b.gene),
        geneLabel: sparqlString(b.geneLabel),
        factor: sparqlString(b.factor),
        factorLabel: sparqlString(b.factorLabel),
        weight: sparqlNumber(b.weight),
    }));

    const factorIris = Array.from(new Set(geneToFactor.map((e) => e.factor).filter(Boolean)));
    const factorLabelByIri = new Map(geneToFactor.map((e) => [e.factor, e.factorLabel]));

    const traitToFactorRaw = await findTraitFactorIntersection(geneToTrait, factorIris, {
        signal,
    });
    const traitToFactor = traitToFactorRaw.map((link) => ({
        ...link,
        factorLabel: link.factorLabel || factorLabelByIri.get(link.factor) || "",
    }));

    const geneIri =
        (geneToTrait[0] && geneToTrait[0].gene) ||
        (geneToFactor[0] && geneToFactor[0].gene) ||
        null;
    const geneLabel =
        (geneToTrait[0] && geneToTrait[0].geneLabel) ||
        (geneToFactor[0] && geneToFactor[0].geneLabel) ||
        geneText.toUpperCase();

    const graph = buildGeneKgGraph({ geneToTrait, geneToFactor, traitToFactor });

    return {
        gene: geneText.toUpperCase(),
        geneIri,
        geneLabel,
        geneToTrait,
        geneToFactor,
        traitToFactor,
        graph,
        coverage: {
            kg: "CFDE REVEAL KG (digcfdekg)",
            graph: CFDE_KG_GRAPH,
            routes: ["geneToTrait", "geneToFactor", "traitToFactor(intersection)"],
        },
    };
}

function emptyGeneKg(gene) {
    return {
        gene: String(gene || "").toUpperCase(),
        geneIri: null,
        geneLabel: null,
        geneToTrait: [],
        geneToFactor: [],
        traitToFactor: [],
        graph: { nodes: [], edges: [], rowOrder: ["gene", "factor", "trait"] },
        coverage: {
            kg: "CFDE REVEAL KG (digcfdekg)",
            graph: CFDE_KG_GRAPH,
            routes: ["geneToTrait", "geneToFactor", "traitToFactor(intersection)"],
        },
    };
}
