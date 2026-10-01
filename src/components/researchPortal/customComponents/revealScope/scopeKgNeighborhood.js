/**
 * Single-entity CFDE KG neighborhoods for Search CFDE KG
 * (one gene or one mechanism — no outcome / no Module A prerequisite).
 */

import { fetchGeneKg } from "@/components/researchPortal/customComponents/cfdeRevealV2/revealV2GeneKg.js";
import {
    CFDE_KG_PREFIXES,
    CFDE_KG_GRAPH,
    fetchCfdeKgSparql,
    sparqlNumber,
    sparqlString,
} from "./scopeKgSparql.js";
import { cfdeKgCoverage, EVIDENCE_ROUTES } from "./scopeKgEvidence.js";
import { findFactorTraitLinks } from "./scopeKgFactorLinks.js";
import { searchCfdeFactors } from "./scopeFactorSearch.js";

const FACTOR_GENE_LIMIT = 40;

function factorToGeneQuery(factorIri, limit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?gene ?geneLabel ?geneFactorWeight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?stmt rdf:subject ?gene ;
          rdf:predicate reveal:geneToFactor ;
          rdf:object <${factorIri}> ;
          reveal:weight ?geneFactorWeight .
    ?gene rdfs:label ?geneLabel .
  }
}
ORDER BY DESC(ABS(?geneFactorWeight))
LIMIT ${limit}
`;
}

function toKgEvidenceShape({
    directEdges = [],
    factorEdges = [],
    geneSetEdges = [],
    resolvedFactors = [],
    queryContext = {},
} = {}) {
    return {
        routes: [
            { ...EVIDENCE_ROUTES[0], edges: directEdges },
            { ...EVIDENCE_ROUTES[1], edges: factorEdges },
            { ...EVIDENCE_ROUTES[2], edges: geneSetEdges },
        ],
        coverage: cfdeKgCoverage(),
        resolvedFactors,
        factorCandidates: [],
        selectedFactorRationale: null,
        queryContext,
        neighborhoodMode: queryContext.mode || null,
    };
}

/**
 * Gene-seeded neighborhood: all gene↔trait and gene↔factor links (no outcome filter).
 */
export async function findKgEvidenceByGene(geneText, opts = {}) {
    const gene = String(geneText || "").trim();
    if (!gene) {
        return toKgEvidenceShape({
            queryContext: { mode: "gene_neighborhood", targetGene: null },
        });
    }

    const geneKg = await fetchGeneKg(gene, {
        traitLimit: opts.traitLimit,
        factorLimit: opts.factorLimit,
        signal: opts.signal,
    });

    const directEdges = (geneKg.geneToTrait || []).map((e) => ({
        gene: e.gene,
        geneLabel: e.geneLabel,
        trait: e.trait,
        traitLabel: e.traitLabel,
        weight: e.weight,
    }));

    const factorEdges = (geneKg.geneToFactor || []).map((e) => {
        const traitLink = (geneKg.traitToFactor || []).find((t) => t.factor === e.factor);
        return {
            gene: e.gene,
            geneLabel: e.geneLabel,
            factor: e.factor,
            factorLabel: e.factorLabel,
            geneFactorWeight: e.weight,
            trait: traitLink ? traitLink.trait : null,
            traitLabel: traitLink ? traitLink.traitLabel : null,
            traitFactorWeight: traitLink ? traitLink.weight : null,
            matchedVia: "gene neighborhood",
            searchScore: null,
        };
    });

    const resolvedFactors = Array.from(
        new Map(
            (geneKg.geneToFactor || [])
                .filter((e) => e.factor)
                .map((e) => [
                    e.factor,
                    {
                        iri: e.factor,
                        label: e.factorLabel || e.factor,
                        factor: e.factorLabel || "",
                        cfdeDisease: "",
                        score: null,
                    },
                ])
        ).values()
    );

    return toKgEvidenceShape({
        directEdges,
        factorEdges,
        resolvedFactors,
        queryContext: {
            mode: "gene_neighborhood",
            targetGene: geneKg.geneLabel || gene,
        },
    });
}

/**
 * Mechanism/Factor-seeded neighborhood: genes and traits linked to the factor.
 */
export async function findKgEvidenceByFactor({ iri, label } = {}, opts = {}) {
    let factorIri = typeof iri === "string" ? iri.trim() : "";
    let factorLabel = typeof label === "string" ? label.trim() : "";

    if (!factorIri && factorLabel) {
        const hits = await searchCfdeFactors(factorLabel, {
            limit: 5,
            signal: opts.signal,
        });
        const top = hits[0];
        if (top) {
            factorIri = top.iri;
            factorLabel = top.label || factorLabel;
        }
    }

    if (!factorIri) {
        return toKgEvidenceShape({
            queryContext: { mode: "factor_neighborhood", factorIri: null, factorLabel },
        });
    }

    const [geneResult, traitLinks] = await Promise.all([
        fetchCfdeKgSparql(factorToGeneQuery(factorIri, FACTOR_GENE_LIMIT), {
            signal: opts.signal,
        }),
        findFactorTraitLinks(factorIri, { limit: 15, signal: opts.signal }),
    ]);

    const factorEdges = geneResult.bindings.map((b) => {
        const trait = traitLinks[0] || null;
        return {
            gene: sparqlString(b.gene),
            geneLabel: sparqlString(b.geneLabel),
            factor: factorIri,
            factorLabel: factorLabel || factorIri,
            geneFactorWeight: sparqlNumber(b.geneFactorWeight),
            trait: trait ? trait.trait : null,
            traitLabel: trait ? trait.traitLabel : null,
            traitFactorWeight: trait ? trait.weight : null,
            matchedVia: "factor neighborhood",
            searchScore: null,
        };
    });

    // Also surface trait links even when no genes returned.
    if (!factorEdges.length && traitLinks.length) {
        traitLinks.forEach((t) => {
            factorEdges.push({
                gene: null,
                geneLabel: null,
                factor: factorIri,
                factorLabel: factorLabel || factorIri,
                geneFactorWeight: null,
                trait: t.trait,
                traitLabel: t.traitLabel,
                traitFactorWeight: t.weight,
                matchedVia: "factor neighborhood",
                searchScore: null,
            });
        });
    }

    const resolvedFactors = [
        {
            iri: factorIri,
            label: factorLabel || factorIri,
            factor: factorLabel || "",
            cfdeDisease: "",
            score: null,
        },
    ];

    return toKgEvidenceShape({
        factorEdges: factorEdges.filter((e) => e.gene || e.trait),
        resolvedFactors,
        queryContext: {
            mode: "factor_neighborhood",
            factorIri,
            factorLabel: factorLabel || null,
        },
    });
}
