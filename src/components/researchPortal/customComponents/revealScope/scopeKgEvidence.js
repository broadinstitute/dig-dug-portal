import {
    CFDE_KG_GRAPH,
    CFDE_KG_PREFIXES,
    fetchCfdeKgSparql,
    sparqlEscape,
    sparqlNumber,
    sparqlString,
} from "./scopeKgSparql.js";
import { searchBiomarkerFactors } from "./scopeBiomarkerFactorSearch.js";

/**
 * Module C v0 — evidence routes, not literal spec "hops" of one mechanistic path.
 * digcfdekg is a statistically-inferred gene<->trait association graph (GWAS/expression-
 * factor derived weights), not a curated mechanistic KG with directional relations — there
 * is no path like target->intermediate->outcome to walk. These three queries are independent
 * routes to the same question ("is target associated with outcome in this KG"), ordered by
 * increasing indirection, and reported the same way the spec wants real hops reported: each
 * one gets its own explicit state, never collapsed into a ratio.
 */
export const EVIDENCE_ROUTES = [
    { id: "direct", hop: 1, label: "Direct gene–trait association" },
    { id: "factor", hop: 2, label: "Shared factor (gene and trait both linked to it)" },
    { id: "geneSet", hop: 3, label: "Gene set membership (gene's set linked to trait)" },
];

/** Coverage metadata mandatory on every Module C result (spec §4 behavior 3). */
export function cfdeKgCoverage() {
    return {
        kg: "CFDE REVEAL KG (digcfdekg)",
        graph: CFDE_KG_GRAPH,
        scope:
            "Genes (NCBI Gene) x traits (MONDO/EFO/Orphanet diseases, CHEBI chemicals, and " +
            "digcfdekg's own trait nodes) via statistically inferred associations " +
            "(GWAS/expression-factor weights) — no directional or causal relation types, " +
            "so this KG can only support VERIFIED/UNEXPLORED, never REFUTED.",
        version: null,
        lastUpdated: null,
    };
}

function exactLabelFilter(varName, text) {
    const escaped = sparqlEscape(String(text || "").trim().toLowerCase());
    if (!escaped) return "";
    return `FILTER(LCASE(STR(?${varName})) = "${escaped}")`;
}

/** OR of CONTAINS across every candidate trait-match string (raw outcome text, its resolved_id, and any semantically-resolved factors' disease context). */
function anyContainsFilter(varName, candidates) {
    const clauses = candidates
        .map((c) => sparqlEscape(String(c || "").trim().toLowerCase()))
        .filter(Boolean)
        .map((c) => `CONTAINS(LCASE(STR(?${varName})), "${c}")`);
    if (!clauses.length) return "";
    return `FILTER(${clauses.join(" || ")})`;
}

function directQuery(geneText, traitCandidates, limit) {
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
    ${exactLabelFilter("geneLabel", geneText)}
    ${anyContainsFilter("traitLabel", traitCandidates)}
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

/** Primary hop-2 strategy: gene linked directly to one of the semantically-resolved Factor IRIs. */
function factorByIriQuery(geneText, factorIris, limit) {
    const terms = factorIris.map((iri) => `<${iri}>`).join(" ");
    return `${CFDE_KG_PREFIXES}
SELECT ?factor ?factorLabel ?gene ?geneLabel ?geneFactorWeight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    VALUES ?factor { ${terms} }
    ?geneFactorStmt rdf:subject ?gene ;
                    rdf:predicate reveal:geneToFactor ;
                    rdf:object ?factor ;
                    reveal:weight ?geneFactorWeight .
    ?gene rdfs:label ?geneLabel .
    OPTIONAL { ?factor rdfs:label ?factorLabel . }
    ${exactLabelFilter("geneLabel", geneText)}
  }
}
ORDER BY DESC(ABS(?geneFactorWeight))
LIMIT ${limit}
`;
}

/** Fallback hop-2 strategy (no semantic match available): join gene->factor and trait->factor directly. */
function factorByJoinQuery(geneText, traitCandidates, limit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?factor ?factorLabel ?gene ?geneLabel ?geneFactorWeight ?trait ?traitLabel ?traitFactorWeight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?geneFactorStmt rdf:subject ?gene ;
                    rdf:predicate reveal:geneToFactor ;
                    rdf:object ?factor ;
                    reveal:weight ?geneFactorWeight .
    ?traitFactorStmt rdf:subject ?trait ;
                     rdf:predicate reveal:traitToFactor ;
                     rdf:object ?factor ;
                     reveal:weight ?traitFactorWeight .
    ?gene rdfs:label ?geneLabel .
    ?trait rdfs:label ?traitLabel .
    OPTIONAL { ?factor rdfs:label ?factorLabel . }
    ${exactLabelFilter("geneLabel", geneText)}
    ${anyContainsFilter("traitLabel", traitCandidates)}
  }
}
ORDER BY DESC(ABS(?geneFactorWeight) + ABS(?traitFactorWeight))
LIMIT ${limit}
`;
}

function geneSetQuery(geneText, traitCandidates, limit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?geneSet ?geneSetLabel ?gene ?geneLabel ?trait ?traitLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?inSetStmt rdf:subject ?gene ;
               rdf:predicate reveal:geneInGeneSet ;
               rdf:object ?geneSet .
    ?setTraitStmt rdf:subject ?geneSet ;
                  rdf:predicate reveal:geneSetToTrait ;
                  rdf:object ?trait ;
                  reveal:weight ?weight .
    ?gene rdfs:label ?geneLabel .
    ?trait rdfs:label ?traitLabel .
    OPTIONAL { ?geneSet rdfs:label ?geneSetLabel . }
    ${exactLabelFilter("geneLabel", geneText)}
    ${anyContainsFilter("traitLabel", traitCandidates)}
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

function mapDirectBindings(bindings) {
    return bindings.map((b) => ({
        gene: sparqlString(b.gene),
        geneLabel: sparqlString(b.geneLabel),
        trait: sparqlString(b.trait),
        traitLabel: sparqlString(b.traitLabel),
        weight: sparqlNumber(b.weight),
    }));
}

function mapFactorByIriBindings(bindings, factorsById) {
    return bindings.map((b) => {
        const factorIri = sparqlString(b.factor);
        const resolved = factorsById.get(factorIri);
        return {
            factor: factorIri,
            factorLabel: sparqlString(b.factorLabel),
            gene: sparqlString(b.gene),
            geneLabel: sparqlString(b.geneLabel),
            geneFactorWeight: sparqlNumber(b.geneFactorWeight),
            matchedVia: "semantic mechanism search",
            searchScore: resolved ? resolved.score : null,
            cfdeDisease: resolved ? resolved.cfdeDisease : "",
        };
    });
}

function mapFactorByJoinBindings(bindings) {
    return bindings.map((b) => ({
        factor: sparqlString(b.factor),
        factorLabel: sparqlString(b.factorLabel),
        gene: sparqlString(b.gene),
        geneLabel: sparqlString(b.geneLabel),
        geneFactorWeight: sparqlNumber(b.geneFactorWeight),
        trait: sparqlString(b.trait),
        traitLabel: sparqlString(b.traitLabel),
        traitFactorWeight: sparqlNumber(b.traitFactorWeight),
        matchedVia: "trait label match",
    }));
}

function mapGeneSetBindings(bindings) {
    return bindings.map((b) => ({
        geneSet: sparqlString(b.geneSet),
        geneSetLabel: sparqlString(b.geneSetLabel),
        gene: sparqlString(b.gene),
        geneLabel: sparqlString(b.geneLabel),
        trait: sparqlString(b.trait),
        traitLabel: sparqlString(b.traitLabel),
        weight: sparqlNumber(b.weight),
    }));
}

function dedupeNonEmpty(values) {
    const seen = new Set();
    const out = [];
    values.forEach((v) => {
        const value = String(v || "").trim();
        if (!value || seen.has(value.toLowerCase())) return;
        seen.add(value.toLowerCase());
        out.push(value);
    });
    return out;
}

/**
 * Runs all three evidence routes for a target/outcome pair against the CFDE REVEAL KG.
 * Always runs all three (never short-circuits on an earlier match) so every route gets
 * its own explicit state, per the spec's per-hop reporting rule.
 *
 * `targetText`/`outcomeText` are the raw hypothesis wording (e.g. "PD-1", "restores
 * IFN-gamma secretion"); `targetResolvedId`/`outcomeResolvedId` are Module A's best-effort
 * canonical forms (e.g. "PDCD1", "T cell exhaustion") when it could confidently supply one.
 * The gene side has no live synonym lookup — it relies entirely on Module A having
 * normalized to the official HGNC symbol, since this KG indexes genes under that symbol,
 * not common/brand names. The outcome side is resolved live via a semantic Factor search
 * (`scopeBiomarkerFactorSearch.js`) before querying, since outcome text is often a
 * mechanism-level phrase with no matching trait label to find by substring alone.
 *
 * @param {{ targetText: string, targetResolvedId?: string, outcomeText: string, outcomeResolvedId?: string, limit?: number, signal?: AbortSignal, onStep?: (stepId: string, status: string) => void }} params
 * @returns {Promise<{ routes: Array<{ id: string, hop: number, label: string, state: "VERIFIED"|"UNEXPLORED", edges: object[] }>, coverage: object, resolvedFactors: object[] }>}
 */
export async function findKgEvidence({
    targetText,
    targetResolvedId,
    outcomeText,
    outcomeResolvedId,
    limit = 10,
    signal,
    onStep,
} = {}) {
    const geneText = targetResolvedId || targetText;
    const emitStep = typeof onStep === "function" ? onStep : () => {};

    emitStep("resolveFactors", "active");
    let resolvedFactors = [];
    try {
        resolvedFactors = await searchBiomarkerFactors(outcomeResolvedId || outcomeText, {
            limit: 5,
            signal,
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("[scopeKgEvidence] semantic factor search failed, continuing without it", error);
    }
    emitStep("resolveFactors", "done");

    const traitCandidates = dedupeNonEmpty([
        outcomeText,
        outcomeResolvedId,
        ...resolvedFactors.map((f) => f.cfdeDisease),
    ]);

    emitStep("queryRoutes", "active");
    const factorsById = new Map(resolvedFactors.map((f) => [f.iri, f]));
    const factorPromise = resolvedFactors.length
        ? fetchCfdeKgSparql(
              factorByIriQuery(geneText, resolvedFactors.map((f) => f.iri), limit),
              { signal }
          ).then((res) => ({ strategy: "iri", res }))
        : fetchCfdeKgSparql(factorByJoinQuery(geneText, traitCandidates, limit), { signal }).then(
              (res) => ({ strategy: "join", res })
          );

    const [directResult, factorOutcome, geneSetResult] = await Promise.all([
        fetchCfdeKgSparql(directQuery(geneText, traitCandidates, limit), { signal }),
        factorPromise,
        fetchCfdeKgSparql(geneSetQuery(geneText, traitCandidates, limit), { signal }),
    ]);
    emitStep("queryRoutes", "done");

    const directEdges = mapDirectBindings(directResult.bindings);
    const factorEdges =
        factorOutcome.strategy === "iri"
            ? mapFactorByIriBindings(factorOutcome.res.bindings, factorsById)
            : mapFactorByJoinBindings(factorOutcome.res.bindings);
    const geneSetEdges = mapGeneSetBindings(geneSetResult.bindings);

    return {
        routes: [
            {
                ...EVIDENCE_ROUTES[0],
                state: directEdges.length ? "VERIFIED" : "UNEXPLORED",
                edges: directEdges,
            },
            {
                ...EVIDENCE_ROUTES[1],
                state: factorEdges.length ? "VERIFIED" : "UNEXPLORED",
                edges: factorEdges,
            },
            {
                ...EVIDENCE_ROUTES[2],
                state: geneSetEdges.length ? "VERIFIED" : "UNEXPLORED",
                edges: geneSetEdges,
            },
        ],
        coverage: cfdeKgCoverage(),
        resolvedFactors,
    };
}
