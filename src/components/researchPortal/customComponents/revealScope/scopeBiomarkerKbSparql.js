/**
 * BiomarkerKB SPARQL client — Proto-OKN. Different graph/schema from the CFDE REVEAL
 * KG (plain direct triples, not RDF reification). Self-contained (does not import
 * biomarkerNetwork/biomarkerKbSparql.js) so SCOPE's product tree stays independent
 * of that sibling component — but the query shape below is a deliberate, faithful port
 * of that sibling's `listBiomarkersForMondoDiseases` (the function its UI actually uses),
 * not a fresh reinterpretation: an earlier version of this file queried the wrong node
 * for the biomarker's display label (see the 2026-09-04 ARCHITECTURE.md changelog entry)
 * and produced long natural-language sentences instead of clean names. Live-verified this
 * traversal against the real endpoint before trusting it again.
 *
 * Endpoint: https://apps.okn.us/biomarkerkg/sparql
 *
 * Schema note (confirmed live): a `?biomarkerRecord` node (e.g. "Increased expression of
 * gene APOA1/NCBI:335") is a reified assertion — it links to a `?disease` via one of the
 * four disease-relation predicates below, AND separately links to the actual `?biomarker`
 * entity node (e.g. the APOA1 gene, or a dbSNP rsID node) via one of four "entityRelation"
 * predicates. The entity node's own `rdfs:label` is the clean display name; the record
 * node's `rdfs:label` is the long sentence. These are genuinely different KG-stored labels,
 * not a client-side string-parsing distinction.
 *
 * Also confirmed live: one biomarkerRecord can link (via entityRelation) to several
 * different, only loosely-related biomarker entities — e.g. the APOA1-expression record
 * above also links to interferon gamma and interleukin 17A entities. This is a real
 * modeling looseness in the KG itself (tolerated as-is by biomarkerNetwork.vue, which this
 * file mirrors), not a bug in this query.
 */

export const BIOMARKER_KG_SPARQL_ENDPOINT = "https://apps.okn.us/biomarkerkg/sparql";
export const BIOMARKER_KG_GRAPH = "https://purl.org/okn/frink/kg/biomarkerkg";

const PREFIXES = `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX obci: <http://purl.obolibrary.org/obo/OBCI_>
`;

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ bindings: Array<Record<string, { type: string, value: string }>>, raw: object }>}
 */
export async function fetchBiomarkerKbSparql(query, opts = {}) {
    const url = new URL(BIOMARKER_KG_SPARQL_ENDPOINT);
    url.searchParams.set("query", query);
    const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/sparql-results+json" },
        signal: opts.signal,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Biomarker KB SPARQL HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
    const raw = await res.json();
    return { bindings: (raw.results && raw.results.bindings) || [], raw };
}

function toIriTerm(iri) {
    const value = String(iri || "").trim();
    if (!/^https?:\/\/[^\s<>"]+$/i.test(value)) return "";
    return `<${value}>`;
}

function splitPipe(value) {
    return String(value || "")
        .split(" | ")
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Clean display name for a biomarker row — mirrors `biomarkerNetwork.vue`'s
 * `biomarkerDisplayLabel()` exactly: when the entity node has no `rdfs:label` of its own
 * (confirmed live: true for dbSNP rsID entities), the query's `COALESCE` falls back to the
 * entity's bare IRI as the label, which is not human-readable — fall back further to the
 * IRI's last path segment (`biomarkerIdentifier`, e.g. "rs10063294") in that case.
 */
export function biomarkerDisplayLabel(row) {
    const label = (row && row.biomarkerLabel) || "";
    if (/^https?:\/\//i.test(label)) {
        return (row && row.biomarkerIdentifier) || label;
    }
    return label || (row && row.biomarkerIdentifier) || "—";
}

/**
 * Result cap for the whole batched query below — matches `biomarkerNetwork.vue`'s own
 * `BIOMARKER_LIMIT` exactly: one shared `LIMIT` across *all* candidate diseases combined
 * (queried together via one `VALUES ?disease {...}` block), not a per-disease cap. No
 * score/weight field exists in this KG to rank candidates by — results are ordered by how
 * many of the candidate diseases each biomarker touches, then by record count, and can
 * still be truncated for a large enough candidate disease set (confirmed live: colorectal
 * cancer alone has 10,000+ rows; MONDO_0005301 alone has 373). The UI layer
 * (`ScopeBiomarkerEvidenceTable.vue`) is responsible for paginating and surfacing a
 * "truncated at limit" notice when this cap is hit, the same way `biomarkerNetwork.vue` does.
 */
export const BIOMARKER_KB_FETCH_LIMIT = 100;

/**
 * Lists biomarkers linked to any of the given disease IRIs in one batched query, grouped by
 * biomarker **entity** (not by record and not by role) with roles/genes/diseases aggregated
 * per entity — a faithful port of `biomarkerNetwork/biomarkerKbSparql.js`'s
 * `listBiomarkersForMondoDiseases` (the function its UI actually imports and uses).
 *
 * @param {string[]} diseaseIris
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{
 *   biomarker: string,
 *   biomarkerIdentifier: string,
 *   biomarkerLabel: string,
 *   displayLabel: string,
 *   diseaseCount: number,
 *   recordCount: number,
 *   diseases: string,
 *   diseaseList: string[],
 *   roles: string,
 *   roleList: string[],
 *   genes: string,
 *   geneList: string[],
 * }>>}
 */
export async function listBiomarkersForDiseases(diseaseIris, opts = {}) {
    const terms = (Array.isArray(diseaseIris) ? diseaseIris : [diseaseIris]).map(toIriTerm).filter(Boolean);
    if (!terms.length) return [];
    const limit = Math.max(1, Number(opts.limit) || BIOMARKER_KB_FETCH_LIMIT);
    const q = `${PREFIXES}
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
    const { bindings } = await fetchBiomarkerKbSparql(q, opts);
    return bindings.map((b) => {
        const diseases = (b.diseases && b.diseases.value) || "";
        const roles = (b.roles && b.roles.value) || "";
        const genes = (b.genes && b.genes.value) || "";
        const geneList = splitPipe(genes);
        const row = {
            biomarker: (b.biomarker && b.biomarker.value) || "",
            biomarkerIdentifier: (b.biomarkerIdentifier && b.biomarkerIdentifier.value) || "",
            biomarkerLabel: (b.biomarkerLabel && b.biomarkerLabel.value) || "",
            diseaseCount: Number(b.diseaseCount && b.diseaseCount.value) || 0,
            recordCount: Number(b.recordCount && b.recordCount.value) || 0,
            diseases,
            diseaseList: splitPipe(diseases),
            roles,
            roleList: splitPipe(roles),
            genes: geneList.join(" | "),
            geneList,
        };
        return { ...row, displayLabel: biomarkerDisplayLabel(row) };
    });
}
