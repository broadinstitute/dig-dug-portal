import {
    getAssistantActionPreconditionMessage,
    validateAssistantStepPreconditions,
} from "../revealKgAssistantActionPreconditions.js";
import { resolveDirectCommandQuery } from "../revealKgAssistantCommandsPlan.js";

describe("revealKgAssistantActionPreconditions", () => {
    const emptySession = { graphNodes: [], highlighted: [], controls: {} };

    it("blocks filter panel when the canvas has no nodes", () => {
        expect(
            getAssistantActionPreconditionMessage(emptySession, {
                action: "open_filter_panel",
            })
        ).toContain("empty canvas");
    });

    it("allows filter panel when nodes exist", () => {
        expect(
            getAssistantActionPreconditionMessage(
                { graphNodes: [{ id: "gene:1" }], highlighted: [] },
                { action: "open_filter_panel" }
            )
        ).toBeNull();
    });

    it("validates all steps in a plan", () => {
        expect(
            validateAssistantStepPreconditions(emptySession, [
                { action: "open_filter_panel" },
            ])
        ).toContain("filter panel");
    });
});

describe("resolveDirectCommandQuery preconditions", () => {
    it("returns clarify in chat instead of a false-success plan on blank canvas", () => {
        const { result } = resolveDirectCommandQuery(
            "Open filter panel",
            { graphNodes: [], controls: {} },
            {}
        );
        expect(result.type).toBe("clarify");
        expect(result.message).toContain("empty canvas");
        expect(result.autoExecute).toBeUndefined();
    });

    it("auto-executes when preconditions pass", () => {
        const { result } = resolveDirectCommandQuery(
            "Show jumping edges",
            { graphNodes: [{ id: "g:1", label: "TP53", type: "gene" }], controls: {} },
            {}
        );
        expect(result.type).toBe("plan");
        expect(result.autoExecute).toBe(true);
        expect(result.steps[0].action).toBe("set_jumping_edges_visible");
    });
});
