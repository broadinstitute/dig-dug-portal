/**
 * Gene-set path: normalize hypothesis_spine → core_spine_network and cite IDs.
 */
import { normalizeMechanismHypotheses } from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqMechanismNormalize.js";

function makeVm(overrides = {}) {
    return {
        searchPath: "genes",
        lastFlattenedKG: [],
        lastGeneSetEntryLlmFeed: {
            factors: [
                {
                    id: "Factor0",
                    genes: [
                        { symbol: "PCSK9", is_input: true, factor_relevance: 0.9, gene_score: 0.8 },
                        { symbol: "LDLR", is_input: false, factor_relevance: 0.7, gene_score: 0.6 },
                    ],
                },
            ],
        },
        factorData: {},
        normalizeCellularAssignment: () => null,
        normalizeDepotContrast: () => null,
        normalizeEffectDirectionNotes: (v) => (Array.isArray(v) ? v : []),
        filterMechanismReportPhenotypes: (p) => p,
        buildGeneConnectionsFromAssociatedRows: () => ({}),
        ...overrides,
    };
}

describe("normalizeMechanismHypotheses gene-set path", () => {
    test("maps hypothesis_spine to core_spine_network and joins feed scores", () => {
        const vm = makeVm();
        const [out] = normalizeMechanismHypotheses(vm, [
            {
                group_name: "Lipid clearance",
                hypothesis: "PCSK9 regulates LDLR toward arteriosclerosis.",
                novelty: "Anchor PCSK9 with context LDLR.",
                rationale: "Factorization supports lipid clearance.",
                associated_factor_ids: ["Factor0"],
                associated_pairs: [{ phenotype: "Factor0", factor: "Factor0" }],
                cited_gene_symbols: ["PCSK9", "LDLR"],
                cited_gene_set_names: ["HP_ARTERIOSCLEROSIS"],
                phenotype_disease_mappings: [
                    {
                        term: "Arteriosclerosis",
                        provenance: "DIRECT_FEED_LABEL",
                        source_refs: ["HP_ARTERIOSCLEROSIS"],
                    },
                ],
                hypothesis_spine: {
                    caption: "PCSK9 → clearance → arteriosclerosis",
                    nodes: [
                        { id: "n1", label: "PCSK9", type: "GENE", ref: "PCSK9" },
                        { id: "n2", label: "LDL clearance", type: "PROCESS", ref: null },
                        { id: "n3", label: "Arteriosclerosis", type: "PHENOTYPE", ref: null },
                    ],
                    edges: [
                        { from: "n1", to: "n2", predicate: "REGULATES" },
                        { from: "n2", to: "n3", predicate: "MAPS_TO_PHENOTYPE" },
                    ],
                },
                genes: [
                    {
                        gene: "PCSK9",
                        group: "Primary Mechanistic Candidate",
                        role: "Search anchor",
                        is_input: true,
                        source_factor_ids: ["Factor0"],
                    },
                    {
                        gene: "LDLR",
                        group: "Supporting Canonical Network",
                        role: "Discovered candidate",
                        is_input: false,
                        source_factor_ids: ["Factor0"],
                    },
                ],
                next_steps: [
                    { category: "Literature Review", action: "a", reason: "r" },
                    { category: "In Silico Profiling", action: "a", reason: "r" },
                    { category: "Experimental Validation", action: "a", reason: "r" },
                ],
                next_queries: ["q1 enough text", "q2 enough text"],
            },
        ]);

        expect(out.core_spine_network).toBeTruthy();
        expect(out.core_spine_network.nodes.map((n) => n.type)).toEqual([
            "Gene",
            "Process",
            "Phenotype",
        ]);
        expect(out.hypothesis_in_kg.caption).toContain("PCSK9");
        expect(out.candidate_genes[0].scores.factor_relevance).toBeCloseTo(0.9);
        expect(out.candidate_genes[0].is_input).toBe(true);
        expect(out.cited_gene_set_names).toEqual(["HP_ARTERIOSCLEROSIS"]);
        expect(out.phenotype_disease_mappings[0].term).toBe("Arteriosclerosis");
        expect(out.relevant_gene_sets).toContain("HP_ARTERIOSCLEROSIS");
        expect(out.cross_route_crosstalk_model).toBeNull();
        expect(out.candidate_inventory).toBeNull();
    });

    test("coerces Haiku-style aliases (symbol, phenotype_name, spine array, description)", () => {
        const vm = makeVm();
        const [out] = normalizeMechanismHypotheses(vm, [
            {
                group_name: "LDL Receptor–PCSK9 Axis",
                hypothesis: "PCSK9 impairs LDL clearance toward atherosclerosis.",
                novelty: "Integrates PCSK9–LDLR recycling.",
                associated_factor_ids: ["Factor0"],
                associated_pairs: [
                    { phenotype: "HP_CORONARY_ARTERY_ATHEROSCLEROSIS", factor: "Factor0" },
                ],
                cited_gene_symbols: ["PCSK9", "LDLR"],
                cited_gene_set_names: ["HP_CORONARY_ARTERY_ATHEROSCLEROSIS"],
                phenotype_disease_mappings: [
                    {
                        phenotype_id: "HP_CORONARY_ARTERY_ATHEROSCLEROSIS",
                        phenotype_name: "Coronary Artery Atherosclerosis",
                        provenance: "DIRECT_FEED_LABEL",
                        source_refs: ["Factor0"],
                    },
                ],
                hypothesis_spine: [
                    { id: "spine_h1_n1", node_type: "GENE", label: "PCSK9", ref: "PCSK9" },
                    {
                        id: "spine_h1_n2",
                        node_type: "PROCESS",
                        label: "LDLR degradation",
                        ref: null,
                    },
                    {
                        id: "spine_h1_n3",
                        node_type: "PHENOTYPE",
                        label: "Atherosclerosis",
                        ref: null,
                    },
                ],
                hypothesis_spine_edges: [
                    { from: "spine_h1_n1", to: "spine_h1_n2", predicate: "ACTIVATES" },
                    { from: "spine_h1_n2", to: "spine_h1_n3", predicate: "MAPS_TO_PHENOTYPE" },
                ],
                genes: [
                    {
                        symbol: "PCSK9",
                        is_input: true,
                        group: "Primary Mechanistic Candidate",
                        source_factor_ids: ["Factor0"],
                    },
                    {
                        symbol: "LDLR",
                        is_input: false,
                        group: "Supporting Canonical Network",
                        source_factor_ids: ["Factor0"],
                    },
                ],
                next_steps: [
                    {
                        category: "Experimental Validation",
                        description: "Measure LDLR surface expression under PCSK9 overexpression.",
                    },
                    {
                        category: "In Silico Profiling",
                        description: "Prioritize pathway enrichment for cited gene sets.",
                    },
                    {
                        category: "Literature Review",
                        description: "Review PCSK9–LDLR clinical genetics.",
                    },
                ],
                next_queries: ["q1 enough text here", "q2 enough text here"],
            },
        ]);

        expect(out.candidate_genes.map((g) => g.gene)).toEqual(["PCSK9", "LDLR"]);
        expect(out.candidate_genes[0].scores.factor_relevance).toBeCloseTo(0.9);
        expect(out.candidate_genes[0].reason).toMatch(/Search anchor/i);
        expect(out.phenotype_disease_mappings[0].term).toBe("Coronary Artery Atherosclerosis");
        expect(out.core_spine_network).toBeTruthy();
        expect(out.core_spine_network.nodes.length).toBe(3);
        expect(out.core_spine_network.edges.length).toBe(2);
        expect(out.hypothesis_in_kg.caption).toContain("PCSK9");
        expect(out.next_steps[0].action).toMatch(/LDLR surface expression/);
        expect(out.next_steps[0].reason).toMatch(/Supports follow-up/);
    });

    test("free-text path still uses hypothesis_in_kg and ignores gene-set-only enrichment", () => {
        const vm = makeVm({
            searchPath: "query",
            lastFlattenedKG: [
                {
                    id: 1,
                    subject: "PhenotypeA",
                    predicate: "contains_gene",
                    object: "PCSK9",
                    context_combined_score: 0.5,
                    context_gwas_support: 0.4,
                    context_functional_support: 0.3,
                },
            ],
        });
        const [out] = normalizeMechanismHypotheses(vm, [
            {
                group_name: "Free text",
                hypothesis: "h",
                novelty: "n",
                genes: [{ gene: "PCSK9", group: "Primary Mechanistic Candidate", role: "r" }],
                hypothesis_in_kg: {
                    caption: "cap",
                    nodes: [
                        { id: "n1", label: "PCSK9", group: "Gene" },
                        { id: "n2", label: "Process", group: "Process" },
                        { id: "n3", label: "Phenotype", group: "Phenotype" },
                    ],
                    edges: [
                        { from: "n1", to: "n2", label: "regulates" },
                        { from: "n2", to: "n3", label: "modulates" },
                    ],
                },
                supporting_row_ids: [1],
                next_steps: [],
                next_queries: [],
            },
        ]);
        expect(out.core_spine_network.nodes.length).toBe(3);
        expect(out.candidate_genes[0].scores.combined).toBeCloseTo(0.5);
        expect(out.cited_gene_set_names).toBeUndefined();
    });
});
