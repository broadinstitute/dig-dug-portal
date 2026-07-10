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

describe("validateAssistantPlan confidence + alternatives", () => {
    const step = {
        id: "step-1",
        action: "add_node",
        label: "Add BRCA1",
        target: { scope: "node", node_labels: ["BRCA1"] },
        options: {},
    };

    it("defaults confidence to high", () => {
        const plan = validateAssistantPlan({ summary: "Add a node", steps: [step] });
        expect(plan.confidence).toBe("high");
        expect(plan.alternatives).toBeUndefined();
    });

    it("keeps alternatives only when confidence is medium", () => {
        const alt = {
            summary: "Add as gene set instead",
            steps: [
                {
                    id: "step-1",
                    action: "add_node",
                    label: "Add BRCA1 gene set",
                    target: { scope: "node", node_labels: ["BRCA1"] },
                    options: { node_type: "gene_set" },
                },
            ],
        };
        const medium = validateAssistantPlan({
            confidence: "medium",
            summary: "Add a node",
            steps: [step],
            alternatives: [alt],
        });
        expect(medium.confidence).toBe("medium");
        expect(medium.alternatives).toHaveLength(1);
        expect(medium.alternatives[0].steps[0].action).toBe("add_node");

        const high = validateAssistantPlan({
            confidence: "high",
            summary: "Add a node",
            steps: [step],
            alternatives: [alt],
        });
        expect(high.alternatives).toBeUndefined();
    });

    it("drops malformed alternatives without failing the plan", () => {
        const plan = validateAssistantPlan({
            confidence: "medium",
            summary: "Add a node",
            steps: [step],
            alternatives: [{ summary: "bad", steps: [{ action: "not_a_real_action" }] }],
        });
        expect(plan.type).toBe("plan");
        expect(plan.alternatives).toBeUndefined();
    });
});

describe("validateAssistantClarification options", () => {
    it("normalizes clickable options and drops entries without a query", () => {
        const result = validateAssistantClarification({
            message: "Did you mean the trait or gene sets?",
            options: [
                { label: "The trait", query: "select the Type 2 diabetes trait" },
                { query: "add gene sets for type 2 diabetes" },
                { label: "no query here" },
            ],
        });
        expect(result.options).toHaveLength(2);
        expect(result.options[0]).toEqual({
            label: "The trait",
            query: "select the Type 2 diabetes trait",
        });
        // Falls back to the query text as the label when label is omitted.
        expect(result.options[1].label).toBe("add gene sets for type 2 diabetes");
    });

    it("omits options when none are valid", () => {
        const result = validateAssistantClarification({ message: "Clarify" });
        expect(result.options).toBeUndefined();
    });
});
