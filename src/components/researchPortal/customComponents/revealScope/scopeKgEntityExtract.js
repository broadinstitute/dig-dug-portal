/**
 * Lightweight LLM extract for Search CFDE KG (free text / multi-entity).
 * Evaluation-style target + outcome/mechanism slots — no rubric or full Module A scoring.
 */

import { createLLMClient } from "@/utils/llmClient";

const SYSTEM_PROMPT =
    "You extract the CFDE knowledge-graph query entities from free text (a hypothesis, " +
    "research interest, or list of selected genes/mechanisms).\n\n" +
    "Respond with strict JSON only, matching exactly this shape:\n" +
    "{\n" +
    '  "target": {"value": string|null, "resolved_id": string|null},\n' +
    '  "outcome": {"value": string|null, "resolved_id": string|null, "factor_search_query": string|null}\n' +
    "}\n\n" +
    "Definitions:\n" +
    "- target: a specific gene or protein. Prefer the official HGNC symbol in resolved_id " +
    '(e.g. value "PD-1" -> resolved_id "PDCD1"). If several genes are named, use the primary ' +
    "one most central to the claim (or the first clear gene). null if none.\n" +
    "- outcome: the measured phenotype, disease, or biological mechanism/process side of the " +
    "claim (not the gene). Put a short disease/phenotype name in resolved_id when clear.\n" +
    "- factor_search_query: outcome only. A short 3–4 word phrase for semantic Factor search " +
    '(e.g. "T cell exhaustion", "proximal tubule transport"). No gene symbols. null if outcome is null.\n\n' +
    "Rules:\n" +
    "1. Do not invent entities not present or clearly implied.\n" +
    "2. If the text is only a gene symbol (or only genes), set outcome fields to null.\n" +
    "3. If the text is only a mechanism/pathway/disease with no gene, set target fields to null.\n" +
    "4. No explanation outside the JSON. No markdown.";

function normalizeEntitySlot(slot) {
    if (!slot || typeof slot !== "object") {
        return { value: null, resolvedId: null };
    }
    const value = typeof slot.value === "string" && slot.value.trim() ? slot.value.trim() : null;
    const resolvedId =
        typeof slot.resolved_id === "string" && slot.resolved_id.trim()
            ? slot.resolved_id.trim()
            : typeof slot.resolvedId === "string" && slot.resolvedId.trim()
              ? slot.resolvedId.trim()
              : null;
    return { value, resolvedId };
}

function normalizeOutcomeEntity(slot) {
    const base = normalizeEntitySlot(slot);
    if (!slot || typeof slot !== "object") {
        return { ...base, factorSearchQuery: null };
    }
    const fromSnake =
        typeof slot.factor_search_query === "string" && slot.factor_search_query.trim()
            ? slot.factor_search_query.trim()
            : null;
    const fromCamel =
        typeof slot.factorSearchQuery === "string" && slot.factorSearchQuery.trim()
            ? slot.factorSearchQuery.trim()
            : null;
    return { ...base, factorSearchQuery: fromSnake || fromCamel };
}

export function normalizeKgEntityExtract(parsed) {
    return {
        target: normalizeEntitySlot(parsed && parsed.target),
        outcome: normalizeOutcomeEntity(parsed && parsed.outcome),
    };
}

export function emptyKgEntityExtract() {
    return {
        target: { value: null, resolvedId: null },
        outcome: { value: null, resolvedId: null, factorSearchQuery: null },
    };
}

/**
 * @param {string} text
 * @returns {Promise<{ target: object, outcome: object, extractError: Error|null }>}
 */
export function extractKgSearchEntities(text) {
    const userPrompt = typeof text === "string" ? text.trim() : "";
    if (!userPrompt) {
        return Promise.resolve({
            ...emptyKgEntityExtract(),
            extractError: new Error("No text provided."),
        });
    }

    const client = createLLMClient({
        llm: "bedrock",
        system_prompt: SYSTEM_PROMPT,
        expectJson: true,
    });

    return new Promise((resolve) => {
        client.sendPrompt({
            userPrompt,
            onResponse: (raw) => {
                try {
                    const parsed = JSON.parse(raw);
                    resolve({ ...normalizeKgEntityExtract(parsed), extractError: null });
                } catch (error) {
                    resolve({
                        ...emptyKgEntityExtract(),
                        extractError: error || new Error("KG entity parse failed."),
                    });
                }
            },
            onError: (error) => {
                resolve({
                    ...emptyKgEntityExtract(),
                    extractError: error || new Error("KG entity extraction failed."),
                });
            },
        });
    });
}
