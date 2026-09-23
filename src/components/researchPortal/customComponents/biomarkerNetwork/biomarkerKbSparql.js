/**
 * BiomarkerKB SPARQL client + disease → biomarker queries.
 * Endpoint: https://apps.okn.us/biomarkerkg/sparql
 */

export const BIOMARKER_KG_SPARQL = "https://apps.okn.us/biomarkerkg/sparql";
export const BIOMARKER_KG_GRAPH = "https://purl.org/okn/frink/kg/biomarkerkg";

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

function toDiseaseIriTerm(diseaseIri) {
    const iri = String(diseaseIri || "").trim();
    if (!/^https?:\/\/[^\s<>"]+$/i.test(iri)) return "";
    return `<${iri}>`;
}

/**
 * Shared WHERE body for disease → biomarker matching by one or more MONDO/DOID IRIs.
 * @param {string|string[]} diseaseIris
 */
function diseaseWhereBody(diseaseIris) {
    const list = Array.isArray(diseaseIris) ? diseaseIris : [diseaseIris];
    const terms = [];
    const seen = {};
    list.forEach((iri) => {
        const term = toDiseaseIriTerm(iri);
        if (!term || seen[term]) return;
        seen[term] = true;
        terms.push(term);
    });
    if (!terms.length) {
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
  VALUES ?disease { ${terms.join(" ")} }
  OPTIONAL { ?disease rdfs:label ?diseaseLabel }

  OPTIONAL {
    ?biomarker obci:OBCI_1000011 ?bestType .
    ?bestType rdfs:label ?bestTypeLabel .
  }

  BIND(REPLACE(STR(?biomarkerLabel), "^.*\\\\bgene\\\\s+([A-Za-z0-9-]+)/NCBI:.*$", "$1", "i") AS ?geneCandidate)
  BIND(IF(CONTAINS(?biomarkerLabel, "/NCBI:") && !CONTAINS(?geneCandidate, " "), ?geneCandidate, "") AS ?geneSymbol)
  BIND(REPLACE(STR(?biomarkerLabel), "^.*NCBI:(\\\\d+).*$", "$1", "i") AS ?ncbiCandidate)
  BIND(IF(CONTAINS(?biomarkerLabel, "NCBI:"), ?ncbiCandidate, "") AS ?ncbiId)
`;
}

/**
 * Count distinct biomarkers, gene symbols, and biomarker–disease rows for disease IRI(s).
 *
 * @param {string|string[]} diseaseIris
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ biomarkerCount: number, geneCount: number, rowCount: number }>}
 */
export async function countBiomarkersForDisease(diseaseIris, opts = {}) {
    const body = diseaseWhereBody(diseaseIris);
    const q = `${PREFIXES}
SELECT ?biomarkerCount ?geneCount ?rowCount WHERE {
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
  {
    SELECT (COUNT(*) AS ?rowCount) WHERE {
      SELECT DISTINCT ?biomarker ?disease WHERE {
${body}
      }
    }
  }
}
`;
    const { bindings } = await fetchSparql(q, opts);
    const row = bindings[0] || {};
    return {
        biomarkerCount: Number(row.biomarkerCount && row.biomarkerCount.value) || 0,
        geneCount: Number(row.geneCount && row.geneCount.value) || 0,
        rowCount: Number(row.rowCount && row.rowCount.value) || 0,
    };
}

/**
 * List biomarkers for one or more diseases. Prefer calling count first and passing
 * limit = rowCount + 1 (biomarker–disease pairs).
 * @param {string|string[]} diseaseIris
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{
 *   biomarker: string,
 *   biomarkerLabel: string,
 *   bestType: string,
 *   bestTypeLabel: string,
 *   geneSymbol: string,
 *   ncbiId: string,
 *   disease: string,
 *   diseaseLabel: string,
 * }>>}
 */
export async function listBiomarkersForDisease(diseaseIris, opts = {}) {
    const limit = Math.max(1, Number(opts.limit) || 101);
    const q = `${PREFIXES}
SELECT DISTINCT ?biomarker ?biomarkerLabel ?bestType ?bestTypeLabel ?geneSymbol ?ncbiId ?disease ?diseaseLabel
WHERE {
${diseaseWhereBody(diseaseIris)}
}
ORDER BY ?diseaseLabel ?geneSymbol ?biomarkerLabel
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
        disease: (b.disease && b.disease.value) || "",
        diseaseLabel: (b.diseaseLabel && b.diseaseLabel.value) || "",
    }));
}

function uniqueIriTerms(diseaseIris) {
    const list = Array.isArray(diseaseIris) ? diseaseIris : [diseaseIris];
    const terms = [];
    const seen = {};
    list.forEach((iri) => {
        const term = toDiseaseIriTerm(iri);
        if (!term || seen[term]) return;
        seen[term] = true;
        terms.push(term);
    });
    return terms;
}

function splitPipe(value) {
    return String(value || "")
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Query 2: MONDO diseases from CFDE REVEAL → BiomarkerKG records, grouped by biomarker.
 *
 * @param {string|string[]} diseaseIris
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{
 *   biomarker: string,
 *   biomarkerIdentifier: string,
 *   biomarkerLabel: string,
 *   diseaseCount: number,
 *   recordCount: number,
 *   diseases: string,
 *   roles: string,
 *   genes: string,
 *   diseaseList: string[],
 *   roleList: string[],
 *   geneList: string[],
 * }>>}
 */
export async function listBiomarkersForMondoDiseases(diseaseIris, opts = {}) {
    const terms = uniqueIriTerms(diseaseIris);
    if (!terms.length) return [];
    const limit = Math.max(1, Number(opts.limit) || 100);
    const q = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX obci: <http://purl.obolibrary.org/obo/OBCI_>

SELECT
  ?biomarker
  ?biomarkerIdentifier
  ?biomarkerLabel
  (COUNT(DISTINCT ?disease) AS ?diseaseCount)
  (COUNT(DISTINCT ?biomarkerRecord) AS ?recordCount)
  (GROUP_CONCAT(DISTINCT ?diseaseLabel; SEPARATOR=" | ") AS ?diseases)
  (GROUP_CONCAT(DISTINCT ?roleLabel; SEPARATOR=" | ") AS ?roles)
  (GROUP_CONCAT(DISTINCT ?geneSymbol; SEPARATOR=" | ") AS ?genes)
WHERE {
  GRAPH <${BIOMARKER_KG_GRAPH}> {
    VALUES ?disease {
      ${terms.join("\n      ")}
    }

    VALUES (?diseaseRelation ?roleLabel) {
      (obci:1000002 "diagnostic")
      (obci:1000003 "monitoring")
      (obci:1000006 "prognostic")
      (obci:1000008 "susceptibility/risk")
    }

    VALUES ?entityRelation {
      obci:1000009
      obci:1000015
      obci:1000016
      obci:1000017
    }

    ?biomarkerRecord ?diseaseRelation ?disease ;
      ?entityRelation ?biomarker .

    OPTIONAL { ?disease rdfs:label ?diseaseNodeLabel . }
    OPTIONAL { ?biomarker rdfs:label ?biomarkerNodeLabel . }
    OPTIONAL { ?biomarkerRecord rdfs:label ?recordLabel . }
  }

  BIND(COALESCE(?diseaseNodeLabel, STR(?disease)) AS ?diseaseLabel)
  BIND(REPLACE(STR(?biomarker), "^.*/", "") AS ?biomarkerIdentifier)
  BIND(COALESCE(?biomarkerNodeLabel, STR(?biomarker)) AS ?biomarkerLabel)
  BIND(COALESCE(?recordLabel, ?biomarkerLabel) AS ?geneSourceLabel)
  BIND(REPLACE(STR(?geneSourceLabel), "^.*\\\\bgene\\\\s+([A-Za-z0-9-]+)/NCBI:.*$", "$1", "i") AS ?geneCandidate)
  BIND(IF(CONTAINS(?geneSourceLabel, "/NCBI:") && !CONTAINS(?geneCandidate, " "), ?geneCandidate, "") AS ?geneSymbol)
}
GROUP BY ?biomarker ?biomarkerIdentifier ?biomarkerLabel
ORDER BY DESC(?diseaseCount) DESC(?recordCount) ?biomarkerLabel
LIMIT ${limit}
`;
    const { bindings } = await fetchSparql(q, opts);
    return bindings.map((b) => {
        const diseases = (b.diseases && b.diseases.value) || "";
        const roles = (b.roles && b.roles.value) || "";
        const genes = (b.genes && b.genes.value) || "";
        const geneList = splitPipe(genes).filter(Boolean);
        return {
            biomarker: (b.biomarker && b.biomarker.value) || "",
            biomarkerIdentifier: (b.biomarkerIdentifier && b.biomarkerIdentifier.value) || "",
            biomarkerLabel: (b.biomarkerLabel && b.biomarkerLabel.value) || "",
            diseaseCount: Number(b.diseaseCount && b.diseaseCount.value) || 0,
            recordCount: Number(b.recordCount && b.recordCount.value) || 0,
            diseases,
            roles,
            genes: geneList.length ? geneList.join(" | ") : "",
            diseaseList: splitPipe(diseases),
            roleList: splitPipe(roles),
            geneList,
        };
    });
}

function escapeSparqlStringLiteral(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

/**
 * Normalize a reverse-search needle (SNP rsID or gene symbol).
 * @param {string} raw
 * @returns {string}
 */
export function normalizeBiomarkerSearchNeedle(raw) {
    return String(raw || "")
        .trim()
        .replace(/\s+/g, "");
}

/**
 * @param {string} needle
 * @returns {"snp"|"gene"|""}
 */
export function classifyBiomarkerSearchNeedle(needle) {
    const value = normalizeBiomarkerSearchNeedle(needle);
    if (!value) return "";
    if (/^rs\d+$/i.test(value)) return "snp";
    if (/^[A-Za-z][A-Za-z0-9-]*$/.test(value)) return "gene";
    return "";
}

function biomarkerSearchMatchFilter(kind, needle) {
    const lit = escapeSparqlStringLiteral(needle.toLowerCase());
    if (kind === "snp") {
        return `FILTER(LCASE(?biomarkerIdentifier) = "${lit}")`;
    }
    return `FILTER(LCASE(?geneSymbol) = "${lit}")`;
}

function biomarkerSearchBindingsFragment() {
    return `
    ?biomarkerRecord ?entityRelation ?biomarker .
    VALUES ?entityRelation {
      obci:1000009
      obci:1000015
      obci:1000016
      obci:1000017
    }
    OPTIONAL { ?biomarker rdfs:label ?biomarkerLabel . }
    OPTIONAL { ?biomarkerRecord rdfs:label ?recordLabel . }
    BIND(REPLACE(STR(?biomarker), "^.*/", "") AS ?biomarkerIdentifier)
    BIND(COALESCE(?recordLabel, ?biomarkerLabel, "") AS ?geneSourceLabel)
    BIND(REPLACE(STR(?geneSourceLabel), "^.*\\\\bgene\\\\s+([A-Za-z0-9-]+)/NCBI:.*$", "$1", "i") AS ?geneCandidate)
    BIND(IF(CONTAINS(?geneSourceLabel, "/NCBI:") && !CONTAINS(?geneCandidate, " "), ?geneCandidate, "") AS ?geneSymbol)
`;
}

/**
 * Step 1 (reverse): does this SNP/gene exist in BiomarkerKB?
 *
 * @param {string} rawNeedle
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{
 *   found: boolean,
 *   kind: "snp"|"gene"|"",
 *   needle: string,
 *   matchCount: number,
 *   error?: string,
 * }>}
 */
export async function resolveBiomarkerKbSearchTerm(rawNeedle, opts = {}) {
    const needle = normalizeBiomarkerSearchNeedle(rawNeedle);
    const kind = classifyBiomarkerSearchNeedle(needle);
    if (!needle) {
        return { found: false, kind: "", needle: "", matchCount: 0, error: "Enter a SNP or gene." };
    }
    if (!kind) {
        return {
            found: false,
            kind: "",
            needle,
            matchCount: 0,
            error: `Unrecognized search term "${needle}". Use an rsID (e.g. rs7903146) or gene symbol (e.g. TCF7L2).`,
        };
    }

    const q = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX obci: <http://purl.obolibrary.org/obo/OBCI_>

SELECT (COUNT(DISTINCT ?biomarker) AS ?matchCount)
WHERE {
  GRAPH <${BIOMARKER_KG_GRAPH}> {
${biomarkerSearchBindingsFragment()}
    ${biomarkerSearchMatchFilter(kind, needle)}
  }
}
`;
    const { bindings } = await fetchSparql(q, opts);
    const matchCount = Number(bindings[0] && bindings[0].matchCount && bindings[0].matchCount.value) || 0;
    return {
        found: matchCount > 0,
        kind,
        needle,
        matchCount,
    };
}

/**
 * Genes parsed from BiomarkerKB records for a SNP/gene search term.
 * For a gene symbol search this is usually that symbol; for an rsID it comes
 * from the "gene SYMBOL/NCBI:…" fragment in biomarker labels.
 *
 * @param {string} rawNeedle
 * @param {{ signal?: AbortSignal, limit?: number }} [opts]
 * @returns {Promise<string[]>}
 */
export async function listGenesForBiomarkerSearchTerm(rawNeedle, opts = {}) {
    const needle = normalizeBiomarkerSearchNeedle(rawNeedle);
    const kind = classifyBiomarkerSearchNeedle(needle);
    if (!needle || !kind) return [];
    const limit = Math.max(1, Number(opts.limit) || 25);

    if (kind === "gene") {
        return [needle.toUpperCase()];
    }

    const q = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX obci: <http://purl.obolibrary.org/obo/OBCI_>

SELECT DISTINCT ?geneSymbol
WHERE {
  GRAPH <${BIOMARKER_KG_GRAPH}> {
${biomarkerSearchBindingsFragment()}
    ${biomarkerSearchMatchFilter(kind, needle)}
    FILTER(?geneSymbol != "")
  }
}
ORDER BY ?geneSymbol
LIMIT ${limit}
`;
    const { bindings } = await fetchSparql(q, opts);
    const seen = {};
    const out = [];
    bindings.forEach((b) => {
        const symbol = String((b.geneSymbol && b.geneSymbol.value) || "")
            .trim()
            .toUpperCase();
        if (!symbol || seen[symbol]) return;
        seen[symbol] = true;
        out.push(symbol);
    });
    return out;
}

/**
 * Reverse step 2 helper: diseases linked to a resolved SNP/gene in BiomarkerKB.
 *
 * @param {string} rawNeedle
 * @param {{ signal?: AbortSignal, limit?: number }} [opts]
 * @returns {Promise<Array<{
 *   disease: string,
 *   diseaseLabel: string,
 *   roles: string,
 *   roleList: string[],
 *   biomarkerCount: number,
 *   recordCount: number,
 * }>>}
 */
export async function listDiseasesForBiomarkerSearchTerm(rawNeedle, opts = {}) {
    const needle = normalizeBiomarkerSearchNeedle(rawNeedle);
    const kind = classifyBiomarkerSearchNeedle(needle);
    if (!needle || !kind) return [];
    const limit = Math.max(1, Number(opts.limit) || 100);

    const q = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX obci: <http://purl.obolibrary.org/obo/OBCI_>

SELECT
  ?disease
  ?diseaseLabel
  (COUNT(DISTINCT ?biomarker) AS ?biomarkerCount)
  (COUNT(DISTINCT ?biomarkerRecord) AS ?recordCount)
  (GROUP_CONCAT(DISTINCT ?roleLabel; SEPARATOR=" | ") AS ?roles)
WHERE {
  GRAPH <${BIOMARKER_KG_GRAPH}> {
    VALUES (?diseaseRelation ?roleLabel) {
      (obci:1000002 "diagnostic")
      (obci:1000003 "monitoring")
      (obci:1000006 "prognostic")
      (obci:1000008 "susceptibility/risk")
    }

${biomarkerSearchBindingsFragment()}
    ?biomarkerRecord ?diseaseRelation ?disease .
    OPTIONAL { ?disease rdfs:label ?diseaseNodeLabel . }
    ${biomarkerSearchMatchFilter(kind, needle)}
    BIND(COALESCE(?diseaseNodeLabel, STR(?disease)) AS ?diseaseLabel)
  }
}
GROUP BY ?disease ?diseaseLabel
ORDER BY DESC(?recordCount) DESC(?biomarkerCount) ?diseaseLabel
LIMIT ${limit}
`;
    const { bindings } = await fetchSparql(q, opts);
    return bindings.map((b) => {
        const roles = (b.roles && b.roles.value) || "";
        return {
            disease: (b.disease && b.disease.value) || "",
            diseaseLabel: (b.diseaseLabel && b.diseaseLabel.value) || "",
            roles,
            roleList: splitPipe(roles),
            biomarkerCount: Number(b.biomarkerCount && b.biomarkerCount.value) || 0,
            recordCount: Number(b.recordCount && b.recordCount.value) || 0,
        };
    });
}
