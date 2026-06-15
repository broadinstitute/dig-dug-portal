import { transformMergedDataToKG } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqKgTransform.js";

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
});
