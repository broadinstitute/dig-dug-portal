import { createLLMClient } from "@/utils/llmClient";

const SYSTEM_PROMPT =
    "You convert a biological research hypothesis into a PubMed search query. " +
    'Respond with strict JSON only: {"terms": ["...", "..."]}. Each entry must be a short ' +
    "individual concept (target gene/protein, cell line/tissue, biological process/outcome, " +
    "or a named experimental condition) — 1-3 words, no full sentences.\n\n" +
    "Rules:\n" +
    "1. Normalize each term to its base biological entity (e.g. \"SIRT1 knockdown\" -> \"SIRT1\", " +
    '"reduced OCR" -> "OCR").\n' +
    "2. Exclude comparator/control-group terms (e.g. scrambled shRNA, vehicle, wild-type control, " +
    "empty vector, scramble).\n" +
    "3. Exclude directional or causal verbs and methodology descriptors (e.g. reduces, increases, " +
    "knockdown, knockout, overexpression, compared to) — keep only the entity they act on.\n" +
    "4. Return 2 to 5 terms, most important first. No boolean operators, no explanation.";

/**
 * Extracts a concise, individually-mappable PubMed query from free-text hypothesis via LLM.
 * Terms are combined with AND so PubMed's automatic term mapping resolves each one
 * separately instead of failing to match one long phrase. Resolves to the query string;
 * rejects on LLM/parse failure so the caller can fall back.
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
                    if (!terms.length) {
                        reject(new Error("Empty terms in LLM response"));
                        return;
                    }
                    resolve(terms.join(" AND "));
                } catch (error) {
                    reject(error);
                }
            },
            onError: (error) => reject(error || new Error("Literature query extraction failed")),
        });
    });
}
