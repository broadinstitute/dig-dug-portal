import { resolveGeneEntryFailMode } from "../revealMqGeneEntryOrchestrator.js";

describe("resolveGeneEntryFailMode", () => {
    test("maps api / truthy values to api_error", () => {
        expect(resolveGeneEntryFailMode("api")).toBe("api_error");
        expect(resolveGeneEntryFailMode("1")).toBe("api_error");
        expect(resolveGeneEntryFailMode(true)).toBe("api_error");
        expect(resolveGeneEntryFailMode("yes")).toBe("api_error");
    });

    test("maps empty / insufficient to insufficient_data", () => {
        expect(resolveGeneEntryFailMode("empty")).toBe("insufficient_data");
        expect(resolveGeneEntryFailMode("insufficient_data")).toBe("insufficient_data");
    });

    test("ignores off / empty", () => {
        expect(resolveGeneEntryFailMode("")).toBe(null);
        expect(resolveGeneEntryFailMode("0")).toBe(null);
        expect(resolveGeneEntryFailMode("false")).toBe(null);
        expect(resolveGeneEntryFailMode(null)).toBe(null);
    });
});
