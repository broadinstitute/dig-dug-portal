import {
    buildFactorDataFromPhenotypePigean,
    scopeGeneRows,
    selectTopFactorIds,
    selectTopGeneSetsFromRows,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneEntryFactorData.js";

const GENE_ROWS = [
    { gene: "PCSK9", factor: "Factor0", label: "Lipid cluster", combined: 4.2, gwasSupport: 5.1, geneSetSupport: 3.0 },
    { gene: "LDLR", factor: "Factor0", label: "Lipid cluster", combined: 3.1, gwasSupport: 4.0, geneSetSupport: 2.5 },
    { gene: "PPARG", factor: "Factor1", label: "Adipose cluster", combined: 1.4, gwasSupport: 0.8, geneSetSupport: 1.2 },
    { gene: "OTHER1", factor: "Factor0", label: "Lipid cluster", combined: 0.2, gwasSupport: 0.1, geneSetSupport: 0.1 },
];

const GENE_SET_ROWS = [
    {
        geneSet: "HP_HYPERLIPIDEMIA",
        factor: "Factor0",
        label: "Lipid cluster",
        rsScore: 3.02,
        description: "Hyperlipidemia",
        program: "hpo",
    },
    {
        geneSet: "HP_ARTERIOSCLEROSIS",
        factor: "Factor0",
        label: "Lipid cluster",
        rsScore: 2.19,
        description: "Arteriosclerosis",
        program: "hpo",
    },
    {
        geneSet: "WP_ADIPOGENESIS",
        factor: "Factor1",
        label: "Adipose cluster",
        rsScore: 1.5,
        description: "Adipogenesis",
        program: "wp",
    },
    { geneSet: "WP_UNCLUSTERED", factor: "", label: "", rsScore: 5.0 },
];

describe("selectTopFactorIds", () => {
    test("prefers factors with search genes, ranked by combined", () => {
        const ids = selectTopFactorIds(GENE_ROWS, GENE_SET_ROWS, ["PCSK9", "PPARG"], { limit: 5 });
        expect(ids[0]).toBe("Factor0"); // PCSK9 combined 4.2
        expect(ids).toContain("Factor1");
    });

    test("limits to N factors", () => {
        const geneRows = Array.from({ length: 10 }, (_, i) => ({
            gene: "PCSK9",
            factor: `Factor${i}`,
            label: `L${i}`,
            combined: i,
        }));
        const ids = selectTopFactorIds(geneRows, [], ["PCSK9"], { limit: 5 });
        expect(ids).toEqual(["Factor9", "Factor8", "Factor7", "Factor6", "Factor5"]);
    });
});

describe("selectTopGeneSetsFromRows", () => {
    test("returns top N by rs_score among factor-assigned gene sets", () => {
        expect(selectTopGeneSetsFromRows(GENE_SET_ROWS, { limit: 2 })).toEqual([
            "HP_HYPERLIPIDEMIA",
            "HP_ARTERIOSCLEROSIS",
        ]);
    });

    test("restricts to provided factorIds", () => {
        expect(
            selectTopGeneSetsFromRows(GENE_SET_ROWS, { limit: 10, factorIds: ["Factor1"] })
        ).toEqual(["WP_ADIPOGENESIS"]);
    });
});

describe("scopeGeneRows", () => {
    test("restricts to search genes only", () => {
        const scoped = scopeGeneRows(GENE_ROWS, ["PCSK9", "PPARG"]);
        expect(scoped.map((r) => r.gene).sort()).toEqual(["PCSK9", "PPARG"]);
    });

    test("returns empty when search genes do not appear in rows", () => {
        expect(scopeGeneRows(GENE_ROWS, ["NOT_PRESENT"])).toEqual([]);
    });

    test("falls back to top-N by score when no search genes are provided", () => {
        const scoped = scopeGeneRows(GENE_ROWS, [], 2);
        expect(scoped).toHaveLength(2);
        expect(scoped.map((r) => r.gene).sort()).toEqual(["LDLR", "PCSK9"]);
    });
});

describe("buildFactorDataFromPhenotypePigean", () => {
    test("builds factors with genes, gene sets, and membership", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [
                {
                    phenotypeId: "T2D",
                    geneRows: GENE_ROWS,
                    geneSetRows: GENE_SET_ROWS,
                    membershipByGeneSet: {
                        HP_HYPERLIPIDEMIA: [
                            { gene: "PCSK9", combined: 4.2 },
                            { gene: "APOB", combined: 2.0 },
                            { gene: "LEP", combined: 11.3 }, // not a search gene — must be dropped
                        ],
                        HP_ARTERIOSCLEROSIS: [{ gene: "LDLR", combined: 3.1 }],
                    },
                },
            ],
            ["PCSK9", "LDLR", "PPARG", "APOB"]
        );

        expect(Object.keys(factorData)).toEqual(["T2D"]);
        const bucket = factorData.T2D;
        expect(bucket.factors.length).toBeGreaterThanOrEqual(2);

        const f0 = bucket.factors.find((f) => f.factor === "Factor0");
        expect(f0).toBeDefined();
        expect(f0.label).toBe("Lipid cluster");
        expect(f0.top_gene_sets.split(";")).toEqual(
            expect.arrayContaining(["HP_HYPERLIPIDEMIA", "HP_ARTERIOSCLEROSIS"])
        );
        expect(f0.genes.PCSK9.includedFromRequest).toBe(true);
        expect(f0.genes.PCSK9.geneSetIds).toContain("HP_HYPERLIPIDEMIA");
        expect(f0.geneSets.HP_HYPERLIPIDEMIA.genes).toContain("PCSK9");
        expect(f0.geneSets.HP_HYPERLIPIDEMIA.genes).not.toContain("LEP");
        // APOB is an input gene present only via membership — attached to the factor.
        expect(f0.genes.APOB.includedFromRequest).toBe(true);
        expect(f0.geneSets.HP_HYPERLIPIDEMIA.genes).toContain("APOB");
        // OTHER1 is in the API rows but not in the search list.
        expect(f0.genes.OTHER1).toBeUndefined();
        expect(Object.keys(bucket.genes).sort()).toEqual(["APOB", "LDLR", "PCSK9", "PPARG"]);

        // Phenotype-level gene scores from gene rows (combined / log_bf / prior).
        expect(bucket.genes.PCSK9.combined).toBeCloseTo(4.2);
        expect(bucket.genes.PCSK9.gwasSupport).toBeCloseTo(5.1);
        expect(bucket.genes.PCSK9.geneSetSupport).toBeCloseTo(3.0);
        expect(bucket.allFactors).toBe(bucket.factors);
    });

    test("post-merge filter keeps only search genes", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [
                {
                    phenotypeId: "T2D",
                    geneRows: GENE_ROWS,
                    geneSetRows: GENE_SET_ROWS,
                    membershipByGeneSet: {
                        HP_HYPERLIPIDEMIA: [
                            { gene: "PCSK9", combined: 4.2 },
                            { gene: "OTHER1", combined: 0.2 },
                        ],
                    },
                },
            ],
            ["PCSK9"]
        );
        const f0 = factorData.T2D.factors.find((f) => f.factor === "Factor0");
        expect(Object.keys(f0.genes)).toEqual(["PCSK9"]);
        expect(Object.keys(factorData.T2D.genes)).toEqual(["PCSK9"]);
        expect(f0.geneSets.HP_HYPERLIPIDEMIA.genes).toEqual(["PCSK9"]);
        // Factor1 only had PPARG — no search-gene crossing → dropped, and its gene set with it.
        expect(factorData.T2D.factors.find((f) => f.factor === "Factor1")).toBeUndefined();
        expect(f0.top_gene_sets.split(";")).not.toContain("WP_ADIPOGENESIS");
    });

    test("drops factors with no search-gene crossing and orphan gene sets", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [
                {
                    phenotypeId: "T2D",
                    geneRows: [
                        { gene: "PCSK9", factor: "Factor0", label: "Keep me", combined: 2 },
                        { gene: "ZZZ", factor: "Factor9", label: "Drop me", combined: 9 },
                    ],
                    geneSetRows: [
                        { geneSet: "GS_KEEP", factor: "Factor0", label: "Keep me", rsScore: 2 },
                        { geneSet: "GS_ORPHAN", factor: "Factor9", label: "Drop me", rsScore: 9 },
                    ],
                    membershipByGeneSet: {},
                },
            ],
            ["PCSK9"]
        );
        expect(factorData.T2D.factors.map((f) => f.factor)).toEqual(["Factor0"]);
        expect(factorData.T2D.factors[0].top_gene_sets).toBe("GS_KEEP");
        expect(factorData.T2D.factors[0].geneSets.GS_ORPHAN).toBeUndefined();
    });

    test("skips phenotypes with no usable rows", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [{ phenotypeId: "Empty", geneRows: [], geneSetRows: [] }],
            ["PCSK9"]
        );
        expect(factorData).toEqual({});
    });

    test("keeps at most maxFactors per phenotype", () => {
        const geneRows = Array.from({ length: 8 }, (_, i) => ({
            gene: "PCSK9",
            factor: `Factor${i}`,
            label: `Cluster ${i}`,
            combined: i,
        }));
        const geneSetRows = Array.from({ length: 8 }, (_, i) => ({
            geneSet: `GS${i}`,
            factor: `Factor${i}`,
            label: `Cluster ${i}`,
            rsScore: i,
        }));
        const factorData = buildFactorDataFromPhenotypePigean(
            [{ phenotypeId: "T2D", geneRows, geneSetRows, membershipByGeneSet: {} }],
            ["PCSK9"],
            { maxFactors: 5 }
        );
        expect(factorData.T2D.factors).toHaveLength(5);
        expect(factorData.T2D.factors.map((f) => f.factor).sort()).toEqual([
            "Factor3",
            "Factor4",
            "Factor5",
            "Factor6",
            "Factor7",
        ].sort());
    });

    test("ignores factor-less gene-set rows when assembling factors", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [
                {
                    phenotypeId: "T2D",
                    geneRows: [{ gene: "PCSK9", factor: "Factor0", label: "L", combined: 1 }],
                    geneSetRows: [{ geneSet: "WP_UNCLUSTERED", factor: "", label: "", rsScore: 9 }],
                    membershipByGeneSet: {},
                },
            ],
            ["PCSK9"]
        );
        const f0 = factorData.T2D.factors[0];
        expect(f0.top_gene_sets).toBe("");
    });

    test("uses phenotype id as factor when gene/gene-set rows have no factor", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [
                {
                    phenotypeId: "gcat_trait_haptoglobin_measurement",
                    geneRows: [
                        { gene: "HP", factor: "", label: "", combined: 1.6 },
                        { gene: "PKD1", factor: null, label: null, combined: 0.04 },
                        { gene: "OTHER", factor: "", label: "", combined: 9 },
                    ],
                    geneSetRows: [
                        { geneSet: "GS_A", factor: "", label: "", rsScore: 0.9 },
                        { geneSet: "GS_B", factor: null, label: null, rsScore: 0.5 },
                    ],
                    membershipByGeneSet: {
                        GS_A: [{ gene: "HP", combined: 1.6 }],
                    },
                },
            ],
            ["HP", "PKD1"]
        );
        expect(Object.keys(factorData)).toEqual(["gcat_trait_haptoglobin_measurement"]);
        const factors = factorData.gcat_trait_haptoglobin_measurement.factors;
        expect(factors).toHaveLength(1);
        expect(factors[0].factor).toBe("gcat_trait_haptoglobin_measurement");
        expect(factors[0].genes.HP).toBeDefined();
        expect(factors[0].genes.PKD1).toBeDefined();
        expect(factors[0].genes.OTHER).toBeUndefined();
        expect(factors[0].top_gene_sets.split(";").sort()).toEqual(["GS_A", "GS_B"]);
        expect(factors[0].geneSets.GS_A.genes).toContain("HP");
    });
});
