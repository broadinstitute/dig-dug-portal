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

export function extractUsageFromHugeampResponse(res, { llm } = {}) {
    if (!res || typeof res !== "object") {
        return null;
    }

    const row = Array.isArray(res.data) ? res.data[0] : null;
    const candidates = [
        row?.usage,
        row?.openai_usage,
        row?.token_usage,
        res.usage,
        res.token_usage,
    ];

    if (llm === "openai" && row?.openai_response && typeof row.openai_response === "object") {
        candidates.unshift(row.openai_response.usage);
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
