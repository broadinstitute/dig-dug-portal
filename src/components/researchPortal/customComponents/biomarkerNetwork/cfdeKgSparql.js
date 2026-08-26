/**
 * CFDE REVEAL KG SPARQL client (digcfdekg).
 * Endpoint: https://apps.okn.us/digcfdekg/sparql
 */

import { canonicalGeneNodeId } from "./geneNodeIds.js";

export const CFDE_KG_SPARQL = "https://apps.okn.us/digcfdekg/sparql";
export const CFDE_KG_GRAPH = "https://purl.org/okn/frink/kg/digcfdekg";
export const CFDE_KG_FACTOR_PREFIX = "https://purl.org/okn/frink/kg/digcfdekg/node/factor/";

const PREFIXES = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX reveal: <https://purl.org/okn/frink/kg/digcfdekg/schema/>
`;

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ bindings: Array<Record<string, { type: string, value: string, datatype?: string }>>, raw: object }>}
 */
export async function fetchCfdeKgSparql(query, opts = {}) {
    const url = new URL(CFDE_KG_SPARQL);
    url.searchParams.set("query", query);
    const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/sparql-results+json" },
        signal: opts.signal,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`CFDE KG SPARQL HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
    const raw = await res.json();
    return { bindings: (raw.results && raw.results.bindings) || [], raw };
}

function toIriTerm(iri) {
    const value = String(iri || "").trim();
    if (!/^https?:\/\/[^\s<>"]+$/i.test(value)) return "";
    return `<${value}>`;
}

/**
 * Normalize a selected mechanism to a CFDE factor node IRI.
 * Accepts a full IRI or a factor hash/id.
 */
export function toFactorIri(factorRef) {
    const value = String(factorRef || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return `${CFDE_KG_FACTOR_PREFIX}${value}`;
}

function num(binding) {
    if (!binding || binding.value == null || binding.value === "") return null;
    const n = Number(binding.value);
    return Number.isNaN(n) ? null : n;
}

/**
 * Query 1: selected CFDE REVEAL factor → MONDO diseases via its highest-loading genes.
 *
 * @param {string} factorRef factor IRI or hash
 * @param {{ geneLimit?: number, diseaseLimit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{
 *   disease: string,
 *   diseaseLabel: string,
 *   sharedGeneCount: number,
 *   aggregatePigeanScore: number|null,
 *   highestFactorGeneLoading: number|null,
 * }>>}
 */
export async function listMondoDiseasesForFactor(factorRef, opts = {}) {
    const factorTerm = toIriTerm(toFactorIri(factorRef));
    if (!factorTerm) return [];
    const geneLimit = Math.max(1, Number(opts.geneLimit) || 25);
    const diseaseLimit = Math.max(1, Number(opts.diseaseLimit) || 25);
    const q = `${PREFIXES}
SELECT
  ?disease
  ?diseaseLabel
  (COUNT(DISTINCT ?gene) AS ?sharedGeneCount)
  (SUM(?geneTraitScore) AS ?aggregatePigeanScore)
  (MAX(?factorGeneLoading) AS ?highestFactorGeneLoading)
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    {
      SELECT ?gene ?factorGeneLoading
      WHERE {
        ?factorGeneStatement
          rdf:subject ?gene ;
          rdf:predicate reveal:geneToFactor ;
          rdf:object ${factorTerm} ;
          reveal:weight ?factorGeneLoading .
      }
      ORDER BY DESC(ABS(?factorGeneLoading))
      LIMIT ${geneLimit}
    }

    ?geneTraitStatement
      rdf:subject ?gene ;
      rdf:predicate reveal:geneToTrait ;
      rdf:object ?disease ;
      reveal:weight ?geneTraitScore .

    ?disease rdfs:label ?diseaseLabel .

    FILTER(STRSTARTS(STR(?disease), "http://purl.obolibrary.org/obo/MONDO_"))
  }
}
GROUP BY ?disease ?diseaseLabel
ORDER BY DESC(?sharedGeneCount) DESC(?aggregatePigeanScore)
LIMIT ${diseaseLimit}
`;
    const { bindings } = await fetchCfdeKgSparql(q, opts);
    return bindings.map((b) => ({
        disease: (b.disease && b.disease.value) || "",
        diseaseLabel: (b.diseaseLabel && b.diseaseLabel.value) || "",
        sharedGeneCount: Number(b.sharedGeneCount && b.sharedGeneCount.value) || 0,
        aggregatePigeanScore: num(b.aggregatePigeanScore),
        highestFactorGeneLoading: num(b.highestFactorGeneLoading),
    }));
}

/**
 * Fetch the shared genes between a factor and a disease.
 * Returns gene IRI, label, factor loading, and PIGEAN gene-to-trait score.
 */
export async function listSharedGenesForFactorDisease(factorRef, diseaseIri, opts = {}) {
    const factorTerm = toIriTerm(toFactorIri(factorRef));
    const diseaseTerm = toIriTerm(diseaseIri);
    if (!factorTerm || !diseaseTerm) return [];
    const geneLimit = Math.max(1, Number(opts.geneLimit) || 25);
    const q = `${PREFIXES}
SELECT ?gene ?geneLabel ?factorGeneLoading ?geneTraitScore
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    {
      SELECT ?gene ?factorGeneLoading
      WHERE {
        ?factorGeneStatement
          rdf:subject ?gene ;
          rdf:predicate reveal:geneToFactor ;
          rdf:object ${factorTerm} ;
          reveal:weight ?factorGeneLoading .
      }
      ORDER BY DESC(ABS(?factorGeneLoading))
      LIMIT ${geneLimit}
    }

    ?geneTraitStatement
      rdf:subject ?gene ;
      rdf:predicate reveal:geneToTrait ;
      rdf:object ${diseaseTerm} ;
      reveal:weight ?geneTraitScore .

    OPTIONAL { ?gene rdfs:label ?geneLabel . }
  }
}
ORDER BY DESC(ABS(?factorGeneLoading))
`;
    const { bindings } = await fetchCfdeKgSparql(q, opts);
    const byGene = new Map();
    bindings.forEach((b) => {
        const gene = (b.gene && b.gene.value) || "";
        let geneLabel = (b.geneLabel && b.geneLabel.value) || "";
        if (!geneLabel && gene) {
            const parts = String(gene).split(/[/#]/);
            const last = parts[parts.length - 1] || gene;
            geneLabel = last.replace(/^NCBIGene:/i, "").replace(/^HGNC:/i, "") || last;
        }
        const factorLoading = num(b.factorGeneLoading);
        const pigeanScore = num(b.geneTraitScore);
        const key = geneLabel
            ? canonicalGeneNodeId(geneLabel)
            : gene;
        if (!key) return;
        const existing = byGene.get(key);
        if (!existing) {
            byGene.set(key, { gene, geneLabel, factorLoading, pigeanScore });
            return;
        }
        if (
            factorLoading != null &&
            (existing.factorLoading == null ||
                Math.abs(factorLoading) > Math.abs(existing.factorLoading))
        ) {
            existing.factorLoading = factorLoading;
        }
        if (
            pigeanScore != null &&
            (existing.pigeanScore == null ||
                Math.abs(pigeanScore) > Math.abs(existing.pigeanScore))
        ) {
            existing.pigeanScore = pigeanScore;
        }
        if (!existing.geneLabel && geneLabel) existing.geneLabel = geneLabel;
        if (!existing.gene && gene) existing.gene = gene;
    });
    return Array.from(byGene.values());
}

function sparqlEscape(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

function factorHash(iri) {
    const value = String(iri || "");
    const parts = value.split("/");
    return parts[parts.length - 1] || value;
}

/**
 * Autocomplete CFDE REVEAL factors by label (includes trait context).
 *
 * @param {string} needle
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{ iri: string, label: string, hash: string }>>}
 */
export async function searchFactorsByLabel(needle, opts = {}) {
    const qtext = String(needle || "").trim().toLowerCase();
    if (qtext.length < 2) return [];
    const limit = Math.max(1, Number(opts.limit) || 12);
    const q = `${PREFIXES}
SELECT DISTINCT ?factor ?label
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?factorGeneStatement
      rdf:predicate reveal:geneToFactor ;
      rdf:object ?factor .
    ?factor rdfs:label ?label .
    FILTER(CONTAINS(LCASE(STR(?label)), "${sparqlEscape(qtext)}"))
  }
}
ORDER BY ?label
LIMIT ${limit}
`;
    const { bindings } = await fetchCfdeKgSparql(q, opts);
    return bindings.map((b) => {
        const iri = (b.factor && b.factor.value) || "";
        return {
            iri,
            label: (b.label && b.label.value) || "",
            hash: factorHash(iri),
        };
    });
}

/**
 * @param {string} factorRef
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<string>}
 */
export async function getFactorLabel(factorRef, opts = {}) {
    const factorTerm = toIriTerm(toFactorIri(factorRef));
    if (!factorTerm) return "";
    const q = `${PREFIXES}
SELECT ?label
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ${factorTerm} rdfs:label ?label .
  }
}
LIMIT 1
`;
    const { bindings } = await fetchCfdeKgSparql(q, opts);
    return (bindings[0] && bindings[0].label && bindings[0].label.value) || "";
}
