import {
    formatAssistantStepError,
    isRetriableAssistantError,
    sanitizeAssistantError,
} from "../revealKgAssistantErrorUtils.js";

describe("revealKgAssistantErrorUtils", () => {
    test("sanitizeAssistantError shortens noisy server errors", () => {
        expect(sanitizeAssistantError(new Error("No new connections matched that request."))).toBe(
            "No new connections matched that request."
        );
    });

    test("formatAssistantStepError adds resolution for empty expand results", () => {
        const formatted = formatAssistantStepError(
            new Error("No new connections matched that request."),
            {
                action: "expand_graph",
                label: "Fetch novel pathways",
                options: { target_type: "factor" },
            }
        );
        expect(formatted.message).toContain("No new connections matched");
        expect(formatted.resolution).toContain("show known and novel nodes");
        expect(formatted.resolution).toContain("Run to retry");
        expect(formatted.stepLabel).toBe("Fetch novel pathways");
    });

    test("formatAssistantStepError adds resolution for filter build criteria", () => {
        const formatted = formatAssistantStepError(
            new Error("Add expression, novelty, or intent criteria before building a filter."),
            { action: "filter_graph", label: "Build a novelty filter" }
        );
        expect(formatted.resolution).toContain("show novel nodes only");
    });
});

describe("isRetriableAssistantError", () => {
    it("treats upstream gateway/server errors as retriable", () => {
        expect(isRetriableAssistantError(new Error("Request failed with status 502 Bad Gateway"))).toBe(true);
        expect(isRetriableAssistantError(new Error("503 Service Unavailable"))).toBe(true);
        expect(isRetriableAssistantError(new Error("Internal Server Error"))).toBe(true);
    });

    it("treats timeouts and network failures as retriable", () => {
        expect(isRetriableAssistantError(new Error("Request timed out"))).toBe(true);
        expect(isRetriableAssistantError(new Error("ECONNRESET"))).toBe(true);
        expect(isRetriableAssistantError(new Error("Failed to fetch"))).toBe(true);
    });

    it("treats empty-result outcomes as retriable", () => {
        expect(isRetriableAssistantError(new Error("No relevant trait–gene set pairs found."))).toBe(true);
    });

    it("does not retry precondition or user-state errors", () => {
        expect(isRetriableAssistantError(new Error("Mark one or more genes as selected on the canvas before finding related datasets."))).toBe(false);
        expect(isRetriableAssistantError(new Error("add_nodes_by_intent requires a research intention."))).toBe(false);
        expect(isRetriableAssistantError(new Error('"BRCA1" is already on the graph.'))).toBe(false);
        expect(isRetriableAssistantError(new Error("CFDE dataset search API is not configured."))).toBe(false);
    });

    it("does not retry validation errors", () => {
        expect(isRetriableAssistantError(new Error('Step 1 uses unsupported action "foo".'))).toBe(false);
        expect(isRetriableAssistantError(new Error("node_types must be an array."))).toBe(false);
    });

    it("returns false for empty input", () => {
        expect(isRetriableAssistantError(null)).toBe(false);
        expect(isRetriableAssistantError(new Error(""))).toBe(false);
    });
});
