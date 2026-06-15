import { handleHybridRetrievalError } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqRetrievalOrchestrator.js";

function makeVm() {
    return {
        setLoadStatus: jest.fn(),
        setStep: jest.fn(),
        loadComplete: false,
    };
}

describe("revealMqRetrievalOrchestrator", () => {
    test("handleHybridRetrievalError maps 404 to no-results message", () => {
        const vm = makeVm();
        handleHybridRetrievalError(vm, new Error("404 no phenotype-factor results"));
        expect(vm.setLoadStatus).toHaveBeenCalledWith("No exact matches found for those terms.", true);
        expect(vm.loadComplete).toBe(true);
    });

    test("handleHybridRetrievalError maps 422 to validation message", () => {
        const vm = makeVm();
        handleHybridRetrievalError(vm, new Error("422 phenotype_terms required"));
        expect(vm.setLoadStatus).toHaveBeenCalledWith(
            "Request could not be validated. Check phenotype terms and research context.",
            true
        );
    });

    test("handleHybridRetrievalError maps timeout to 504 message", () => {
        const vm = makeVm();
        handleHybridRetrievalError(vm, new Error("504 Hybrid search timed out"));
        expect(vm.setStep).toHaveBeenCalledWith(
            expect.objectContaining({ title: expect.stringContaining("timed out") })
        );
    });
});
