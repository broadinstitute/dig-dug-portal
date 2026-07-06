import {
    assistantSuggestFullLabel,
    shouldShowAssistantSuggestPreview,
} from "../revealKgAssistantNodeSuggest.js";

describe("assistant suggest preview", () => {
    const similarGeneSets = [
        {
            label: "GTEx pancreas GTEx aging Pancreas 20-29 50-59 up",
            fullLabel: "GTEx pancreas GTEx aging Pancreas 20-29 50-59 up",
        },
        {
            label: "GTEx pancreas GTEx aging Pancreas 20-29 60-69 up",
            fullLabel: "GTEx pancreas GTEx aging Pancreas 20-29 60-69 up",
        },
    ];

    it("shows preview when suggestions share a long common prefix", () => {
        expect(shouldShowAssistantSuggestPreview(similarGeneSets, 0)).toBe(true);
    });

    it("does not show preview for short distinct labels", () => {
        const items = [
            { label: "BRCA1", fullLabel: "BRCA1" },
            { label: "TP53", fullLabel: "TP53" },
        ];
        expect(shouldShowAssistantSuggestPreview(items, 0)).toBe(false);
    });

    it("reads fullLabel when present", () => {
        expect(
            assistantSuggestFullLabel({
                label: "Short",
                fullLabel: "GTEx pancreas GTEx aging Pancreas 20-29 50-59 up",
            })
        ).toBe("GTEx pancreas GTEx aging Pancreas 20-29 50-59 up");
    });
});
