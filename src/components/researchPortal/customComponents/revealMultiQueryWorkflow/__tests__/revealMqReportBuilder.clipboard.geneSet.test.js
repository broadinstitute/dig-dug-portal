/**
 * Gene-set clipboard text mirrors Results fields (no novelty; factor labels; spine edges).
 */
import { buildMechanismClipboardText } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqReportBuilder.js";

describe("buildMechanismClipboardText gene-set path", () => {
    test("includes Results-aligned sections and omits novelty", () => {
        const text = buildMechanismClipboardText(
            {
                group_name: "PCSK9 clearance",
                hypothesis: "PCSK9 impairs LDL clearance.",
                novelty: "Should not appear",
                rationale: "Factorization supports lipid clearance.",
                phenotype_disease_mappings: [
                    {
                        term: "Arteriosclerosis",
                        provenance: "DIRECT_FEED_LABEL",
                        source_refs: ["HP_ARTERIOSCLEROSIS"],
                    },
                ],
                hypothesis_in_kg: { caption: "PCSK9 → clearance → arteriosclerosis" },
                core_spine_network: {
                    nodes: [
                        { id: "n1", label: "PCSK9", type: "Gene" },
                        { id: "n2", label: "clearance", type: "Process" },
                    ],
                    edges: [{ source: "n1", target: "n2", predicate: "REGULATES" }],
                },
                candidate_genes: [
                    {
                        gene: "PCSK9",
                        group: "Primary Mechanistic Candidate",
                        is_input: true,
                        reason: "Search anchor",
                        scores: { factor_relevance: 0.9, gene_score: 0.8 },
                    },
                ],
                associated_factor_ids: ["Factor0"],
                cited_gene_set_names: ["HP_ARTERIOSCLEROSIS"],
                next_steps: [
                    { category: "Literature Review", action: "a", reason: "r" },
                    { category: "In Silico Profiling", action: "a", reason: "r" },
                    { category: "Experimental Validation", action: "a", reason: "r" },
                ],
                next_queries: ["Query LDLR with HP_ARTERIOSCLEROSIS membership overlap."],
            },
            0,
            "lipid biology",
            null,
            {
                geneSetPath: true,
                formatFactorLabel: (id) => (id === "Factor0" ? "HP_ARTERIOSCLEROSIS" : String(id)),
            }
        );

        expect(text).toContain("Biological rationale:");
        expect(text).toContain("Factorization supports lipid clearance.");
        expect(text).toContain("Phenotype / disease mappings:");
        expect(text).toContain("Arteriosclerosis");
        expect(text).toContain("Associated factors:");
        expect(text).toContain("HP_ARTERIOSCLEROSIS");
        expect(text).toContain("In search: Yes");
        expect(text).toContain("Factor relevance: 0.900");
        expect(text).toContain("n1 -> n2 (REGULATES)");
        expect(text).not.toContain("Novelty");
        expect(text).not.toContain("Should not appear");
        expect(text).not.toContain("Rationale / Novelty");
    });
});
