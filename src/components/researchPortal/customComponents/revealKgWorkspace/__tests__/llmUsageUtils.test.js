import {
    extractOpenAiResponseText,
    extractUsageFromHugeampResponse,
    normalizeOpenAiUsage,
    resolveLlmUsage,
} from "@/utils/llmUsageUtils.js";

describe("llmUsageUtils", () => {
    it("normalizes OpenAI usage objects", () => {
        expect(normalizeOpenAiUsage({ prompt_tokens: 100, completion_tokens: 50 })).toEqual({
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
        });
    });

    it("extracts usage from hugeamp data[0].usage", () => {
        const usage = extractUsageFromHugeampResponse(
            {
                data: [
                    {
                        openai_response: '{"type":"plan"}',
                        usage: { prompt_tokens: 200, completion_tokens: 80, total_tokens: 280 },
                    },
                ],
            },
            { llm: "openai" }
        );
        expect(usage).toEqual({
            prompt_tokens: 200,
            completion_tokens: 80,
            total_tokens: 280,
            estimated: false,
            source: "hugeamp",
        });
    });

    it("extracts text from chat completion shaped openai_response", () => {
        expect(
            extractOpenAiResponseText({
                choices: [{ message: { content: '{"type":"plan"}' } }],
            })
        ).toBe('{"type":"plan"}');
    });

    it("estimates usage when hugeamp omits token fields", () => {
        const usage = resolveLlmUsage({
            res: { data: [{ openai_response: "hello world" }] },
            llm: "openai",
            model: "gpt-5-mini",
            systemPrompt: "system",
            userPrompt: "user prompt",
            responseText: "hello world",
        });
        expect(usage.estimated).toBe(true);
        expect(usage.source).toBe("estimate");
        expect(usage.model).toBe("gpt-5-mini");
        expect(usage.total_tokens).toBeGreaterThan(0);
    });
});
