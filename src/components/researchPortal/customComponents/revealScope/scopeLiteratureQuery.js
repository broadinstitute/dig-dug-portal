import { createLLMClient } from "@/utils/llmClient";

const SYSTEM_PROMPT =
    "You convert a biological research hypothesis into several PubMed search queries. " +
    "Respond with strict JSON only:\n" +
    '{\n' +
    '  "terms": ["...", "..."],\n' +
    '  "queries": [\n' +
    '    {"label": "short facet label", "reason": "One sentence explaining the concept this search covers.", "query": "TERM1 AND TERM2"},\n' +
    '    {"label": "short facet label", "reason": "One sentence explaining the concept this search covers.", "query": "TERM1 AND TERM2 AND TERM3"}\n' +
    "  ]\n" +
    "}\n\n" +
    "Term rules:\n" +
    "1. Each term is a short individual concept (target gene/protein, cell line/tissue, biological " +
    "process/outcome, named drug/perturbation, or experimental condition) — 1-4 words, no full sentences.\n" +
    '2. Normalize to base biological entities (e.g. "SIRT1 knockdown" -> "SIRT1", "reduced OCR" -> "OCR").\n' +
    "3. Exclude comparator/control-group terms (scrambled shRNA, vehicle, wild-type control, empty vector).\n" +
    "4. Exclude directional/methodology verbs (reduces, increases, knockdown, knockout, overexpression).\n" +
    "5. Return 2 to 6 terms, most important first (primary target first).\n\n" +
    "Query rules (critical):\n" +
    "6. Do NOT join every term into one long AND query — that usually returns zero PubMed hits.\n" +
    "7. Produce 2 to 5 separate queries. Each query ANDs only 2 or 3 terms.\n" +
    "8. Cover different useful facets, for example:\n" +
    "   - primary target + related gene/pathway\n" +
    "   - primary target + drug/perturbation + readout/outcome\n" +
    "   - primary target + cell line/tissue\n" +
    "   - drug/perturbation + readout/outcome\n" +
    "9. Prefer combinations likely to retrieve papers over maximal specificity.\n" +
    "10. Each query string uses uppercase AND between terms.\n" +
    "11. For every query, `reason` must be exactly one plain sentence (about 8–20 words) stating the " +
    "biological concept or evidence facet that search is meant to retrieve — not a restatement of the " +
    "query terms alone, and not multiple sentences.\n" +
    "12. No explanation outside JSON.";

/**
 * Builds a few short AND-combinations from flat terms when the LLM omits `queries`
 * or returns an unusable list. Keeps each query to 2–3 terms.
 * @param {string[]} terms
 * @returns {Array<{label: string, reason: string, query: string}>}
 */
export function buildFallbackQueryCombinations(terms) {
    const unique = [];
    (terms || []).forEach((term) => {
        const value = String(term || "").trim();
        if (value && !unique.includes(value)) unique.push(value);
    });
    if (!unique.length) return [];
    if (unique.length === 1) {
        return [
            {
                label: "Primary term",
                reason: `Broad literature mentioning ${unique[0]} as the main biological entity.`,
                query: unique[0],
            },
        ];
    }
    if (unique.length === 2) {
        return [
            {
                label: "Combined terms",
                reason: `Papers linking ${unique[0]} with ${unique[1]}.`,
                query: `${unique[0]} AND ${unique[1]}`,
            },
        ];
    }

    const primary = unique[0];
    const rest = unique.slice(1);
    const queries = [];
    const push = (label, reason, parts) => {
        const query = parts.filter(Boolean).join(" AND ");
        if (!query || queries.some((item) => item.query === query)) return;
        queries.push({ label, reason, query });
    };

    // Primary + each secondary term (pairwise facets)
    rest.forEach((term) => {
        push(
            "Target + concept",
            `Evidence connecting ${primary} to ${term}.`,
            [primary, term]
        );
    });

    // A couple of 3-term facets that usually retrieve better than the full AND
    if (rest.length >= 2) {
        push(
            "Target + key concepts",
            `Focused search for ${primary} with ${rest[0]} and ${rest[rest.length - 1]}.`,
            [primary, rest[0], rest[rest.length - 1]]
        );
    }
    if (rest.length >= 3) {
        push(
            "Target + alternate concepts",
            `Alternate facet linking ${primary} with ${rest[1]} and ${rest[rest.length - 1]}.`,
            [primary, rest[1], rest[rest.length - 1]]
        );
    }

    return queries.slice(0, 5);
}

function normalizeQueryItems(rawQueries, terms) {
    const fromLlm = [];
    if (Array.isArray(rawQueries)) {
        rawQueries.forEach((item, index) => {
            if (typeof item === "string") {
                const query = item.trim();
                if (query) {
                    fromLlm.push({
                        label: `Search ${index + 1}`,
                        reason: "",
                        query,
                    });
                }
                return;
            }
            if (item && typeof item === "object") {
                const query = String(item.query || "").trim();
                if (!query) return;
                const label = String(item.label || `Search ${index + 1}`).trim() || `Search ${index + 1}`;
                const reason = String(item.reason || item.concept || "").trim();
                fromLlm.push({ label, reason, query });
            }
        });
    }
    if (fromLlm.length) return fromLlm;
    return buildFallbackQueryCombinations(terms);
}

/**
 * Extracts several short PubMed AND-queries from free-text hypothesis via LLM.
 * Resolves to `{ terms: string[], queries: Array<{label, reason, query}> }`.
 * Rejects on LLM/parse failure so the caller can fall back.
 */
export function extractLiteratureQuery(hypothesisText) {
    const client = createLLMClient({
        llm: "bedrock",
        system_prompt: SYSTEM_PROMPT,
        expectJson: true,
    });

    return new Promise((resolve, reject) => {
        client.sendPrompt({
            userPrompt: hypothesisText,
            onResponse: (raw) => {
                try {
                    const parsed = JSON.parse(raw);
                    const terms = Array.isArray(parsed && parsed.terms)
                        ? parsed.terms.map((term) => String(term).trim()).filter(Boolean)
                        : [];
                    const queries = normalizeQueryItems(parsed && parsed.queries, terms);
                    if (!queries.length) {
                        reject(new Error("Empty queries in LLM response"));
                        return;
                    }
                    resolve({ terms, queries });
                } catch (error) {
                    reject(error);
                }
            },
            onError: (error) => reject(error || new Error("Literature query extraction failed")),
        });
    });
}

/**
 * Normalize session/preloaded literature payload into editable query rows.
 * Accepts a legacy single string, an array of strings, or `{queries:[...]}`.
 * @param {unknown} value
 * @param {string} [fallbackText]
 * @returns {Array<{id: string, label: string, reason: string, query: string}>}
 */
export function normalizeLiteratureQueries(value, fallbackText = "") {
    const toRow = (item, index) => {
        if (typeof item === "string") {
            return {
                id: `q-${index}`,
                label: `Search ${index + 1}`,
                reason: "",
                query: item,
            };
        }
        return {
            id: `q-${index}`,
            label: String((item && item.label) || `Search ${index + 1}`),
            reason: String((item && (item.reason || item.concept)) || ""),
            query: String((item && item.query) || ""),
        };
    };

    if (value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.queries)) {
        return value.queries.map(toRow).filter((row) => row.query.trim());
    }
    if (Array.isArray(value)) {
        return value.map(toRow).filter((row) => row.query.trim());
    }
    if (typeof value === "string" && value.trim()) {
        return [{ id: "q-0", label: "Search 1", reason: "", query: value.trim() }];
    }
    const fallback = String(fallbackText || "").trim();
    return fallback ? [{ id: "q-0", label: "Search 1", reason: "", query: fallback }] : [];
}
