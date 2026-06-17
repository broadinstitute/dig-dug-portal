import {
    applyMultiQueryRevealWorkflowImport,
    buildMultiQueryRevealExportBundle,
    canExportMultiQueryRevealWorkflow,
    collectMultiQueryRevealWorkflowState,
    hasWorkflowResults,
    parseMultiQueryRevealWorkflowImport,
    REVEAL_MQ_WORKFLOW_EXPORT_KIND,
    REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION,
    resolvePendingStepGateForExport,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqWorkflowExport.js";

function makeVm(overrides = {}) {
    return {
        userQuery: "TREM2 microglia",
        searchMode: "auto",
        searchCriteria: [{ search_criteria: "Search Terms", values: ["TREM2"] }],
        searchCriteriaEditRows: [],
        searchCriteriaEditRowsDefault: [],
        searchCriteriaExtractionGateDone: true,
        factorData: { pheno1: { factors: [{ factor: "f1" }], genes: {} } },
        genesAndFactorValuesLoaded: true,
        pairSelectionOverrides: {},
        llmFilteredPairKeysBaseline: [],
        heatmapSelectedNodes: [],
        selectedNodesExplanations: [],
        selectedNodesProvenanceRuns: [],
        steps: [
            { id: "1", title: "Extract" },
            { id: "2", title: "Data" },
            { id: "4", title: "Hypotheses" },
        ],
        stepApprovalGateActive: false,
        stepApprovalGateStepId: "",
        stepApprovalGateMessage: "",
        stepApprovalGateResolver: null,
        loadComplete: true,
        mechanisms: [{ id: "m1", hypothesis: "Test hypothesis", core_spine_network: { nodes: [], edges: [] } }],
        mechanisms_summary: "Session summary",
        mechanismDiagnosticAssessment: { can_generate_hypothesis: true },
        hypothesisGenerationMode: "strict",
        hypothesisLastRunMode: "strict",
        error_mechanisms: false,
        error_msg_mechanisms: "",
        revealResultsTabUnlocked: true,
        display_mechanisms: true,
        loadStatus: "Done",
        cancelStepGate() {
            this.stepApprovalGateActive = false;
            this.stepApprovalGateStepId = "";
            this.stepApprovalGateResolver = null;
        },
        setLoadStatus(msg) {
            this.loadStatus = msg;
        },
        ...overrides,
    };
}

describe("revealMqWorkflowExport", () => {
    test("canExport allows query-only and full data snapshots", () => {
        expect(canExportMultiQueryRevealWorkflow(makeVm())).toBe(true);
        expect(canExportMultiQueryRevealWorkflow(makeVm({ userQuery: "test", factorData: {} }))).toBe(true);
        expect(
            canExportMultiQueryRevealWorkflow(
                makeVm({ userQuery: "", searchCriteria: null, factorData: {}, steps: [], multiQueryRoutes: [] })
            )
        ).toBe(false);
    });

    test("resolvePendingStepGateForExport captures active gates but not completed Results", () => {
        expect(
            resolvePendingStepGateForExport(
                makeVm({ stepApprovalGateActive: true, stepApprovalGateStepId: "2" })
            )
        ).toBe("2");
        expect(
            resolvePendingStepGateForExport(
                makeVm({
                    loadComplete: false,
                    mechanisms: null,
                    mechanismDiagnosticAssessment: null,
                    error_mechanisms: false,
                    genesAndFactorValuesLoaded: true,
                    steps: [
                        { id: "1", title: "Extract" },
                        { id: "2", title: "Data" },
                    ],
                })
            )
        ).toBe("2");
        expect(resolvePendingStepGateForExport(makeVm({ loadComplete: true }))).toBeNull();
    });

    test("collect and build export bundle includes Results / hypotheses", () => {
        const vm = makeVm({
            loadComplete: true,
            heatmapSelectedNodes: [{ key: "gene:APOE", kind: "gene", label: "APOE", gene: "APOE" }],
        });
        const snapshot = collectMultiQueryRevealWorkflowState(vm);
        expect(snapshot.pendingStepGate).toBeNull();
        expect(snapshot.userQuery).toBe("TREM2 microglia");
        expect(snapshot.steps.map((s) => s.id)).toEqual(["1", "2", "4"]);
        expect(snapshot.loadComplete).toBe(true);
        expect(snapshot.mechanisms).toHaveLength(1);
        expect(snapshot.mechanisms[0].hypothesis).toBe("Test hypothesis");
        expect(snapshot.mechanisms_summary).toBe("Session summary");
        expect(snapshot.hypothesisGenerationMode).toBe("strict");
        expect(snapshot.heatmapSelectedNodes).toHaveLength(1);
        expect(snapshot.heatmapSelectedNodes[0].key).toBe("gene:APOE");

        const built = buildMultiQueryRevealExportBundle(vm);
        expect(built.bundle.kind).toBe(REVEAL_MQ_WORKFLOW_EXPORT_KIND);
        expect(built.bundle.schemaVersion).toBe(REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION);
        expect(built.bundle.workflow.factorData.pheno1).toBeDefined();
        expect(built.bundle.workflow.mechanisms).toHaveLength(1);
        expect(built.bundle.workflow.heatmapSelectedNodes).toHaveLength(1);
        expect(built.filename).toMatch(/reveal-mq-workflow-.+\.json$/);
    });

    test("collect and export include saved selected-node explanations", () => {
        const explanations = [
            {
                id: "exp-1",
                savedAt: "2026-06-16T12:00:00.000Z",
                context: "LDL biology",
                selectedNodes: [{ key: "gene:APOE", kind: "gene", label: "APOE" }],
                entry: {
                    id: "exp-1",
                    status: "success",
                    interpretation: "Known APOE link.",
                    scope_node_labels: ["APOE"],
                },
            },
        ];
        const vm = makeVm({ selectedNodesExplanations: explanations });
        const snapshot = collectMultiQueryRevealWorkflowState(vm);
        expect(snapshot.selectedNodesExplanations).toHaveLength(1);
        expect(snapshot.selectedNodesExplanations[0].id).toBe("exp-1");

        const built = buildMultiQueryRevealExportBundle(vm);
        expect(built.bundle.schemaVersion).toBe(5);
        expect(built.bundle.workflow.selectedNodesExplanations).toHaveLength(1);
        expect(built.bundle.workflow.selectedNodesExplanations[0].entry.interpretation).toContain("APOE");
    });

    test("hasWorkflowResults detects completed and diagnostic-only Results", () => {
        expect(hasWorkflowResults({ loadComplete: true })).toBe(true);
        expect(hasWorkflowResults({ mechanisms: [{ hypothesis: "x" }] })).toBe(true);
        expect(
            hasWorkflowResults({ mechanismDiagnosticAssessment: { can_generate_hypothesis: false } })
        ).toBe(true);
        expect(hasWorkflowResults({ factorData: { p: {} }, genesAndFactorValuesLoaded: true })).toBe(false);
    });

    test("parse accepts bundle, bare workflow, and extraction-only payloads", () => {
        const vm = makeVm();
        const built = buildMultiQueryRevealExportBundle(vm);
        expect(parseMultiQueryRevealWorkflowImport(built.bundle)).toBeTruthy();
        expect(parseMultiQueryRevealWorkflowImport(built.bundle.workflow)).toBeTruthy();
        expect(
            parseMultiQueryRevealWorkflowImport({
                userQuery: "Only a query",
                steps: [{ id: "1", title: "Extract" }],
            })
        ).toBeTruthy();
        expect(parseMultiQueryRevealWorkflowImport({})).toBeNull();
    });

    test("apply import restores full Results state and opens Results tab", () => {
        const vm = makeVm({ loadComplete: true, mechanisms: [{ x: 1 }], heatmapSelectedNodes: [] });
        const built = buildMultiQueryRevealExportBundle(vm);
        const workflow = built.bundle.workflow;

        const result = applyMultiQueryRevealWorkflowImport(vm, workflow, { label: "Test" });
        expect(result.label).toBe("Test");
        expect(result.hasData).toBe(true);
        expect(result.hasResults).toBe(true);
        expect(vm.loadComplete).toBe(true);
        expect(vm.mechanisms).toHaveLength(1);
        expect(vm.mechanisms_summary).toBe("Session summary");
        expect(vm.heatmapSelectedNodes).toEqual(workflow.heatmapSelectedNodes);
        expect(vm.showTab).toBe("results");
        expect(vm.steps.map((s) => s.id)).toEqual(["1", "2", "4"]);
        expect(vm.stepApprovalGateActive).toBe(false);
        expect(vm.importedWorkflowPendingHypothesisRun).toBe(false);
    });

    test("apply import restores saved selected-node explanations", () => {
        const explanations = [
            {
                id: "exp-1",
                savedAt: "2026-06-16T12:00:00.000Z",
                context: "LDL biology",
                selectedNodes: [{ key: "gene:APOE", kind: "gene", label: "APOE" }],
                entry: {
                    id: "exp-1",
                    status: "success",
                    interpretation: "Known APOE link.",
                    scope_node_labels: ["APOE"],
                },
            },
        ];
        const vm = makeVm({ loadComplete: true, selectedNodesExplanations: [] });
        const built = buildMultiQueryRevealExportBundle(makeVm({ selectedNodesExplanations: explanations }));
        applyMultiQueryRevealWorkflowImport(vm, built.bundle.workflow);
        expect(vm.selectedNodesExplanations).toHaveLength(1);
        expect(vm.selectedNodesExplanations[0].id).toBe("exp-1");
        expect(vm.selectedNodesExplanations[0].entry.interpretation).toContain("APOE");
    });

    test("apply import restores saved provenance runs", () => {
        const runs = [
            {
                id: "prov-1",
                savedAt: "2026-06-16T12:00:00.000Z",
                geneSetIds: ["GS_1"],
                selectedNodes: [{ key: "geneset:GS_1", kind: "gene_set", label: "GS_1" }],
                items: [{ geneSetId: "GS_1", status: "ok", nodes: [{ id: "drc-1", dcc_url: "https://example.com" }] }],
            },
        ];
        const vm = makeVm({ loadComplete: true, selectedNodesProvenanceRuns: [] });
        const built = buildMultiQueryRevealExportBundle(makeVm({ selectedNodesProvenanceRuns: runs }));
        applyMultiQueryRevealWorkflowImport(vm, built.bundle.workflow);
        expect(vm.selectedNodesProvenanceRuns).toHaveLength(1);
        expect(vm.selectedNodesProvenanceRuns[0].geneSetIds).toEqual(["GS_1"]);
    });

    test("apply import restores Data-step pause for exports without Results", () => {
        const vm = makeVm({ loadComplete: true, mechanisms: [{ x: 1 }] });
        const built = buildMultiQueryRevealExportBundle(vm);
        const workflow = {
            ...built.bundle.workflow,
            loadComplete: false,
            mechanisms: null,
            mechanisms_summary: null,
            mechanismDiagnosticAssessment: null,
            hypothesisLastRunMode: null,
            revealResultsTabUnlocked: false,
            error_mechanisms: false,
            error_msg_mechanisms: "",
            pendingStepGate: "2",
            steps: [
                { id: "1", title: "Extract" },
                { id: "2", title: "Data" },
            ],
        };

        const result = applyMultiQueryRevealWorkflowImport(vm, workflow, { label: "Test" });
        expect(result.hasResults).toBe(false);
        expect(vm.loadComplete).toBe(false);
        expect(vm.mechanisms).toBeNull();
        expect(vm.showTab).toBe("data");
        expect(vm.steps.map((s) => s.id)).toEqual(["1", "2"]);
        expect(vm.stepApprovalGateActive).toBe(true);
        expect(vm.stepApprovalGateStepId).toBe("2");
        expect(vm.importedWorkflowPendingHypothesisRun).toBe(true);
    });

    test("apply import restores extraction-only workflow on Search terms tab", () => {
        const vm = makeVm({
            factorData: {},
            genesAndFactorValuesLoaded: false,
            searchCriteriaExtractionGateDone: false,
            steps: [{ id: "1", title: "Extract" }],
        });
        const workflow = {
            userQuery: "New query",
            searchCriteriaExtractionGateDone: false,
            steps: [{ id: "1", title: "Extract" }],
            pendingStepGate: "1",
            multiQueryRoutes: [],
        };
        applyMultiQueryRevealWorkflowImport(vm, workflow);
        expect(vm.showTab).toBe("terms");
        expect(vm.stepApprovalGateStepId).toBe("1");
        expect(vm.importedWorkflowPendingResearchRun).toBe(true);
    });
});
