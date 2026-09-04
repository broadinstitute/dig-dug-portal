import { CFDE_KG_GRAPH, CFDE_KG_PREFIXES, fetchCfdeKgSparql, sparqlNumber, sparqlString } from "./scopeKgSparql.js";
import { listBiomarkersForDiseases, BIOMARKER_KB_FETCH_LIMIT } from "./scopeBiomarkerKbSparql.js";

/**
 * "Search Biomarker KB" — a separate action from "Search CFDE KG" (different KG,
 * different data source), even though it starts from data CFDE KG already computed.
 * Mirrors biomarkerNetwork.vue's own pipeline: mechanism (Factor) -> shared-gene MONDO
 * diseases -> shared-gene detail -> BiomarkerKB biomarkers -> LLM relevance triage
 * (triage lives in scopeBiomarkerRelevance.js).
 *
 * The three CFDE/BiomarkerKB queries below (`diseasesForFactorQuery`,
 * `sharedGenesForFactorQuery`, and `listBiomarkersForDiseases` in
 * `scopeBiomarkerKbSparql.js`) are faithful ports of the exact queries
 * `biomarkerNetwork.vue` runs end-to-end — supplied directly by the user off its network
 * tab, not re-derived from reading its source — after review found this file's first two
 * attempts each diverged from production in a real way (see the two 2026-09-04
 * ARCHITECTURE.md changelog entries above this one). Match these exactly rather than
 * re-approximating; if the reference changes, re-diff against a fresh network capture
 * rather than guessing.
 */

// Matches biomarkerNetwork.vue's own per-factor disease query LIMIT exactly.
const MAX_DISEASES_PER_FACTOR = 25;
// SCOPE aggregates across up to 5 semantically-resolved factors (biomarkerNetwork.vue only
// ever searches one, user-picked factor at a time), so the per-factor candidates are deduped
// by disease IRI and capped to this total before the biomarkers query — chosen to match the
// scale of a single-factor biomarkerNetwork.vue search (25 diseases), not invented fresh.
const MAX_TOTAL_DISEASES = 25;
// Matches biomarkerNetwork.vue's own BIOMARKER_LIMIT: one shared cap across the whole batched
// query (all candidate diseases at once), not a per-disease cap — see `listBiomarkersForDiseases`.
const MAX_BIOMARKERS_TOTAL = BIOMARKER_KB_FETCH_LIMIT;

function normalizeGeneSymbol(value) {
    return String(value || "")
        .trim()
        .toUpperCase();
}

function diseasesForFactorQuery(factorIri, geneLimit, diseaseLimit) {
    return `${CFDE_KG_PREFIXES}
SELECT ?disease ?diseaseLabel (COUNT(DISTINCT ?gene) AS ?sharedGeneCount) (SUM(?geneTraitScore) AS ?aggregateScore)
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    {
      SELECT ?gene ?factorGeneLoading
      WHERE {
        ?factorGeneStmt rdf:subject ?gene ;
                        rdf:predicate reveal:geneToFactor ;
                        rdf:object <${factorIri}> ;
                        reveal:weight ?factorGeneLoading .
      }
      ORDER BY DESC(ABS(?factorGeneLoading))
      LIMIT ${geneLimit}
    }
    ?geneTraitStatement rdf:subject ?gene ;
                        rdf:predicate reveal:geneToTrait ;
                        rdf:object ?disease ;
                        reveal:weight ?geneTraitScore .
    ?disease rdfs:label ?diseaseLabel .
    FILTER(STRSTARTS(STR(?disease), "http://purl.obolibrary.org/obo/MONDO_"))
  }
}
GROUP BY ?disease ?diseaseLabel
ORDER BY DESC(?sharedGeneCount) DESC(?aggregateScore)
LIMIT ${diseaseLimit}
`;
}

/**
 * Diseases sharing top-loading genes with the given Factor, restricted to MONDO disease
 * IRIs. Mirrors biomarkerNetwork/cfdeKgSparql.js's listMondoDiseasesForFactor.
 */
export async function findDiseasesForFactor(factorIri, { geneLimit = 25, diseaseLimit = MAX_DISEASES_PER_FACTOR, signal } = {}) {
    const { bindings } = await fetchCfdeKgSparql(diseasesForFactorQuery(factorIri, geneLimit, diseaseLimit), {
        signal,
    });
    return bindings.map((b) => ({
        disease: sparqlString(b.disease),
        diseaseLabel: sparqlString(b.diseaseLabel),
        sharedGeneCount: sparqlNumber(b.sharedGeneCount) || 0,
        aggregateScore: sparqlNumber(b.aggregateScore),
    }));
}

function sharedGenesForFactorQuery(factorIri, diseaseIris, geneLimit) {
    const terms = diseaseIris.map((iri) => `<${iri}>`).join(" ");
    return `${CFDE_KG_PREFIXES}
SELECT ?disease ?gene ?geneLabel ?factorGeneLoading ?geneTraitScore
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    {
      SELECT ?gene ?factorGeneLoading
      WHERE {
        ?factorGeneStatement
          rdf:subject ?gene ;
          rdf:predicate reveal:geneToFactor ;
          rdf:object <${factorIri}> ;
          reveal:weight ?factorGeneLoading .
      }
      ORDER BY DESC(ABS(?factorGeneLoading))
      LIMIT ${geneLimit}
    }

    VALUES ?disease { ${terms} }

    ?geneTraitStatement
      rdf:subject ?gene ;
      rdf:predicate reveal:geneToTrait ;
      rdf:object ?disease ;
      reveal:weight ?geneTraitScore .

    OPTIONAL { ?gene rdfs:label ?geneLabel . }
  }
}
ORDER BY ?disease DESC(ABS(?factorGeneLoading))
`;
}

/**
 * The genes actually shared between a Factor and each of its own candidate diseases —
 * i.e. which of the Factor's top-loading genes have a real `geneToTrait` edge to each
 * disease. This is what powers `biomarkerNetwork.vue`'s "Associated gene to shared gene
 * mapping" — it tells you whether a biomarker's gene is a genuinely confirmed part of the
 * factor↔disease link, or just coincidentally associated with the same disease in
 * BiomarkerKB. Must be scoped to `diseaseIris` already resolved for **this same factor**
 * (from `findDiseasesForFactor`), not an arbitrary disease list — the top-loading-genes
 * subquery is factor-specific.
 */
export async function findSharedGenesForFactor(factorIri, diseaseIris, { geneLimit = 25, signal } = {}) {
    if (!diseaseIris || !diseaseIris.length) return [];
    const { bindings } = await fetchCfdeKgSparql(sharedGenesForFactorQuery(factorIri, diseaseIris, geneLimit), {
        signal,
    });
    return bindings.map((b) => ({
        disease: sparqlString(b.disease),
        gene: sparqlString(b.gene),
        geneLabel: sparqlString(b.geneLabel),
        factorGeneLoading: sparqlNumber(b.factorGeneLoading),
        geneTraitScore: sparqlNumber(b.geneTraitScore),
    }));
}

/**
 * Full bridge: resolved Factors -> shared-gene MONDO diseases -> BiomarkerKB biomarkers.
 *
 * Stage 1, per factor: `findDiseasesForFactor` (up to `MAX_DISEASES_PER_FACTOR` diseases),
 * then `findSharedGenesForFactor` scoped to those same diseases — giving, per disease, the
 * actual set of genes confirmed shared with the factor (not just "the factor overall was
 * gene-confirmed somewhere," which is what an earlier version of this file bubbled up from
 * Module C's hop 2; that was a strictly weaker signal than what this KG can answer directly).
 * `targetGeneSymbol`'s presence in a disease's shared-gene set marks that disease
 * `geneConfirmed` — used to prioritize which diseases survive `MAX_TOTAL_DISEASES` capping
 * when more than one factor's candidates are deduped together.
 *
 * Stage 2 runs **one single batched BiomarkerKB query** across all final candidate disease
 * IRIs at once (`listBiomarkersForDiseases`, `LIMIT MAX_BIOMARKERS_TOTAL` shared across all
 * of them) — matching `biomarkerNetwork.vue` exactly. An earlier version of this file called
 * BiomarkerKB once per disease to avoid one large disease "crowding out" the others under a
 * shared LIMIT; that concern turned out to be moot in practice (each row is one **biomarker
 * entity**, not one disease-biomarker pair, so a common disease only crowds proportionally to
 * how many *distinct* entities it contributes) and diverged from the proven, already-shipped
 * production behavior for no real benefit — switched back to match it.
 *
 * Each returned biomarker's own genes are checked against the **global** union of
 * shared-gene symbols found across all factors/diseases in stage 1 (not scoped to that one
 * biomarker's specific diseases — `biomarkerNetwork.vue`'s own row shape has already
 * discarded which specific disease contributed which gene by this point, so a global check
 * is the faithful parity behavior, not a loosening).
 *
 * @param {{ resolvedFactors: object[], targetGeneSymbol?: string, onStep?: (id: string, status: string) => void }} params
 * @returns {Promise<{
 *   biomarkers: Array<{
 *     biomarker: string,
 *     biomarkerIdentifier: string,
 *     biomarkerLabel: string,
 *     displayLabel: string,
 *     genes: string,
 *     geneList: string[],
 *     roles: string,
 *     roleList: string[],
 *     diseases: string,
 *     diseaseList: string[],
 *     diseaseCount: number,
 *     recordCount: number,
 *   }>,
 *   diseases: Array<{ disease: string, diseaseLabel: string, factorLabel: string, factorIri: string, geneConfirmed: boolean }>,
 *   sharedGeneSymbols: string[],
 *   truncated: boolean,
 * }>}
 */
export async function findBiomarkerBridgeEvidence({ resolvedFactors, targetGeneSymbol, onStep } = {}) {
    const emitStep = typeof onStep === "function" ? onStep : () => {};
    const factors = Array.isArray(resolvedFactors) ? resolvedFactors : [];
    const normalizedTarget = normalizeGeneSymbol(targetGeneSymbol);

    emitStep("findDiseases", "active");
    const diseaseByIri = new Map();
    const sharedGenesByDisease = new Map();
    const sharedGeneSymbols = new Set();

    await Promise.all(
        factors.map(async (factor) => {
            let diseases = [];
            try {
                diseases = await findDiseasesForFactor(factor.iri);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[scopeBiomarkerBridge] disease lookup failed for factor", factor.iri, error);
                return;
            }
            if (!diseases.length) return;

            let sharedGenes = [];
            try {
                sharedGenes = await findSharedGenesForFactor(
                    factor.iri,
                    diseases.map((d) => d.disease)
                );
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[scopeBiomarkerBridge] shared-gene lookup failed for factor", factor.iri, error);
            }
            sharedGenes.forEach((row) => {
                const symbol = normalizeGeneSymbol(row.geneLabel);
                if (!symbol) return;
                sharedGeneSymbols.add(symbol);
                const set = sharedGenesByDisease.get(row.disease) || new Set();
                set.add(symbol);
                sharedGenesByDisease.set(row.disease, set);
            });

            diseases.forEach((d) => {
                const diseaseGenes = sharedGenesByDisease.get(d.disease);
                const geneConfirmed = Boolean(normalizedTarget && diseaseGenes && diseaseGenes.has(normalizedTarget));
                const existing = diseaseByIri.get(d.disease);
                if (!existing) {
                    diseaseByIri.set(d.disease, {
                        ...d,
                        factorLabel: factor.label,
                        factorIri: factor.iri,
                        geneConfirmed,
                    });
                    return;
                }
                if (d.sharedGeneCount > existing.sharedGeneCount) {
                    existing.sharedGeneCount = d.sharedGeneCount;
                    existing.aggregateScore = d.aggregateScore;
                }
                if (geneConfirmed) {
                    existing.geneConfirmed = true;
                }
            });
        })
    );
    emitStep("findDiseases", "done");

    const diseases = Array.from(diseaseByIri.values())
        .sort((a, b) => {
            if (a.geneConfirmed !== b.geneConfirmed) return a.geneConfirmed ? -1 : 1;
            return (b.sharedGeneCount || 0) - (a.sharedGeneCount || 0);
        })
        .slice(0, MAX_TOTAL_DISEASES);

    emitStep("queryBiomarkers", "active");
    let rows = [];
    if (diseases.length) {
        try {
            rows = await listBiomarkersForDiseases(
                diseases.map((d) => d.disease),
                { limit: MAX_BIOMARKERS_TOTAL }
            );
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("[scopeBiomarkerBridge] biomarker lookup failed", error);
        }
    }
    emitStep("queryBiomarkers", "done");

    const biomarkers = rows.map((row) => ({
        ...row,
        geneSharedWithFactor: row.geneList.some((g) => sharedGeneSymbols.has(normalizeGeneSymbol(g))),
    }));

    return {
        biomarkers,
        diseases: diseases.map((d) => ({
            disease: d.disease,
            diseaseLabel: d.diseaseLabel,
            factorLabel: d.factorLabel,
            factorIri: d.factorIri,
            geneConfirmed: d.geneConfirmed,
        })),
        sharedGeneSymbols: Array.from(sharedGeneSymbols),
        truncated: rows.length >= MAX_BIOMARKERS_TOTAL,
    };
}
