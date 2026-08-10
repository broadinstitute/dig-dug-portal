import {
    beginMechanismHypothesisGeneration,
    requestMechanismHypotheses,
    resumeImportedWorkflowAfterDataGate,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqHypothesisOrchestrator.js";

function makeVm(overrides = {}) {
    return {
        revealResultsTabUnlocked: false,
        loadComplete: true,
        showTab: "data",
        lastKgTriples: [{ subject: "a", predicate: "b", object: "c" }],
        factorData: {
            pheno1: {
                genes: { GENE1: { includedFromRequest: true } },
                factors: [
                    {
                        factor: "F1",
                        factorLabel: "CLUSTER_1",
                        fetched_direction: "Genetics",
                        genes: { GENE1: { includedFromRequest: true, factorRelevance: 0.5 } },
                        geneSets: { GS_1: { genes: ["GENE1"] } },
                        top_gene_sets: "GS_1",
                    },
                ],
            },
        },
        factorDataTableRowsFiltered: [{ phenotype: "pheno1", factor: "F1", factorLabel: "CLUSTER_1" }],
        factorDataTableRowsHeatmapScoped: [],
        heatmapSelectedNodes: [],
        lastGenesOfInterest: ["GENE1"],
        lastExplicitUserGenes: [],
        freeTextLlmFeedScope: "full",
        phenotypeAssociationFilters: {},
        searchPath: "query",
        multiQueryEvidenceBundles: [],
        hypothesisGenerationMode: "strict",
        mechanismHypothesisSystemPromptEffective: "system",
        searchCriteria: [{ values: [] }, { values: "ctx" }],
        lastHybridSearchMeta: {},
        setLoadStatus: jest.fn(),
        setStep: jest.fn(),
        switchRevealTab: jest.fn(function (tab) {
            this.showTab = tab;
        }),
        restartMechanismHypothesisStepTimer: jest.fn(),
        transformMergedDataToKG: jest.fn(() => [{ subject: "x", predicate: "y", object: "z" }]),
        serializeFactorDataForPrompt: jest.fn(() => "{}"),
        parseLLMResponse: jest.fn(() => ({
            hypotheses: [{ title: "H1" }],
            diagnostic_assessment: { can_generate_hypothesis: true },
        })),
        normalizeMechanismHypotheses: jest.fn((h) => h),
        getReportSessionSummary: jest.fn(() => "summary"),
        autoMapAllMechanismsToBiolink: jest.fn(),
        $nextTick: jest.fn((fn) => (fn ? fn() : undefined)),
        llmAnalyze: {
            sendPrompt: jest.fn(({ onResponse }) => {
                onResponse('{"hypotheses":[{"title":"H1"}],"diagnostic_assessment":{"can_generate_hypothesis":true}}');
            }),
        },
        ...overrides,
    };
}

describe("revealMqHypothesisOrchestrator", () => {
    test("beginMechanismHypothesisGeneration switches to Results and unlocks tab", () => {
        const vm = makeVm();
        beginMechanismHypothesisGeneration(vm);
        expect(vm.revealResultsTabUnlocked).toBe(true);
        expect(vm.loadComplete).toBe(false);
        expect(vm.switchRevealTab).toHaveBeenCalledWith("results");
        expect(vm.restartMechanismHypothesisStepTimer).toHaveBeenCalled();
    });

    test("resumeImportedWorkflowAfterDataGate starts hypothesis LLM from stored KG", async () => {
        const vm = makeVm({ lastKgTriples: [{ subject: "g1", predicate: "p", object: "o" }] });
        resumeImportedWorkflowAfterDataGate(vm);
        expect(vm.setLoadStatus).toHaveBeenCalledWith("Generating hypotheses…");
        expect(vm.setStep).toHaveBeenCalledWith(
            expect.objectContaining({ id: "4", title: expect.stringContaining("hypotheses") })
        );
        expect(vm.transformMergedDataToKG).not.toHaveBeenCalled();
        await Promise.resolve();
        expect(vm.llmAnalyze.sendPrompt).toHaveBeenCalled();
    });

    test("resumeImportedWorkflowAfterDataGate rebuilds KG triples when missing", async () => {
        const vm = makeVm({ lastKgTriples: [] });
        resumeImportedWorkflowAfterDataGate(vm);
        expect(vm.transformMergedDataToKG).toHaveBeenCalledWith(vm.factorData, "factors");
        await Promise.resolve();
        expect(vm.llmAnalyze.sendPrompt).toHaveBeenCalled();
    });

    test("requestMechanismHypotheses invokes LLM and stores mechanisms", async () => {
        const vm = makeVm();
        requestMechanismHypotheses(vm, vm.factorData, vm.lastKgTriples);
        expect(vm.switchRevealTab).toHaveBeenCalledWith("results");
        expect(vm.llmAnalyze.sendPrompt).toHaveBeenCalled();
        // The retry loop now runs through the shared runLlmWithRetry helper, which adds
        // an extra microtask hop (its own async-function return) before the mechanism
        // result lands on vm — flush a couple of ticks rather than assuming exactly one.
        await Promise.resolve();
        await Promise.resolve();
        expect(vm.mechanisms).toEqual([{ title: "H1" }]);
        expect(vm.loadComplete).toBe(true);
    });
});
