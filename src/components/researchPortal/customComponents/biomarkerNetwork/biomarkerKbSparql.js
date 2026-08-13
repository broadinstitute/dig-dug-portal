/**
 * BiomarkerKB SPARQL client + disease → biomarker queries.
 * Endpoint: https://apps.okn.us/biomarkerkg/sparql
 */

export const BIOMARKER_KG_SPARQL = "https://apps.okn.us/biomarkerkg/sparql";

/** Disease-linking predicates used in BiomarkerKB. */
export const DISEASE_PREDICATES = [
    "obci:OBCI_1000008", // indicates_risk_of_developing
    "obci:OBCI_1000002", // diagnostic_for
    "obci:OBCI_1000006", // prognostic_for
    "obci:OBCI_1000003", // monitors_status_of
];

const PREFIXES = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX obci: <http://purl.obolibrary.org/obo/>
`;

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ bindings: Array<Record<string, { type: string, value: string, datatype?: string }>>, raw: object }>}
 */
export async function fetchSparql(query, opts = {}) {
    const url = new URL(BIOMARKER_KG_SPARQL);
    url.searchParams.set("query", query);
    const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/sparql-results+json" },
        signal: opts.signal,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`SPARQL HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
    const raw = await res.json();
    return { bindings: (raw.results && raw.results.bindings) || [], raw };
}

function escapeSparqlString(s) {
    return String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Normalize a CFDE / user disease string for BiomarkerKB CONTAINS matching.
 * e.g. "Crohn's disease" → "crohn"
 */
export function normalizeDiseaseNeedle(q) {
    return String(q || "")
        .toLowerCase()
        .replace(/['']s\b/g, "")
        .replace(/['']/g, "")
        .replace(/\b(disease|syndrome|disorder)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Shared WHERE body for disease → biomarker matching.
 * @param {string} diseaseNeedle
 */
function diseaseWhereBody(diseaseNeedle) {
    const needle = escapeSparqlString(normalizeDiseaseNeedle(diseaseNeedle));
    if (!needle) {
        return `
  FILTER(false)
`;
    }
    return `
  ?biomarker rdfs:label ?biomarkerLabel ;
             ?diseasePred ?disease .
  VALUES ?diseasePred {
    ${DISEASE_PREDICATES.join("\n    ")}
  }
  ?disease rdfs:label ?diseaseLabel .
  FILTER(CONTAINS(LCASE(STR(?diseaseLabel)), "${needle}"))

  OPTIONAL {
    ?biomarker obci:OBCI_1000011 ?bestType .
    ?bestType rdfs:label ?bestTypeLabel .
  }

  BIND(REPLACE(STR(?biomarkerLabel), "^.*\\\\bgene\\\\s+([A-Za-z0-9-]+)/NCBI:.*$", "$1", "i") AS ?geneCandidate)
  BIND(IF(CONTAINS(?biomarkerLabel, "/NCBI:") && !CONTAINS(?geneCandidate, " "), ?geneCandidate, "") AS ?geneSymbol)
  BIND(REPLACE(STR(?biomarkerLabel), "^.*NCBI:(\\\\d+).*$", "$1", "i") AS ?ncbiCandidate)
  BIND(IF(CONTAINS(?biomarkerLabel, "NCBI:"), ?ncbiCandidate, "") AS ?ncbiId)
  BIND(REPLACE(STR(?biomarkerLabel), "^.*\\\\b(rs\\\\d+)\\\\b.*$", "$1", "i") AS ?rsCandidate)
  BIND(IF(REGEX(STR(?biomarkerLabel), "\\\\brs\\\\d+\\\\b", "i"), ?rsCandidate, "") AS ?rsId)
`;
}

/**
 * Count distinct biomarkers and distinct gene symbols for a disease label needle.
 *
 * Note: geneCount is unique gene symbols among matching biomarkers (empty symbols
 * excluded). It is not nested inside biomarkerCount — many biomarkers can share a gene.
 *
 * @param {string} diseaseNeedle
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ biomarkerCount: number, geneCount: number }>}
 */
export async function countBiomarkersForDisease(diseaseNeedle, opts = {}) {
    const body = diseaseWhereBody(diseaseNeedle);
    const q = `${PREFIXES}
SELECT ?biomarkerCount ?geneCount WHERE {
  {
    SELECT (COUNT(DISTINCT ?biomarker) AS ?biomarkerCount) WHERE {
${body}
    }
  }
  {
    SELECT (COUNT(DISTINCT ?geneSymbol) AS ?geneCount) WHERE {
${body}
      FILTER(?geneSymbol != "")
    }
  }
}
`;
    const { bindings } = await fetchSparql(q, opts);
    const row = bindings[0] || {};
    return {
        biomarkerCount: Number(row.biomarkerCount && row.biomarkerCount.value) || 0,
        geneCount: Number(row.geneCount && row.geneCount.value) || 0,
    };
}

/**
 * List biomarkers for a disease. Prefer calling count first and passing limit = count + 1.
 * @param {string} diseaseNeedle
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{
 *   biomarker: string,
 *   biomarkerLabel: string,
 *   bestType: string,
 *   bestTypeLabel: string,
 *   geneSymbol: string,
 *   ncbiId: string,
 * }>>}
 */
export async function listBiomarkersForDisease(diseaseNeedle, opts = {}) {
    const limit = Math.max(1, Number(opts.limit) || 101);
    const q = `${PREFIXES}
SELECT DISTINCT ?biomarker ?biomarkerLabel ?bestType ?bestTypeLabel ?geneSymbol ?ncbiId ?rsId
WHERE {
${diseaseWhereBody(diseaseNeedle)}
}
ORDER BY ?geneSymbol ?biomarkerLabel
LIMIT ${limit}
`;
    const { bindings } = await fetchSparql(q, opts);
    return bindings.map((b) => ({
        biomarker: (b.biomarker && b.biomarker.value) || "",
        biomarkerLabel: (b.biomarkerLabel && b.biomarkerLabel.value) || "",
        bestType: (b.bestType && b.bestType.value) || "",
        bestTypeLabel: (b.bestTypeLabel && b.bestTypeLabel.value) || "",
        geneSymbol: (b.geneSymbol && b.geneSymbol.value) || "",
        ncbiId: (b.ncbiId && b.ncbiId.value) || "",
        rsId: (b.rsId && b.rsId.value) || "",
    }));
}
