import {
    DEFAULT_LLM,
    extractHugeampResponseText,
    llmEndpointUrl,
} from "@/utils/llmClient.js";

describe("llmClient bedrock defaults", () => {
    test("defaults to bedrock endpoint", () => {
        expect(DEFAULT_LLM).toBe("bedrock");
        expect(llmEndpointUrl("bedrock")).toBe("https://llm.hugeamp.org/bedrock");
        expect(llmEndpointUrl("openai")).toBe("https://llm.hugeamp.org/openai");
    });

    test("extractHugeampResponseText reads bedrock_response strings", () => {
        const text = extractHugeampResponseText("bedrock", {
            data: [{ bedrock_response: "GWAS is a genome-wide association study." }],
        });
        expect(text).toBe("GWAS is a genome-wide association study.");
    });

    test("extractHugeampResponseText still reads openai_response", () => {
        const text = extractHugeampResponseText("openai", {
            data: [
                {
                    openai_response: {
                        choices: [{ message: { content: "openai says hi" } }],
                    },
                },
            ],
        });
        expect(text).toBe("openai says hi");
    });
});
