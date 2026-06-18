import { formatAssistantStepSummary } from "../revealKgAssistantStepSummary.js";

describe("formatAssistantStepSummary", () => {
    it("summarizes expand_graph additions", () => {
        expect(
            formatAssistantStepSummary(
                { action: "expand_graph", label: "Expand" },
                { addedCount: 3 }
            )
        ).toBe("Added 3 nodes to the graph.");
    });

    it("summarizes select_nodes clearing", () => {
        expect(
            formatAssistantStepSummary(
                { action: "select_nodes", label: "Clear" },
                { cleared: true }
            )
        ).toBe("Cleared all selected nodes.");
    });

    it("summarizes select_visible_nodes", () => {
        expect(
            formatAssistantStepSummary(
                { action: "select_visible_nodes", label: "Select visible genes" },
                { markedCount: 4 }
            )
        ).toBe("Marked 4 visible nodes as selected.");
    });

    it("summarizes unselect_nodes", () => {
        expect(
            formatAssistantStepSummary(
                { action: "unselect_nodes", label: "Unselect all" },
                { cleared: true, unselectedCount: 5 }
            )
        ).toBe("Unmarked all 5 selected nodes.");
        expect(
            formatAssistantStepSummary(
                { action: "unselect_nodes", label: "Unselect visible genes" },
                { unselectedCount: 2 }
            )
        ).toBe("Unmarked 2 nodes.");
    });

    it("summarizes focus_graph_view reset", () => {
        expect(
            formatAssistantStepSummary(
                { action: "focus_graph_view", label: "Fit graph" },
                { resetView: true }
            )
        ).toBe("Reset the graph view to show the full canvas.");
    });

    it("summarizes remove_node and add_node", () => {
        expect(
            formatAssistantStepSummary(
                { action: "remove_node", label: "Remove BRCA1" },
                { removedCount: 2, skippedCount: 1 }
            )
        ).toBe(
            "Removed 2 nodes from the graph. 1 selected node could not be removed."
        );
        expect(
            formatAssistantStepSummary(
                { action: "add_node", label: "Add TP53" },
                { addedCount: 1 }
            )
        ).toBe("Added 1 node to the graph; rebuilding edges…");
    });

    it("summarizes library actions", () => {
        expect(
            formatAssistantStepSummary({ action: "open_my_library", label: "Library" }, {})
        ).toBe("Opened My library.");
        expect(
            formatAssistantStepSummary(
                { action: "open_library_graph", label: "Load graph" },
                { graphLabel: "Study A" }
            )
        ).toBe('Loaded "Study A" from My library.');
    });
});
