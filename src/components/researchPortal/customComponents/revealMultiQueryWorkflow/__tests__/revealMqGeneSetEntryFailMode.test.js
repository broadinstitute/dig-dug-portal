import { resolveGeneSetEntryFailMode } from "../revealMqGeneSetEntryOrchestrator.js";

describe("resolveGeneSetEntryFailMode", () => {
    test("maps api / truthy values to api_error", () => {
        expect(resolveGeneSetEntryFailMode("api")).toBe("api_error");
        expect(resolveGeneSetEntryFailMode("1")).toBe("api_error");
        expect(resolveGeneSetEntryFailMode(true)).toBe("api_error");
        expect(resolveGeneSetEntryFailMode("yes")).toBe("api_error");
    });

    test("maps empty / insufficient to insufficient_data", () => {
        expect(resolveGeneSetEntryFailMode("empty")).toBe("insufficient_data");
        expect(resolveGeneSetEntryFailMode("insufficient_data")).toBe("insufficient_data");
    });

    test("ignores off / empty", () => {
        expect(resolveGeneSetEntryFailMode("")).toBe(null);
        expect(resolveGeneSetEntryFailMode("0")).toBe(null);
        expect(resolveGeneSetEntryFailMode("false")).toBe(null);
        expect(resolveGeneSetEntryFailMode(null)).toBe(null);
    });
});
