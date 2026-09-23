import { match } from "@/utils/bioIndexUtils";
import { searchBiomarkerFactors } from "@/components/researchPortal/customComponents/revealScope/scopeBiomarkerFactorSearch.js";

const GENE_TOKEN_RE = /^[A-Za-z][A-Za-z0-9-]{1,14}$/;

/**
 * @param {string} needle
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{ kind: "gene", id: string, label: string, raw: object|string }>>}
 */
export async function searchGenes(needle, opts = {}) {
    const q = String(needle || "").trim();
    if (q.length < 2) return [];

    const limit = Math.max(1, Math.min(25, Number(opts.limit) || 10));
    const rows = await match("gene", q, { limit });
    const out = [];
    const seen = new Set();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
        const label = extractGeneLabel(row);
        if (!label) return;
        const id = label.toUpperCase();
        if (seen.has(id)) return;
        seen.add(id);
        out.push({ kind: "gene", id, label: id, raw: row });
    });
    return out;
}

/**
 * Mechanism / Factor semantic search (SCOPE kc-factors-all pgvector).
 *
 * @param {string} needle
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{ kind: "mechanism", id: string, label: string, factor: string, cfdeDisease: string, score: number|null, raw: object }>>}
 */
export async function searchMechanisms(needle, opts = {}) {
    const q = String(needle || "").trim();
    if (q.length < 2) return [];

    const rows = await searchBiomarkerFactors(q, {
        limit: opts.limit || 10,
        signal: opts.signal,
    });
    return rows.map((row) => ({
        kind: "mechanism",
        id: row.iri || String(row.id),
        label: row.label || row.factor,
        factor: row.factor,
        cfdeDisease: row.cfdeDisease,
        score: row.score,
        raw: row,
    }));
}

export function extractGeneLabel(row) {
    if (row == null) return "";
    if (typeof row === "string") return row.trim();
    if (typeof row === "object") {
        for (const key of ["gene", "symbol", "name", "id"]) {
            if (row[key] != null && String(row[key]).trim()) {
                return String(row[key]).trim();
            }
        }
    }
    return "";
}

/**
 * Classify free-text query for routing.
 * - gene: whole query is a gene symbol
 * - mechanism: no confirmed gene token
 * - gene+mechanism: confirmed gene token + additional text → routes to mechanism search
 *
 * Gene tokens are confirmed via BioIndex suggestion matches (not bare token shape),
 * except when the whole query is a single gene-like token.
 *
 * @param {string} query
 * @param {Array<{ id: string, label: string }>} [geneSuggestions]
 * @returns {{ mode: "gene"|"mechanism"|"gene+mechanism", gene: string|null, mechanismQuery: string, searchType: "gene"|"mechanism" }}
 */
export function classifySearchQuery(query, geneSuggestions = []) {
    const text = String(query || "").trim();
    if (!text) {
        return { mode: "mechanism", gene: null, mechanismQuery: "", searchType: "mechanism" };
    }

    const geneIds = new Set(
        (geneSuggestions || []).map((g) => String(g.id || g.label || "").toUpperCase()).filter(Boolean)
    );

    const tokens = text.split(/\s+/).filter(Boolean);
    const first = tokens[0] || "";
    const firstUpper = first.toUpperCase();
    const wholeUpper = text.toUpperCase();

    if (tokens.length === 1 && (geneIds.has(wholeUpper) || GENE_TOKEN_RE.test(first))) {
        return {
            mode: "gene",
            gene: firstUpper,
            mechanismQuery: "",
            searchType: "gene",
        };
    }

    // Multi-token: only treat first token as a gene when BioIndex suggested it.
    if (tokens.length > 1 && geneIds.has(firstUpper)) {
        const mechanismQuery = tokens.slice(1).join(" ").trim() || text;
        return {
            mode: "gene+mechanism",
            gene: firstUpper,
            mechanismQuery,
            searchType: "mechanism",
        };
    }

    return {
        mode: "mechanism",
        gene: null,
        mechanismQuery: text,
        searchType: "mechanism",
    };
}

/**
 * Run the routed search for a classified query.
 * @returns {Promise<{ searchType: "gene"|"mechanism", mode: string, gene: string|null, query: string, results: object[] }>}
 */
export async function runRoutedSearch(query, opts = {}) {
    const geneSuggestions = opts.geneSuggestions || (await searchGenes(query, { limit: 10 }));
    const classified = classifySearchQuery(query, geneSuggestions);

    if (classified.searchType === "gene") {
        const results = await searchGenes(classified.gene || query, {
            limit: opts.limit || 10,
            signal: opts.signal,
        });
        return {
            searchType: "gene",
            mode: classified.mode,
            gene: classified.gene,
            query: String(query || "").trim(),
            results,
        };
    }

    const mechanismNeedle = classified.mechanismQuery || String(query || "").trim();
    const results = await searchMechanisms(mechanismNeedle, {
        limit: opts.limit || 10,
        signal: opts.signal,
    });
    return {
        searchType: "mechanism",
        mode: classified.mode,
        gene: classified.gene,
        query: mechanismNeedle,
        results,
    };
}
