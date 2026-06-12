import {
    clearAssistantUsage,
    getAssistantUsageSummary,
    recordAssistantPlanUsage,
} from "../revealKgAssistantUsage.js";

function mockLocalStorage() {
    const store = new Map();
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        },
        removeItem(key) {
            store.delete(key);
        },
        clear() {
            store.clear();
        },
    };
}

describe("revealKgAssistantUsage", () => {
    beforeEach(() => {
        global.localStorage = mockLocalStorage();
        clearAssistantUsage();
    });

    it("records planner usage totals", () => {
        recordAssistantPlanUsage({
            usage: {
                prompt_tokens: 100,
                completion_tokens: 40,
                total_tokens: 140,
                estimated: false,
                source: "hugeamp",
            },
            model: "gpt-5-mini",
            outcome: "plan",
            duration_ms: 900,
        });

        const summary = getAssistantUsageSummary();
        expect(summary.totals.calls).toBe(1);
        expect(summary.totals.prompt_tokens).toBe(100);
        expect(summary.totals.completion_tokens).toBe(40);
        expect(summary.totals.total_tokens).toBe(140);
        expect(summary.totals.estimated_calls).toBe(0);
        expect(summary.recent[0]).toMatchObject({
            operation: "assist_plan",
            outcome: "plan",
            model: "gpt-5-mini",
            duration_ms: 900,
        });
    });

    it("tracks estimated calls separately", () => {
        recordAssistantPlanUsage({
            usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
                estimated: true,
                source: "estimate",
            },
            outcome: "clarify",
        });

        expect(getAssistantUsageSummary().totals.estimated_calls).toBe(1);
    });

    it("caps recent events at 50", () => {
        for (let i = 0; i < 55; i += 1) {
            recordAssistantPlanUsage({
                usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
                outcome: "plan",
            });
        }
        expect(getAssistantUsageSummary().recent).toHaveLength(50);
        expect(getAssistantUsageSummary().totals.calls).toBe(55);
    });
});
