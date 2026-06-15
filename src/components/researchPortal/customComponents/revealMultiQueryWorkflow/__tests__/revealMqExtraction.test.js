import {
    buildHybridQueryText,
    inferExplicitUserGenes,
    normalizeLlmTermList,
    parseLlmJsonResponse,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqExtraction.js";

describe("revealMqExtraction", () => {
    test("normalizeLlmTermList handles arrays and comma strings", () => {
        expect(normalizeLlmTermList([" T2D ", "(none extracted)"])).toEqual(["T2D"]);
        expect(normalizeLlmTermList("TREM2, microglia")).toEqual(["TREM2", "microglia"]);
        expect(normalizeLlmTermList(null)).toEqual([]);
    });

    test("parseLlmJsonResponse strips markdown fences", () => {
        const result = parseLlmJsonResponse('```json\n{"phenotype_terms":["t2d"]}\n```');
        expect(result.ok).toBe(true);
        expect(result.json.phenotype_terms).toEqual(["t2d"]);
    });

    test("buildHybridQueryText joins mechanism, phenotype, context", () => {
        expect(
            buildHybridQueryText({
                phenotypeTerms: ["t2d"],
                mechanismTerms: ["insulin"],
                researchContext: "liver",
            })
        ).toBe("insulin\nt2d\nliver");
    });

    test("inferExplicitUserGenes matches query aliases", () => {
        expect(
            inferExplicitUserGenes("Study ALK7 in cortex", ["ACVR1C", "APOE"])
        ).toEqual(["ACVR1C"]);
    });
});
