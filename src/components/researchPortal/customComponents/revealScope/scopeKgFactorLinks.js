import { CFDE_KG_GRAPH, CFDE_KG_PREFIXES, fetchCfdeKgSparql, sparqlNumber, sparqlString } from "./scopeKgSparql.js";

/**
 * Factor -> Trait and Factor -> GeneSet links — the two edge types Module C's original three
 * routes never queried (direct/factor/geneSet only ever touch the gene side of a Factor).
 * Confirmed live before building this: `traitToFactor` and `geneSetToFactor` both exist as
 * real, populated predicates in digcfdekg (e.g. the "Fatty acid oxidation and mitochondria
 * (trait context: Rare hypertrophic cardiomyopathy)" factor has a real `traitToFactor` edge
 * to "Rare hypertrophic cardiomyopathy" at weight 0.294, and 20+ `geneSetToFactor` edges
 * including MOOTHA_HUMAN_MITODB_6_2002 at weight 1.0) — this is what makes the 4-row
 * Gene/GeneSet/Factor/Trait network (`scopeKgNetworkGraph.js`) possible.
 */

const MAX_TRAITS_PER_FACTOR = 5;
const MAX_GENE_SETS_PER_FACTOR = 10;

function factorTraitsQuery(factorIri, limit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?trait ?traitLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?stmt rdf:subject ?trait ;
          rdf:predicate reveal:traitToFactor ;
          rdf:object <${factorIri}> ;
          reveal:weight ?weight .
    OPTIONAL { ?trait rdfs:label ?traitLabel . }
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

function factorGeneSetsQuery(factorIri, limit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?geneSet ?geneSetLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?stmt rdf:subject ?geneSet ;
          rdf:predicate reveal:geneSetToFactor ;
          rdf:object <${factorIri}> ;
          reveal:weight ?weight .
    OPTIONAL { ?geneSet rdfs:label ?geneSetLabel . }
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

/**
 * @param {string} factorIri
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{ factor: string, trait: string, traitLabel: string, weight: number|null }>>}
 */
export async function findFactorTraitLinks(factorIri, { limit = MAX_TRAITS_PER_FACTOR, signal } = {}) {
    const { bindings } = await fetchCfdeKgSparql(factorTraitsQuery(factorIri, limit), { signal });
    return bindings.map((b) => ({
        factor: factorIri,
        trait: sparqlString(b.trait),
        traitLabel: sparqlString(b.traitLabel),
        weight: sparqlNumber(b.weight),
    }));
}

/**
 * @param {string} factorIri
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{ factor: string, geneSet: string, geneSetLabel: string, weight: number|null }>>}
 */
export async function findFactorGeneSetLinks(factorIri, { limit = MAX_GENE_SETS_PER_FACTOR, signal } = {}) {
    const { bindings } = await fetchCfdeKgSparql(factorGeneSetsQuery(factorIri, limit), { signal });
    return bindings.map((b) => ({
        factor: factorIri,
        geneSet: sparqlString(b.geneSet),
        geneSetLabel: sparqlString(b.geneSetLabel),
        weight: sparqlNumber(b.weight),
    }));
}
