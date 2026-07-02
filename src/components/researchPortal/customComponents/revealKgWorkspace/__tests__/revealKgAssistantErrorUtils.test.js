import {
    formatAssistantStepError,
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
        expect(formatted.resolution).toContain("novel only");
        expect(formatted.resolution).toContain("Run on this step");
        expect(formatted.stepLabel).toBe("Fetch novel pathways");
    });

    test("formatAssistantStepError adds resolution for filter build criteria", () => {
        const formatted = formatAssistantStepError(
            new Error("Add expression, novelty, or intent criteria before building a filter."),
            { action: "filter_graph", label: "Build a novelty filter" }
        );
        expect(formatted.resolution).toContain("novel only");
    });
});
