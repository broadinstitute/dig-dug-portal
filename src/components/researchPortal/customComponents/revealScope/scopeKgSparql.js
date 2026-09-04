/**
 * CFDE REVEAL KG (digcfdekg) SPARQL client — Proto-OKN.
 * Endpoint: https://apps.okn.us/digcfdekg/sparql
 *
 * Self-contained (does not import from ../biomarkerNetwork/) even though that component
 * queries the same endpoint — keep SCOPE's product tree independent of CANVAS/biomarker
 * sibling products so neither breaks if the other is refactored.
 */

export const CFDE_KG_SPARQL_ENDPOINT = "https://apps.okn.us/digcfdekg/sparql";
export const CFDE_KG_GRAPH = "https://purl.org/okn/frink/kg/digcfdekg";

export const CFDE_KG_PREFIXES = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX reveal: <https://purl.org/okn/frink/kg/digcfdekg/schema/>
`;

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ bindings: Array<Record<string, { type: string, value: string }>>, raw: object }>}
 */
export async function fetchCfdeKgSparql(query, opts = {}) {
    const url = new URL(CFDE_KG_SPARQL_ENDPOINT);
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

export function sparqlEscape(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

export function sparqlNumber(binding) {
    if (!binding || binding.value == null || binding.value === "") return null;
    const n = Number(binding.value);
    return Number.isNaN(n) ? null : n;
}

export function sparqlString(binding) {
    return (binding && binding.value) || "";
}
