import {
    buildAssistantCatalogHelpMessage,
    isAssistantCatalogHelpQuery,
    plannerJsonLooksLikeCatalogHelpMisroute,
    resolveAssistantCatalogHelpQuery,
} from "../revealKgAssistantCatalogHelp.js";
import { isDirectCommandQuery } from "../revealKgAssistantQueryRouter.js";
import { prepareAssistantPlannerJson } from "../revealKgAssistantPlanRepair.js";

describe("revealKgAssistantCatalogHelp", () => {
    it("detects command-list help queries", () => {
        expect(isAssistantCatalogHelpQuery("give me a list of commands I can use")).toBe(true);
        expect(isAssistantCatalogHelpQuery("What commands can I use?")).toBe(true);
        expect(isAssistantCatalogHelpQuery("Provide a text list of common canvas commands")).toBe(
            true
        );
        expect(isAssistantCatalogHelpQuery("Explain selected nodes")).toBe(false);
        expect(isAssistantCatalogHelpQuery("Open filter panel")).toBe(false);
    });

    it("returns a catalog summary without canvas steps", () => {
        const { result } = resolveAssistantCatalogHelpQuery();
        expect(result.type).toBe("clarify");
        expect(result.message).toContain("Actions tab");
        expect(result.message).toContain("Commands");
        expect(result.message).toContain("Research");
        expect(buildAssistantCatalogHelpMessage()).toContain("Library & files");
    });

    it("repairs planner misroutes that used explain_graph for help", () => {
        const repaired = prepareAssistantPlannerJson(
            {
                response_type: "plan",
                summary: "No canvas actions required — user asked for command list.",
                steps: [
                    {
                        id: "step-1",
                        action: "explain_graph",
                        label: "Generate in-chat command list",
                        target: { scope: "selected_nodes" },
                        options: {},
                    },
                ],
            },
            "give me a list of commands I can use",
            { sample_nodes: [] }
        );
        expect(repaired.type).toBe("clarify");
        expect(repaired.json.message).toContain("Actions tab");
    });

    it("flags explain-only plans for help queries as misroutes", () => {
        expect(
            plannerJsonLooksLikeCatalogHelpMisroute(
                {
                    steps: [{ action: "explain_graph" }],
                },
                "list available commands"
            )
        ).toBe(true);
        expect(isDirectCommandQuery("list available commands", { sample_nodes: [] })).toBe(false);
    });
});
