import {
    buildPlanPanelShortcuts,
    capPlanStepsForBulkOverflow,
    detectBulkCanvasOverflow,
    detectBulkCanvasOverflowFromPlan,
    parseExpandCountFromUserQuery,
    preparePlanWithBulkHandling,
    REVEAL_WORKFLOW_URL,
} from "../revealKgBulkWorkflowGuidance.js";
import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";
import { validateAssistantPlan } from "../revealKgAssistantPlan.js";

describe("detectBulkCanvasOverflow", () => {
    it("flags add gene sets the same way as add genes", () => {
        expect(
            detectBulkCanvasOverflow("Add 50 gene sets relevant to sudden weight loss.")
        ).toEqual({
            kind: "add",
            requested: 50,
            cap: 20,
        });
    });

    it("allows counts within the per-step cap", () => {
        expect(
            detectBulkCanvasOverflow("Add 15 gene sets for sudden weight loss")
        ).toBeNull();
    });
});

describe("preparePlanWithBulkHandling", () => {
    it("does not flag overflow for add requests within the cap", () => {
        expect(
            detectBulkCanvasOverflow("Add 5 gene sets for sudden weight loss")
        ).toBeNull();
    });

    it("caps steps and attaches three-way panel shortcuts when over limit", () => {
        const steps = [
            {
                id: "step-1",
                action: "add_node",
                label: "Add gene sets",
                target: { scope: "all", node_types: [] },
                options: { limit: 50, search_label: "sudden weight loss", node_type: "gene_set" },
            },
        ];
        const plan = preparePlanWithBulkHandling(
            { summary: "Add gene sets", steps },
            "Add 50 gene sets relevant to sudden weight loss.",
            steps
        );
        expect(plan.steps[0].options.limit).toBe(20);
        expect(plan.panel_shortcuts.executeLabel).toBe("Execute with cap (up to 20)");
        expect(plan.panel_shortcuts.hasOverflow).toBe(true);
        expect(plan.panel_shortcuts.panelTarget).toBe("add");
        expect(plan.panel_shortcuts.workflowNote).toBeTruthy();
        expect(plan.panel_shortcuts.panelNote).toBeTruthy();
        expect(plan.panel_shortcuts.workflowLink.href).toBe(REVEAL_WORKFLOW_URL);
    });

    it("still offers panel shortcuts for expand plans within the cap", () => {
        const steps = [
            {
                id: "step-1",
                action: "expand_graph",
                label: "Expand selected gene set",
                target: { scope: "selected_nodes", node_types: [] },
                options: { count: 15, target_type: "factor" },
            },
        ];
        const shortcuts = buildPlanPanelShortcuts({ steps, overflow: null });
        expect(shortcuts.executeLabel).toBe("Execute all");
        expect(shortcuts.hasOverflow).toBe(false);
        expect(shortcuts.workflowLink).toBeNull();
        expect(shortcuts.panelTarget).toBe("expand");
        expect(shortcuts.panelLabel).toBe("Open Expand KG");
    });
});

describe("parseExpandCountFromUserQuery", () => {
    it("parses expand counts with gene between number and nodes", () => {
        expect(parseExpandCountFromUserQuery("Expand 50 gene nodes")).toBe(50);
    });

    it("parses simple neighbor counts", () => {
        expect(parseExpandCountFromUserQuery("Expand with 15 neighbors")).toBe(15);
    });
});

describe("capPlanStepsForBulkOverflow", () => {
    it("caps expand_graph count", () => {
        const [step] = capPlanStepsForBulkOverflow([
            {
                action: "expand_graph",
                options: { count: 50 },
            },
        ]);
        expect(step.options.count).toBe(20);
    });
});

describe("prepareAssistantPlannerJson bulk handling", () => {
    it("returns a capped plan instead of clarify for add 50 gene sets", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add gene sets",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add 50 gene sets",
                        target: { scope: "all", node_types: [] },
                        options: {
                            limit: 50,
                            search_label: "sudden weight loss",
                            node_type: "gene_set",
                        },
                    },
                ],
            },
            "Add 50 gene sets relevant to sudden weight loss.",
            { sample_nodes: [] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.steps[0].options.limit).toBe(20);
        expect(result.json.panel_shortcuts).toBeTruthy();
    });

    it("returns panel shortcuts when only the planned limit exceeds 20", () => {
        const result = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "Add gene sets",
                steps: [
                    {
                        id: "step-1",
                        action: "add_node",
                        label: "Add matching gene sets",
                        target: { scope: "all", node_types: [] },
                        options: {
                            limit: 50,
                            search_label: "sudden weight loss",
                            node_type: "gene_set",
                        },
                    },
                ],
            },
            "Add gene sets for sudden weight loss",
            { sample_nodes: [] }
        );
        expect(result.type).toBe("plan");
        expect(result.json.panel_shortcuts.hasOverflow).toBe(true);
    });
});

describe("validateAssistantPlan panel shortcuts", () => {
    it("passes panel shortcuts through validation", () => {
        const result = validateAssistantPlan({
            summary: "Expand neighbors",
            steps: [
                {
                    id: "step-1",
                    action: "expand_graph",
                    label: "Expand",
                    target: { scope: "selected_nodes", node_types: [] },
                    options: { count: 15 },
                },
            ],
            panel_shortcuts: {
                executeLabel: "Execute all",
                panelTarget: "expand",
                panelLabel: "Open Expand KG",
                workflowLink: { href: REVEAL_WORKFLOW_URL, label: "REVEAL Workflow" },
            },
        });
        expect(result.panelShortcuts.panelLabel).toBe("Open Expand KG");
    });
});
