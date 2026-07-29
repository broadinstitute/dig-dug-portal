import { selectTopTraits } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneEntryCrossReference.js";

const PHENOTYPES_RESPONSE = {
    phenotypes: [
        { p_value: 0.0, phenotype: "Homozygous_familial_hypercholesterolemia_Orphanet_391665" },
        { p_value: 0.0, phenotype: "gcat_trait_sphingomyelin_160_measurement" },
        { p_value: 7.5e-306, phenotype: "gcat_trait_free_cholesterol_to_total_lipids_in_small_HDL_percentage" },
        { p_value: 1.1e-266, phenotype: "gcat_trait_free_cholesterol_to_total_lipids_in_large_HDL_percentage" },
    ],
};

describe("revealMqGeneEntryCrossReference", () => {
    test("selectTopTraits sorts ascending by p_value and ranks", () => {
        const top = selectTopTraits(PHENOTYPES_RESPONSE, { limit: 2 });
        expect(top).toHaveLength(2);
        expect(top[0].rank).toBe(1);
        expect(top[1].rank).toBe(2);
        expect(top.every((t) => t.pValue <= 7.5e-306 || t.pValue === 0)).toBe(true);
    });

    test("selectTopTraits returns empty for missing input", () => {
        expect(selectTopTraits(null)).toEqual([]);
        expect(selectTopTraits({})).toEqual([]);
    });

    test("selectTopTraits with null limit returns the full ranked list", () => {
        const all = selectTopTraits(PHENOTYPES_RESPONSE, { limit: null });
        expect(all).toHaveLength(4);
        expect(all.map((t) => t.rank)).toEqual([1, 2, 3, 4]);
    });
});
