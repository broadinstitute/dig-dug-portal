import {
    classifyProvenanceNodeRoles,
    labelPlacementForRole,
    provenanceDisplayLabel,
    provenanceLayoutSpacing,
    provenanceNodeDimensions,
} from "../revealKgGeneSetProvenanceViz.js";

describe("revealKgGeneSetProvenanceViz", () => {
    it("classifies source, analysis, and output roles from edges", () => {
        const nodes = [
            { id: "f1", type: "File" },
            { id: "a1", type: "AnalysisType" },
            { id: "f2", type: "File" },
            { id: "g1", type: "GeneSet" },
        ];
        const edges = [
            { source: "f1", target: "a1", label: "data input" },
            { source: "a1", target: "f2", label: "data output" },
            { source: "a1", target: "g1", label: "data output" },
        ];
        expect(classifyProvenanceNodeRoles(nodes, edges)).toEqual({
            f1: "source",
            a1: "analysis",
            f2: "output",
            g1: "output",
        });
    });

    it("maps roles to label placement", () => {
        expect(labelPlacementForRole("source")).toBe("left");
        expect(labelPlacementForRole("analysis")).toBe("below");
        expect(labelPlacementForRole("bridge")).toBe("below");
        expect(labelPlacementForRole("output")).toBe("right");
    });

    it("sizes nodes to the dot for correct edge arrow placement", () => {
        const dims = provenanceNodeDimensions("very long label name here", "right", 9);
        expect(dims).toEqual({ width: 18, height: 18 });
    });

    it("tightens spacing for larger graphs", () => {
        expect(provenanceLayoutSpacing(9).nodeSpacing).toBeLessThan(provenanceLayoutSpacing(3).nodeSpacing);
        expect(provenanceLayoutSpacing(3).nodeSpacing).toBe(45);
        expect(provenanceLayoutSpacing(14).nodeSpacing).toBe(27);
    });

    it("truncates middle-step labels more aggressively than side labels", () => {
        const longName = "generate_8d7e23421926852cf326309c";
        expect(provenanceDisplayLabel(longName, "below")).toBe("generate_8d7e234219…");
        expect(provenanceDisplayLabel(longName, "left").length).toBe(28);
    });
});
