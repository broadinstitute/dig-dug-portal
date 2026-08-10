import { handleHybridRetrievalError } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqRetrievalOrchestrator.js";

function makeVm() {
    return {
        setLoadStatus: jest.fn(),
        setStep: jest.fn(),
        switchRevealTab: jest.fn(),
        pauseStepsElapsedForReview: jest.fn(),
        loadComplete: false,
        genesAndFactorValuesLoaded: true,
        searchCriteriaExtractionGateDone: true,
        importedWorkflowPendingResearchRun: false,
        stepApprovalGateActive: false,
        stepApprovalGateStepId: "",
        stepApprovalGateMessage: "",
        stepApprovalGateResolver: null,
    };
}

describe("revealMqRetrievalOrchestrator", () => {
    test("handleHybridRetrievalError maps 404 to no-results message", () => {
        const vm = makeVm();
        handleHybridRetrievalError(vm, new Error("404 no phenotype-factor results"));
        expect(vm.setLoadStatus).toHaveBeenCalledWith("No exact matches found for those terms.", true);
        expect(vm.loadComplete).toBe(true);
        expect(vm.switchRevealTab).toHaveBeenCalledWith("terms");
        expect(vm.stepApprovalGateActive).toBe(true);
        expect(vm.stepApprovalGateStepId).toBe("1");
        expect(vm.importedWorkflowPendingResearchRun).toBe(true);
        expect(vm.searchCriteriaExtractionGateDone).toBe(false);
    });

    test("handleHybridRetrievalError maps 422 to validation message", () => {
        const vm = makeVm();
        handleHybridRetrievalError(vm, new Error("422 phenotype_terms required"));
        expect(vm.setLoadStatus).toHaveBeenCalledWith(
            "Request could not be validated. Check phenotype terms and research context.",
            true
        );
        expect(vm.switchRevealTab).toHaveBeenCalledWith("terms");
    });

    test("handleHybridRetrievalError maps timeout to 504 message", () => {
        const vm = makeVm();
        handleHybridRetrievalError(vm, new Error("504 Hybrid search timed out"));
        expect(vm.setStep).toHaveBeenCalledWith(
            expect.objectContaining({ title: expect.stringContaining("timed out") })
        );
        expect(vm.switchRevealTab).toHaveBeenCalledWith("terms");
    });
});
