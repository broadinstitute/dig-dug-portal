import {
    flattenKGData,
    flattenedKGToCSV,
    transformMergedDataToKG,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqKgTransform.js";

describe("revealMqKgTransform", () => {
    test("transformMergedDataToKG emits phenotype-geneset and phenotype-gene triples", () => {
        const merged = {
            t2d: {
                genes: { APOE: { combined: 0.8, gwasSupport: 0.5, geneSetSupport: 0.3 } },
                factors: [
                    {
                        factor: "factor1",
                        top_gene_sets: "gs1",
                        genes: { APOE: { factorRelevance: 0.9, includedFromRequest: true } },
                        geneSets: { gs1: { genes: ["APOE"] } },
                    },
                ],
            },
        };
        const triples = transformMergedDataToKG(merged, "factors");
        expect(triples.some((t) => t.predicate === "associated_with" && t.object === "gs1")).toBe(true);
        expect(triples.some((t) => t.predicate === "contains_gene" && t.object === "APOE")).toBe(true);
    });

    test("flattenKGData and flattenedKGToCSV produce CSV with context columns", () => {
        const flat = flattenKGData([
            { subject: "a", predicate: "rel", object: "b", context: { type: "Test", score: 1 } },
        ]);
        expect(flat[0].context_type).toBe("Test");
        const csv = flattenedKGToCSV(flat);
        expect(csv.split("\n")[0]).toContain("context_type");
        expect(csv).toContain("a,rel,b");
    });
});
