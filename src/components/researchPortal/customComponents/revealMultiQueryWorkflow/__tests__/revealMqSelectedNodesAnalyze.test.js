import {
    appendSavedSelectedNodesExplanation,
    appendSavedSelectedNodesProvenanceRun,
    buildSavedSelectedNodesExplanation,
    buildSavedSelectedNodesProvenanceRun,
    buildSelectedNodesExplainLlmPrompts,
    buildSelectedNodesExplanationDraft,
    explanationMenuLabel,
    findSavedSelectedNodesExplanation,
    findSavedSelectedNodesProvenanceRun,
    geneSetIdsFromSelectedNodes,
    provenanceMenuLabel,
    runSelectedNodesExplanation,
    savedSelectedNodesExplanationMenuItems,
    savedSelectedNodesProvenanceMenuItems,
    selectedNodesSubgraph,
    sendLlmClientPrompt,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqSelectedNodesAnalyze.js";
import {
    buildCrossingSelectionNode,
    buildGeneSelectionNode,
    buildGeneSetSelectionNode,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqHeatmapSelection.js";
import { EXPLAIN_SCOPE } from "@/components/researchPortal/customComponents/revealKgWorkspace/revealKgExplainUtils.js";

describe("revealMqSelectedNodesAnalyze", () => {
    const network = {
        nodes: [
            { id: "gene:APOE", label: "APOE", type: "Gene" },
            { id: "gs:PH1|F1|GS_1", label: "GS_1", type: "Pathway" },
            { id: "factor:PH1|F1", label: "Cluster 1", type: "Factor" },
        ],
        edges: [
            { source: "gene:APOE", target: "gs:PH1|F1|GS_1", predicate: "contributes_to_pathway" },
            { source: "factor:PH1|F1", target: "gs:PH1|F1|GS_1", predicate: "linked_to_pathway" },
        ],
    };

    test("collects gene set ids from gene-set and gene-set crossing selections", () => {
        const gs = buildGeneSetSelectionNode("GS_1");
        const crossing = buildCrossingSelectionNode(
            { phenotype: "PH1", factor: "F1", fetchedDirection: "Genetics" },
            "GS_2",
            true
        );
        expect(geneSetIdsFromSelectedNodes([gs, crossing])).toEqual(["GS_1", "GS_2"]);
        expect(geneSetIdsFromSelectedNodes([buildGeneSelectionNode("APOE")])).toEqual([]);
    });

    test("builds selected-node subgraph for explain API", () => {
        const selected = [buildGeneSelectionNode("APOE")];
        const subgraph = selectedNodesSubgraph(network, selected);
        expect(subgraph.graphNodes.map((n) => n.id)).toEqual(["gene:APOE"]);
        expect(subgraph.graphEdges).toHaveLength(0);

        const crossing = buildCrossingSelectionNode(
            { phenotype: "PH1", factor: "F1", fetchedDirection: "Genetics" },
            "APOE",
            false
        );
        const crossingSubgraph = selectedNodesSubgraph(network, [crossing]);
        expect(crossingSubgraph.graphEdges).toHaveLength(1);
        expect(crossingSubgraph.graphEdges[0].source).toBe("gene:APOE");
    });

    test("builds explain draft scoped to selected nodes", () => {
        const draft = buildSelectedNodesExplanationDraft(network, [buildGeneSelectionNode("APOE")], {
            context: "LDL biology",
        });
        expect(draft.scope).toBe(EXPLAIN_SCOPE.KEY_NODES);
        expect(draft.target).toBe("active_set");
        expect(draft.graph_nodes).toHaveLength(1);
        expect(draft.query_text).toContain("APOE");
        expect(draft.additional_context).toBe("LDL biology");
    });

    test("builds llm prompts from explain draft", () => {
        const draft = buildSelectedNodesExplanationDraft(network, [buildGeneSelectionNode("APOE")], {
            context: "LDL biology",
        });
        const prompts = buildSelectedNodesExplainLlmPrompts(draft);
        expect(prompts.systemPrompt).toContain("REVEAL Multi Query");
        expect(prompts.userPrompt).toContain("APOE");
        expect(prompts.userPrompt).toContain("LDL biology");
    });

    test("runSelectedNodesExplanation uses llmAnalyze.sendPrompt", async () => {
        const llmClient = {
            sendPrompt: jest.fn(({ onResponse }) => {
                onResponse("Known link between APOE and GS_1.\n\nNovel: testable pathway hypothesis.");
            }),
        };
        const { entry } = await runSelectedNodesExplanation({
            network,
            selectedNodes: [buildGeneSelectionNode("APOE")],
            context: "LDL biology",
            llmClient,
        });
        expect(llmClient.sendPrompt).toHaveBeenCalled();
        expect(entry.status).toBe("success");
        expect(entry.interpretation).toContain("APOE");
    });

    test("sendLlmClientPrompt rejects incomplete responses", async () => {
        const llmClient = {
            sendPrompt: jest.fn(({ onEnd }) => {
                onEnd();
            }),
        };
        await expect(
            sendLlmClientPrompt(llmClient, { systemPrompt: "sys", userPrompt: "user" })
        ).rejects.toThrow("Incomplete LLM response.");
    });

    test("saves successful explanations and builds submenu labels", () => {
        const entry = {
            id: "exp-1",
            status: "success",
            interpretation: "Known link.",
            scope_node_labels: ["APOE", "GS_1"],
            timestamp: "2026-06-16T12:00:00.000Z",
        };
        const selected = [buildGeneSelectionNode("APOE")];
        const saved = buildSavedSelectedNodesExplanation({
            entry,
            selectedNodes: selected,
            context: "LDL biology",
        });
        expect(saved.id).toBe("exp-1");
        expect(saved.selectedNodes).toHaveLength(1);
        expect(saved.entry.interpretation).toBe("Known link.");

        const list = appendSavedSelectedNodesExplanation([], saved);
        expect(list).toHaveLength(1);
        expect(explanationMenuLabel(0, entry)).toBe("Explanation 1: APOE, GS_1");

        const menuItems = savedSelectedNodesExplanationMenuItems(list);
        expect(menuItems).toHaveLength(1);
        expect(menuItems[0].menuLabel).toBe("Explanation 1: APOE, GS_1");
        expect(findSavedSelectedNodesExplanation(list, "exp-1")).toEqual(saved);
        expect(findSavedSelectedNodesExplanation(list, "missing")).toBeNull();
    });

    test("skips failed explanations when saving", () => {
        expect(
            buildSavedSelectedNodesExplanation({
                entry: { id: "x", status: "error", interpretation: "" },
                selectedNodes: [],
            })
        ).toBeNull();
    });

    test("saves provenance runs and builds dataset menu labels", () => {
        const run = buildSavedSelectedNodesProvenanceRun({
            geneSetIds: ["GS_1", "GS_2"],
            items: [
                { geneSetId: "GS_1", status: "ok", nodes: [] },
                { geneSetId: "GS_2", status: "empty", nodes: [] },
            ],
            selectedNodes: [],
        });
        expect(run.geneSetIds).toEqual(["GS_1", "GS_2"]);
        expect(provenanceMenuLabel(0, run.geneSetIds)).toBe("Dataset 1: GS_1, GS_2");

        const list = appendSavedSelectedNodesProvenanceRun([], run);
        const menuItems = savedSelectedNodesProvenanceMenuItems(list);
        expect(menuItems[0].menuLabel).toBe("Dataset 1: GS_1, GS_2");
        expect(findSavedSelectedNodesProvenanceRun(list, run.id)).toEqual(run);
    });
});
