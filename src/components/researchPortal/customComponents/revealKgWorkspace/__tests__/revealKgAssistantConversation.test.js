import {
    buildConversationPromptSection,
    normalizeConversationTurns,
    summarizePlanForConversation,
} from "../revealKgAssistantConversation.js";

describe("normalizeConversationTurns", () => {
    it("keeps the last 12 non-empty turns", () => {
        const turns = Array.from({ length: 14 }, (_, index) => ({
            role: index % 2 === 0 ? "user" : "assistant",
            text: `turn-${index}`,
        }));
        expect(normalizeConversationTurns(turns)).toHaveLength(12);
        expect(normalizeConversationTurns(turns)[0].text).toBe("turn-2");
    });
});

describe("summarizePlanForConversation", () => {
    it("summarizes prior plan steps", () => {
        expect(
            summarizePlanForConversation({
                summary: "Filter then expand",
                steps: [
                    { label: "Filter genes" },
                    { label: "Expand graph" },
                ],
            })
        ).toEqual({
            summary: "Filter then expand",
            steps: ["1. Filter genes", "2. Expand graph"],
        });
    });
});

describe("buildConversationPromptSection", () => {
    it("includes prior turns and the last plan", () => {
        const section = buildConversationPromptSection({
            conversation: [
                { role: "user", text: "Filter insulin resistance genes" },
                { role: "assistant", text: "Built a 2-step plan." },
                { role: "user", text: "Now explain those" },
            ],
            lastPlan: {
                summary: "Filter and select",
                steps: [{ label: "Filter genes" }],
            },
        });
        expect(section).toMatch(/Prior conversation/);
        expect(section).toMatch(/Filter insulin resistance genes/);
        expect(section).toMatch(/Last executed or proposed plan/);
        expect(section).not.toMatch(/Now explain those/);
    });
});
