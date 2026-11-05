import { tryParseJsonWithRepair } from "@/utils/llmJsonRepair.js";

/** Parse or estimate token usage from hugeamp LLM passthrough responses. */

function coerceTokenCount(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function normalizeOpenAiUsage(raw) {
    if (!raw || typeof raw !== "object") {
        return null;
    }
    const prompt_tokens = coerceTokenCount(raw.prompt_tokens);
    const completion_tokens = coerceTokenCount(raw.completion_tokens);
    let total_tokens = coerceTokenCount(raw.total_tokens);
    if (total_tokens == null && prompt_tokens != null && completion_tokens != null) {
        total_tokens = prompt_tokens + completion_tokens;
    }
    if (prompt_tokens == null && completion_tokens == null && total_tokens == null) {
        return null;
    }
    return { prompt_tokens, completion_tokens, total_tokens };
}

export function extractOpenAiResponseText(data) {
    if (typeof data === "string") {
        return data;
    }
    if (data && typeof data === "object") {
        const content = data.choices?.[0]?.message?.content;
        if (typeof content === "string") {
            return content;
        }
        if (typeof data.content === "string") {
            return data.content;
        }
        if (typeof data.text === "string") {
            return data.text;
        }
    }
    return data != null ? String(data) : "";
}

export function stripLlmJsonFences(rawString) {
    let s = String(rawString || "").trim();
    if (!s) return "";
    const fenced = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenced) return String(fenced[1] || "").trim();
    // Truncated fence (opening ```json but no closing ```) — common when max tokens cut off.
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return s;
}

/**
 * After a gateway `responsePrefix: "{"` (or similar prefill), Claude may continue
 * without repeating `{`. Strip fences and ensure a leading `{` when needed.
 */
export function normalizeForcedJsonReply(rawString) {
    let s = stripLlmJsonFences(rawString);
    if (!s) return "";
    const trimmed = s.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;
    // Continuation after a prefilled `{` — e.g. `"phenotype_terms": [] ... }`
    if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
        return `{${trimmed}`;
    }
    return trimmed;
}

/**
 * Extract and parse JSON from an LLM string response.
 * Tolerates markdown fences and leading/trailing prose around a top-level object.
 * Does not salvage truncated objects by picking a nested array fragment.
 */
export function parseLlmJsonResponse(rawString) {
    let cleanString = normalizeForcedJsonReply(rawString);
    if (!cleanString) {
        return { ok: false, json: null, parseError: new Error("Empty LLM response") };
    }

    const objectStart = cleanString.indexOf("{");
    const arrayStart = cleanString.indexOf("[");
    const prefersObject =
        objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart);
    const prefersArray =
        arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart);

    let candidate = cleanString;
    if (prefersObject) {
        const objectEnd = cleanString.lastIndexOf("}");
        if (objectEnd > objectStart) {
            candidate = cleanString.slice(objectStart, objectEnd + 1);
        } else {
            // Truncated object (opened `{` but no closing `}`).
            return {
                ok: false,
                json: null,
                parseError: new Error("Truncated JSON object"),
            };
        }
    } else if (prefersArray) {
        const arrayEnd = cleanString.lastIndexOf("]");
        if (arrayEnd > arrayStart) {
            candidate = cleanString.slice(arrayStart, arrayEnd + 1);
        } else {
            return {
                ok: false,
                json: null,
                parseError: new Error("Truncated JSON array"),
            };
        }
    }

    try {
        return { ok: true, json: JSON.parse(candidate), repaired: false, repairs: [] };
    } catch (e) {
        const repaired = tryParseJsonWithRepair(candidate);
        if (repaired.ok) {
            return {
                ok: true,
                json: repaired.json,
                repaired: repaired.repaired,
                repairs: repaired.repairs,
            };
        }
        return {
            ok: false,
            json: null,
            parseError: repaired.parseError || e,
            repaired: repaired.repaired,
            repairs: repaired.repairs || [],
        };
    }
}

/** True when text looks like a JSON payload (fenced or bare object/array). */
export function looksLikeJsonText(rawString) {
    const trimmed = String(rawString || "").trim();
    if (/^```(?:json)?/i.test(trimmed)) return true;
    const s = stripLlmJsonFences(trimmed);
    return s.startsWith("{") || s.startsWith("[");
}

/**
 * True when text is usable as an LLM result.
 * JSON-shaped (or fenced) text must parse.
 */
export function isViableLlmText(rawString, { requireJson = false } = {}) {
    const raw = String(rawString || "");
    if (!raw.trim()) return false;
    const normalized = normalizeForcedJsonReply(raw);
    if (requireJson || looksLikeJsonText(raw) || looksLikeJsonText(normalized)) {
        return parseLlmJsonResponse(normalized).ok;
    }
    return true;
}

export function extractUsageFromHugeampResponse(res, { llm } = {}) {
    if (!res || typeof res !== "object") {
        return null;
    }

    const row = Array.isArray(res.data) ? res.data[0] : null;
    const candidates = [
        row?.usage,
        row?.openai_usage,
        row?.token_usage,
        row?.bedrock_usage,
        res.usage,
        res.token_usage,
    ];

    if (llm === "openai" && row?.openai_response && typeof row.openai_response === "object") {
        candidates.unshift(row.openai_response.usage);
    }
    if (llm === "bedrock" && row?.bedrock_response && typeof row.bedrock_response === "object") {
        candidates.unshift(row.bedrock_response.usage);
    }

    for (const candidate of candidates) {
        const normalized = normalizeOpenAiUsage(candidate);
        if (normalized) {
            return {
                ...normalized,
                estimated: false,
                source: "hugeamp",
            };
        }
    }

    return null;
}

export function estimateTokenUsageFromText({
    systemPrompt = "",
    userPrompt = "",
    responseText = "",
    model = null,
} = {}) {
    const promptChars = String(systemPrompt).length + String(userPrompt).length;
    const completionChars = String(responseText).length;
    const prompt_tokens = Math.ceil(promptChars / 4);
    const completion_tokens = Math.ceil(completionChars / 4);

    return {
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
        estimated: true,
        source: "estimate",
        model,
    };
}

export function resolveLlmUsage({
    res,
    llm,
    model,
    systemPrompt,
    userPrompt,
    responseText,
}) {
    const fromApi = extractUsageFromHugeampResponse(res, { llm });
    if (fromApi) {
        return { ...fromApi, model: model || null };
    }
    return estimateTokenUsageFromText({
        systemPrompt,
        userPrompt,
        responseText,
        model,
    });
}
