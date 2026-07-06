import {
    applyDeterministicPhenotypeTranslations,
    buildPhenotypeIdLabelMap,
    findPhenotypeIdsInText,
    planPhenotypeSemanticSearchQuery,
    resolveTraitLabelForSearch,
} from "../revealKgPhenotypeQueryTranslate.js";

describe("revealKgPhenotypeQueryTranslate", () => {
    it("finds gcat_trait and compact phenotype ids in text", () => {
        const ids = findPhenotypeIdsInText(
            "gene sets for gcat_trait_fasting_blood_insulin_measurement and CVDinT2D"
        );
        expect(ids).toEqual(
            expect.arrayContaining([
                "gcat_trait_fasting_blood_insulin_measurement",
                "CVDinT2D",
            ])
        );
    });

    it("resolves cfde catalog labels for phenotype ids", () => {
        expect(resolveTraitLabelForSearch("CVDinT2D")).toContain("type 2 diabetes");
        expect(resolveTraitLabelForSearch("trait:FGovertime")).toContain("Fasting glucose");
    });

    it("prefers graph trait labels over raw ids", () => {
        const label = resolveTraitLabelForSearch("trait:custom_trait", {
            session: {
                graphNodes: [
                    {
                        id: "trait:custom_trait",
                        type: "trait",
                        label: "Custom readable trait label",
                    },
                ],
            },
        });
        expect(label).toBe("Custom readable trait label");
    });

    it("applies deterministic replacements in query text", () => {
        const map = buildPhenotypeIdLabelMap("trait:CVDinT2D gene sets");
        const translated = applyDeterministicPhenotypeTranslations(
            "trait:CVDinT2D gene sets",
            map
        );
        expect(translated).not.toContain("CVDinT2D");
        expect(translated.toLowerCase()).toContain("type 2 diabetes");
    });

    it("uses deterministic translation when LLM is unavailable", async () => {
        const result = await planPhenotypeSemanticSearchQuery(
            "Find gene sets for trait:gcat_trait_fasting_blood_insulin_measurement",
            { interactiveLlmAvailable: false }
        );
        expect(result.method).toBe("deterministic");
        expect(result.searchQuery.toLowerCase()).toContain("fasting blood insulin");
        expect(result.searchQuery).not.toContain("gcat_trait_");
    });

    it("expands T2D abbreviation for embedding search", () => {
        const map = buildPhenotypeIdLabelMap(
            "GTEx gene sets associated with T2D trait and pancreas"
        );
        expect(map.T2D).toContain("Type 2 diabetes");
        const translated = applyDeterministicPhenotypeTranslations(
            "GTEx gene sets associated with T2D trait and pancreas",
            map
        );
        expect(translated.toLowerCase()).toContain("type 2 diabetes");
        expect(translated).not.toMatch(/\bT2D trait\b/);
    });
});
