import {
    DEFAULT_CANVAS_INTERACTIVE_MODEL,
    canvasModelCapabilities,
    normalizeCanvasInteractiveModel,
    parseCanvasInteractiveModelFromLocation,
} from "../revealKgCanvasModel.js";

describe("revealKgCanvasModel", () => {
    it("defaults to cfde when model is missing", () => {
        expect(
            parseCanvasInteractiveModelFromLocation({
                search: "?pageid=reveal_canvas",
            })
        ).toBe(DEFAULT_CANVAS_INTERACTIVE_MODEL);
    });

    it("reads model from research.html query strings", () => {
        expect(
            parseCanvasInteractiveModelFromLocation({
                search: "?pageid=reveal_canvas&model=cfde-inc",
            })
        ).toBe("cfde-inc");
    });

    it("reads model from /r/ short URLs", () => {
        expect(
            parseCanvasInteractiveModelFromLocation({
                search: "?model=cfde-inc",
            })
        ).toBe("cfde-inc");
    });

    it("validates against server model list", () => {
        expect(
            normalizeCanvasInteractiveModel("cfde-inc", ["cfde", "cfde-inc"])
        ).toBe("cfde-inc");
        expect(
            normalizeCanvasInteractiveModel("unknown", ["cfde", "cfde-inc"])
        ).toBe(DEFAULT_CANVAS_INTERACTIVE_MODEL);
    });

    it("enables gene-set semantic search for cfde and cfde-inc", () => {
        expect(canvasModelCapabilities("cfde").geneSetSemanticSearch).toBe(true);
        expect(canvasModelCapabilities("cfde-inc").geneSetSemanticSearch).toBe(true);
    });
});
