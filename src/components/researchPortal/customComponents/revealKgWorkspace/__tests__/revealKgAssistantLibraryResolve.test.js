import { resolveAssistantLibraryGraph } from "../revealKgAssistantLibraryResolve.js";

const records = [
    { id: "g1", label: "Type 2 diabetes study" },
    { id: "g2", label: "Waist-hip ratio graph" },
];

describe("resolveAssistantLibraryGraph", () => {
    it("resolves by graph id", () => {
        expect(
            resolveAssistantLibraryGraph(records, { graphId: "g2" })
        ).toEqual(records[1]);
    });

    it("resolves by exact label", () => {
        expect(
            resolveAssistantLibraryGraph(records, { graphLabel: "Type 2 diabetes study" })
        ).toEqual(records[0]);
    });

    it("throws when label is missing", () => {
        expect(() => resolveAssistantLibraryGraph(records, {})).toThrow(
            /requires graph_label or graph_id/i
        );
    });

    it("throws when no graph matches", () => {
        expect(() =>
            resolveAssistantLibraryGraph(records, { graphLabel: "Missing graph" })
        ).toThrow(/no saved graph/i);
    });
});
