import {
    flattenKGData,
    flattenedKGToCSV,
    serializeFactorDataForHypothesisPrompt,
    transformMergedDataToKG,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqKgTransform.js";

describe("revealMqKgTransform", () => {
    const merged = {
        t2d: {
            genes: {
                APOE: { combined: 0.8, gwasSupport: 0.5, geneSetSupport: 0.3, includedFromRequest: true },
                SMAD3: { combined: 0.2, gwasSupport: 0.1, geneSetSupport: 0.4 },
            },
            factors: [
                {
                    factor: "factor1",
                    top_gene_sets: "gs1",
                    genes: {
                        APOE: { factorRelevance: 0.9, includedFromRequest: true },
                        SMAD3: { factorRelevance: 0.4 },
                    },
                    geneSets: { gs1: { genes: ["APOE", "SMAD3"] } },
                },
            ],
        },
    };

    test("transformMergedDataToKG emits phenotype-geneset and phenotype-gene triples", () => {
        const triples = transformMergedDataToKG(merged, "factors");
        expect(triples.some((t) => t.predicate === "associated_with" && t.object === "gs1")).toBe(true);
        expect(triples.some((t) => t.predicate === "contains_gene" && t.object === "APOE")).toBe(true);
        const apoe = triples.find((t) => t.predicate === "contains_gene" && t.object === "APOE");
        expect(apoe.context.combined_score).toBe(0.8);
        expect(apoe.context.category).toBe("Genetic (Established)");
    });

    test("forHypothesisPrompt omits scores and labels search vs novel context genes", () => {
        const triples = transformMergedDataToKG(merged, "factors", { forHypothesisPrompt: true });
        const apoe = triples.find((t) => t.predicate === "contains_gene" && t.object === "APOE");
        const smad = triples.find((t) => t.predicate === "contains_gene" && t.object === "SMAD3");
        expect(apoe.context).toEqual({
            type: "PhenotypeToGene",
            category: "Search gene (query anchor)",
            included_from_request: true,
        });
        expect(smad.context).toEqual({
            type: "PhenotypeToGene",
            category: "Functional (Novel)",
            included_from_request: false,
        });
        expect(apoe.context.combined_score).toBeUndefined();
        expect(smad.context.gwas_support).toBeUndefined();
    });

    test("serializeFactorDataForHypothesisPrompt keeps role flags without numeric scores", () => {
        const json = JSON.parse(serializeFactorDataForHypothesisPrompt(merged));
        expect(json.t2d.search_gene_count).toBe(1);
        expect(json.t2d.context_gene_count).toBe(1);
        expect(json.t2d.genes.APOE).toEqual({
            included_from_request: true,
            role: "search",
        });
        expect(json.t2d.genes.SMAD3).toEqual({
            included_from_request: false,
            role: "context",
        });
        expect(json.t2d.genes.APOE.combined).toBeUndefined();
        expect(json.t2d.merged_gene_sets).toEqual(["gs1"]);
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
