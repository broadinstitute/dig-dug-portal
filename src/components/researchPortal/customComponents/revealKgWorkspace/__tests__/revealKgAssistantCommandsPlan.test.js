import {
    resolveDirectCommandQuery,
    synthesizeCommandsPlan,
} from "../revealKgAssistantCommandsPlan.js";
import {
    isDirectCommandQuery,
} from "../revealKgAssistantQueryRouter.js";
import {
    assistantStepClosesExpandPanel,
    assistantStepClosesFilterPanel,
} from "../revealKgAssistantActionCatalog.js";

describe("revealKgAssistantQueryRouter", () => {
    const sessionContext = {
        sample_nodes: [
            { node_id: "trait:T2D", label: "Type 2 diabetes", type: "trait" },
            { node_id: "gene:BRCA1", label: "BRCA1", type: "gene" },
        ],
    };

    it("executes single-intent direct commands via the command filter", () => {
        expect(isDirectCommandQuery("Open filter panel", sessionContext)).toBe(true);
        expect(isDirectCommandQuery("Show jumping edges", sessionContext)).toBe(true);
    });

    it("defers mixed command+research queries to the LLM planner", () => {
        expect(
            isDirectCommandQuery(
                "Open filter panel and find gene sets for type 2 diabetes",
                sessionContext
            )
        ).toBe(false);
    });

    it("defers multi-command queries to the LLM planner", () => {
        expect(
            isDirectCommandQuery(
                "Show jumping edges and hide contextual edges",
                sessionContext
            )
        ).toBe(false);
    });

    it("keeps trait expand as a direct command when fully specified in one phrase", () => {
        expect(
            isDirectCommandQuery(
                "Expand 15 gene set nodes from Type 2 diabetes",
                sessionContext
            )
        ).toBe(true);
    });
});

describe("revealKgAssistantCommandsPlan", () => {
    const sessionContext = {
        sample_nodes: [
            { node_id: "trait:T2D", label: "Type 2 diabetes", type: "trait" },
            { node_id: "gene:BRCA1", label: "BRCA1", type: "gene" },
        ],
    };

    it("synthesizes direct UI commands", () => {
        expect(synthesizeCommandsPlan("Start a new graph", sessionContext)?.steps[0].action).toBe(
            "new_graph"
        );
        expect(synthesizeCommandsPlan("Reset the graph", sessionContext)?.steps[0].action).toBe(
            "new_graph"
        );
        expect(synthesizeCommandsPlan("Open My library", sessionContext)?.steps[0].action).toBe(
            "open_my_library"
        );
        expect(
            synthesizeCommandsPlan("Show jumping edges", sessionContext)?.steps[0].action
        ).toBe("set_jumping_edges_visible");
        expect(
            synthesizeCommandsPlan("Hide contextual edges", sessionContext)?.steps[0].options
                .visible
        ).toBe(false);
        expect(synthesizeCommandsPlan("Open filter panel", sessionContext)?.steps[0].action).toBe(
            "open_filter_panel"
        );
    });

    it("synthesizes rule-based selection and removal commands", () => {
        expect(synthesizeCommandsPlan("Unselect all", sessionContext)?.steps[0].action).toBe(
            "unselect_nodes"
        );
        expect(
            synthesizeCommandsPlan("Remove BRCA1 from the graph", sessionContext)?.steps[0].action
        ).toBe("remove_node");
        expect(synthesizeCommandsPlan("Inspect BRCA1", sessionContext)?.steps[0].action).toBe(
            "inspect"
        );
    });

    it("synthesizes trait gene set expand commands", () => {
        const plan = synthesizeCommandsPlan(
            "Expand 15 gene set nodes from Type 2 diabetes",
            sessionContext
        );
        expect(plan?.steps[0].action).toBe("expand_graph");
        expect(plan?.steps[0].options.target_type).toBe("gene_set");
        expect(plan?.steps[0].options.count).toBe(15);
    });

    it("auto-executes matched direct commands", () => {
        const session = {
            graphNodes: [{ id: "gene:BRCA1", label: "BRCA1", type: "gene" }],
            controls: {},
        };
        const { result } = resolveDirectCommandQuery("Show jumping edges", session, {});
        expect(result.type).toBe("plan");
        expect(result.autoExecute).toBe(true);
        expect(result.planSource).toBe("command");
        expect(result.steps[0].action).toBe("set_jumping_edges_visible");
    });
});

describe("assistant panel close behavior", () => {
    it("does not close panels opened by open_* actions", () => {
        expect(assistantStepClosesFilterPanel("open_filter_panel")).toBe(false);
        expect(assistantStepClosesExpandPanel("open_expand_panel")).toBe(false);
    });

    it("closes panels after build-style graph actions", () => {
        expect(assistantStepClosesFilterPanel("filter_graph", { mode: "build" })).toBe(true);
        expect(assistantStepClosesExpandPanel("expand_graph")).toBe(true);
    });
});
