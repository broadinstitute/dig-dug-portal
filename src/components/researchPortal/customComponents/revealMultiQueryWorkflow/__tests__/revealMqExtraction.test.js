import {
    buildHybridQueryText,
    inferExplicitUserGenes,
    isViableLlmText,
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

    test("parseLlmJsonResponse rejects truncated JSON", () => {
        const truncated =
            '```json\n{"phenotype_terms":["dyslipidemia"],"mechanism_terms":["cholester';
        const result = parseLlmJsonResponse(truncated);
        expect(result.ok).toBe(false);
    });

    test("parseLlmJsonResponse rejects truncated object with complete nested arrays", () => {
        // Real Bedrock failure mode: cut mid-string inside selected_routes.
        const truncated =
            '```json\n{\n  "phenotype_terms": ["dyslipidemia"],\n  "selected_routes": [\n    {\n      "category": "Tissue Expression",\n      "extracted_terms": {\n        "mechanism_terms": ["cholester';
        expect(parseLlmJsonResponse(truncated).ok).toBe(false);
        expect(isViableLlmText(truncated)).toBe(false);
    });

    test("isViableLlmText fails truncated fenced JSON", () => {
        const truncated =
            '```json\n{"selected_routes":[{"category":"Tissue Expression","extracted_terms":{"mechanism_terms":["cholester';
        expect(isViableLlmText(truncated)).toBe(false);
        expect(isViableLlmText('{"ok":true}')).toBe(true);
        expect(isViableLlmText("plain prose answer")).toBe(true);
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
