import {
    isExtractionTimeoutError,
    resetWorkflowStateForNewRun,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqWorkflowOrchestrator.js";

describe("revealMqWorkflowOrchestrator", () => {
    test("isExtractionTimeoutError detects timeout and network failures", () => {
        expect(isExtractionTimeoutError({ status: 504 })).toBe(true);
        expect(isExtractionTimeoutError(new Error("Gateway Timeout"))).toBe(true);
        expect(isExtractionTimeoutError(new Error("Failed to fetch"))).toBe(true);
        expect(isExtractionTimeoutError(new Error("validation failed"))).toBe(false);
    });

    test("resetWorkflowStateForNewRun clears session fields", () => {
        const vm = {
            loadComplete: true,
            searchCriteria: [{ search_criteria: "x" }],
            mechanisms: [{}],
            steps: [{ id: "1" }],
            multiQueryRoutes: [{ route_id: "a" }],
            switchRevealTab: jest.fn(),
            revealResultsTabUnlocked: true,
        };
        resetWorkflowStateForNewRun(vm);
        expect(vm.loadComplete).toBe(false);
        expect(vm.searchCriteria).toBeNull();
        expect(vm.mechanisms).toBeNull();
        expect(vm.steps).toEqual([]);
        expect(vm.multiQueryRoutes).toEqual([]);
        expect(vm.switchRevealTab).toHaveBeenCalledWith("terms");
        expect(vm.revealResultsTabUnlocked).toBe(false);
    });
});
