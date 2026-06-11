import {
    validateAssistantPlan,
    validateAssistantClarification,
    initialAssistantStepStates,
} from "../revealKgAssistantPlan.js";

describe("validateAssistantPlan", () => {
    it("accepts a minimal expand_graph plan", () => {
        const plan = validateAssistantPlan({
            summary: "Expand from selected nodes.",
            steps: [
                {
                    id: "step-1",
                    action: "expand_graph",
                    label: "Expand from selected nodes",
                    target: { scope: "selected_nodes" },
                    options: { count: 10 },
                },
            ],
        });
        expect(plan.type).toBe("plan");
        expect(plan.steps[0].options.count).toBe(10);
    });

    it("rejects unsupported actions", () => {
        expect(() =>
            validateAssistantPlan({
                summary: "Bad step",
                steps: [{ id: "s1", action: "fly_to_moon", label: "Nope", target: {} }],
            })
        ).toThrow(/unsupported action/i);
    });

    it("normalizes focus_graph_view options", () => {
        const plan = validateAssistantPlan({
            summary: "Focus view",
            steps: [
                {
                    id: "step-1",
                    action: "focus_graph_view",
                    label: "Zoom to selected nodes",
                    target: { scope: "selected_nodes" },
                    options: { scope: "entire_graph", fit: "yes" },
                },
            ],
        });
        expect(plan.steps[0].options.scope).toBe("entire_graph");
        expect(plan.steps[0].options.fit).toBe(true);
    });

    it("accepts add_node and open_library_graph plans", () => {
        const plan = validateAssistantPlan({
            summary: "Add and load",
            steps: [
                {
                    id: "step-1",
                    action: "add_node",
                    label: "Add TP53",
                    target: { scope: "all" },
                    options: { node_type: "gene", search_label: "TP53" },
                },
                {
                    id: "step-2",
                    action: "open_library_graph",
                    label: "Load study graph",
                    target: { scope: "all" },
                    options: { graph_label: "Type 2 diabetes study" },
                },
                {
                    id: "step-3",
                    action: "remove_invisible_nodes",
                    label: "Remove hidden nodes",
                    target: { scope: "all" },
                    options: {},
                },
            ],
        });
        expect(plan.steps[0].options.search_label).toBe("TP53");
        expect(plan.steps[1].options.graph_label).toBe("Type 2 diabetes study");
        expect(plan.steps[2].action).toBe("remove_invisible_nodes");
    });

    it("accepts select_visible_nodes plans", () => {
        const plan = validateAssistantPlan({
            summary: "Select visible genes",
            steps: [
                {
                    id: "step-1",
                    action: "select_visible_nodes",
                    label: "Select visible genes",
                    target: { scope: "all", node_types: ["gene"] },
                    options: { replace: true },
                },
            ],
        });
        expect(plan.steps[0].options.replace).toBe(true);
        expect(plan.steps[0].target.node_types).toEqual(["gene"]);
    });

    it("accepts unselect_nodes plans", () => {
        const plan = validateAssistantPlan({
            summary: "Unselect visible genes",
            steps: [
                {
                    id: "step-1",
                    action: "unselect_nodes",
                    label: "Unselect visible genes",
                    target: { scope: "all", node_types: ["gene"] },
                    options: { visible: true },
                },
            ],
        });
        expect(plan.steps[0].options.visible).toBe(true);
    });
});

describe("validateAssistantClarification", () => {
    it("parses clarify payloads", () => {
        const result = validateAssistantClarification({
            message: "Which node?",
            issues: ["ambiguous"],
            suggestions: ["Name BRCA1"],
        });
        expect(result.type).toBe("clarify");
        expect(result.issues).toEqual(["ambiguous"]);
    });
});

describe("initialAssistantStepStates", () => {
    it("marks every step pending", () => {
        expect(
            initialAssistantStepStates([
                { id: "a" },
                { id: "b" },
            ])
        ).toEqual({ a: "pending", b: "pending" });
    });
});
