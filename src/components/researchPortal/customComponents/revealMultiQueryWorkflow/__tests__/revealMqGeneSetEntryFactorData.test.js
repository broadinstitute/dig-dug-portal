import {
    buildFactorDataFromPhenotypePigean,
    filterSignificantGeneSetRows,
    scopeGeneRows,
    selectTopFactorIds,
    selectTopGeneSetsFromRows,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneSetEntryFactorData.js";

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
        beta: 0.12,
        description: "Hyperlipidemia",
        program: "hpo",
    },
    {
        geneSet: "HP_ARTERIOSCLEROSIS",
        factor: "Factor0",
        label: "Lipid cluster",
        rsScore: 2.19,
        beta: 0.08,
        description: "Arteriosclerosis",
        program: "hpo",
    },
    {
        geneSet: "WP_ADIPOGENESIS",
        factor: "Factor1",
        label: "Adipose cluster",
        rsScore: 1.5,
        beta: 0.05,
        description: "Adipogenesis",
        program: "wp",
    },
    { geneSet: "WP_UNCLUSTERED", factor: "", label: "", rsScore: 5.0, beta: 0.2 },
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

describe("filterSignificantGeneSetRows", () => {
    test("keeps only gene sets with beta > 0.01", () => {
        const rows = [
            { geneSet: "KEEP", factor: "Factor0", beta: 0.02, rsScore: 1 },
            { geneSet: "EQ", factor: "Factor0", beta: 0.01, rsScore: 9 },
            { geneSet: "LOW", factor: "Factor0", beta: 0.009, rsScore: 9 },
            { geneSet: "MISSING", factor: "Factor0", beta: null, rsScore: 9 },
        ];
        expect(filterSignificantGeneSetRows(rows).map((r) => r.geneSet)).toEqual(["KEEP"]);
    });
});

describe("selectTopGeneSetsFromRows", () => {
    test("returns top N by rs_score among factor-assigned significant gene sets", () => {
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

    test("excludes gene sets with beta ≤ 0.01", () => {
        const rows = [
            { geneSet: "SIG", factor: "Factor0", rsScore: 1, beta: 0.05 },
            { geneSet: "WEAK", factor: "Factor0", rsScore: 9, beta: 0.005 },
        ];
        expect(selectTopGeneSetsFromRows(rows, { limit: 10 })).toEqual(["SIG"]);
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
        // Full membership is retained on geneSets for context-gene discovery; LEP is not a search gene.
        expect(f0.geneSets.HP_HYPERLIPIDEMIA.genes).toContain("LEP");
        // LEP only appears in one gene set → not attached as a context gene on the factor.
        expect(f0.genes.LEP).toBeUndefined();
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
        expect(f0.geneSets.HP_HYPERLIPIDEMIA.genes).toEqual(
            expect.arrayContaining(["PCSK9", "OTHER1"])
        );
        // OTHER1 is membership-only and in a single gene set → not a context gene on the factor.
        expect(f0.genes.OTHER1).toBeUndefined();
        expect(Object.keys(f0.genes)).toEqual(["PCSK9"]);
        expect(Object.keys(factorData.T2D.genes)).toEqual(["PCSK9"]);
        // Factor1 only had PPARG — no search-gene crossing → dropped, and its gene set with it.
        expect(factorData.T2D.factors.find((f) => f.factor === "Factor1")).toBeUndefined();
        expect(f0.top_gene_sets.split(";")).not.toContain("WP_ADIPOGENESIS");
    });

    test("attaches context genes that cross ≥2 survived gene sets", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [
                {
                    phenotypeId: "T2D",
                    geneRows: [
                        { gene: "PCSK9", factor: "Factor0", label: "Lipid", combined: 2, gwasSupport: 3, geneSetSupport: 1.5 },
                        // Already fetched with the phenotype — used to fill context-gene header scores.
                        { gene: "SHARED", factor: "Factor0", label: "Lipid", combined: 1.2, gwasSupport: 0.8, geneSetSupport: 2.4 },
                    ],
                    geneSetRows: [
                        { geneSet: "GS_A", factor: "Factor0", label: "Lipid", rsScore: 2, beta: 0.05 },
                        { geneSet: "GS_B", factor: "Factor0", label: "Lipid", rsScore: 1.5, beta: 0.04 },
                    ],
                    membershipByGeneSet: {
                        GS_A: [
                            { gene: "PCSK9", combined: 2 },
                            { gene: "SHARED", combined: 1.1 },
                            { gene: "ONLY_A", combined: 0.5 },
                        ],
                        GS_B: [
                            { gene: "PCSK9", combined: 2 },
                            { gene: "SHARED", combined: 0.9 },
                        ],
                    },
                },
            ],
            ["PCSK9"]
        );
        const f0 = factorData.T2D.factors.find((f) => f.factor === "Factor0");
        expect(f0.genes.PCSK9.includedFromRequest).toBe(true);
        expect(f0.genes.SHARED.includedFromRequest).toBe(false);
        expect(f0.genes.ONLY_A).toBeUndefined();
        expect(Object.keys(factorData.T2D.genes).sort()).toEqual(["PCSK9", "SHARED"]);
        expect(factorData.T2D.genes.SHARED.combined).toBeCloseTo(1.2);
        expect(factorData.T2D.genes.SHARED.gwasSupport).toBeCloseTo(0.8);
        expect(factorData.T2D.genes.SHARED.geneSetSupport).toBeCloseTo(2.4);
        expect(factorData.T2D._genePhenotypeScores).toBeUndefined();
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
                        { geneSet: "GS_KEEP", factor: "Factor0", label: "Keep me", rsScore: 2, beta: 0.05 },
                        { geneSet: "GS_ORPHAN", factor: "Factor9", label: "Drop me", rsScore: 9, beta: 0.05 },
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

    test("drops traits when all gene sets have beta ≤ 0.01", () => {
        const factorData = buildFactorDataFromPhenotypePigean(
            [
                {
                    phenotypeId: "WEAK",
                    geneRows: [{ gene: "PCSK9", factor: "Factor0", label: "L", combined: 2 }],
                    geneSetRows: [
                        { geneSet: "GS_LOW", factor: "Factor0", label: "L", rsScore: 9, beta: 0.005 },
                        { geneSet: "GS_EQ", factor: "Factor0", label: "L", rsScore: 8, beta: 0.01 },
                    ],
                    membershipByGeneSet: {},
                },
            ],
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
            beta: 0.05,
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
                    geneSetRows: [
                        { geneSet: "WP_UNCLUSTERED", factor: "", label: "", rsScore: 9, beta: 0.2 },
                        // Need at least one significant factor-assigned gene set or the trait is dropped.
                        { geneSet: "GS_KEEP", factor: "Factor0", label: "L", rsScore: 1, beta: 0.05 },
                    ],
                    membershipByGeneSet: {},
                },
            ],
            ["PCSK9"]
        );
        const f0 = factorData.T2D.factors[0];
        expect(f0.top_gene_sets).toBe("GS_KEEP");
        expect(f0.top_gene_sets.split(";")).not.toContain("WP_UNCLUSTERED");
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
                        { geneSet: "GS_A", factor: "", label: "", rsScore: 0.9, beta: 0.05 },
                        { geneSet: "GS_B", factor: null, label: null, rsScore: 0.5, beta: 0.03 },
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

describe("buildFactorDataFromBayesPigean", () => {
    test("builds Factor×gene/gene-set matrix from factorization payload", () => {
        const { buildFactorDataFromBayesPigean } = require("@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneSetEntryFactorData.js");
        const json = {
            input_genes: ["APOE", "LDLR"],
            gene_scores: {
                APOE: 0.5,
                APOA2: 0.2,
                LDLR: 0.4,
                TINY: 0.005,
            },
            gene_sets: [
                { gene_set: "HP_X", p_value: 1e-10 },
                { gene_set: "GS_Y", p_value: 0.01 },
                { gene_set: "GS_NS", p_value: 0.2 },
            ],
            "pigean-factor": {
                data: [
                    {
                        factor: "Factor0",
                        label: "HP_HYPERLIPOPROTEINEMIA",
                        gene_score: 0.5,
                        gene_set_score: 1.2,
                        top_genes: "APOE;APOA2",
                        top_gene_sets: "HP_X;GS_Y",
                    },
                ],
            },
            "gene-factor": {
                Factor0: [
                    { gene: "APOE", factor_value: 1.5, label: "HP_HYPERLIPOPROTEINEMIA", label_factor: "Factor0" },
                    { gene: "APOA2", factor_value: 0.8, label: "HP_HYPERLIPOPROTEINEMIA", label_factor: "Factor0" },
                    { gene: "LDLR", factor_value: 0.4, label: "HP_HYPERLIPOPROTEINEMIA", label_factor: "Factor0" },
                    { gene: "TINY", factor_value: 0.9, label: "HP_HYPERLIPOPROTEINEMIA", label_factor: "Factor0" },
                ],
            },
            "gene-set-factor": {
                Factor0: [
                    { gene_set: "HP_X", factor_value: 1.7, label: "HP_HYPERLIPOPROTEINEMIA", label_factor: "Factor0" },
                    { gene_set: "GS_Y", factor_value: 0.9, label: "HP_HYPERLIPOPROTEINEMIA", label_factor: "Factor0" },
                    { gene_set: "GS_NS", factor_value: 1.1, label: "HP_HYPERLIPOPROTEINEMIA", label_factor: "Factor0" },
                ],
            },
        };
        const factorData = buildFactorDataFromBayesPigean(json, ["APOE", "LDLR"], {
            maxGenesPerFactor: 10,
            maxGeneSetsPerFactor: 10,
        });
        expect(Object.keys(factorData)).toEqual(["Factor0"]);
        const f = factorData.Factor0.factors[0];
        expect(f.label).toBe("HP_HYPERLIPOPROTEINEMIA");
        expect(f.genes.APOE.includedFromRequest).toBe(true);
        expect(f.genes.APOE.factor_value).toBe(1.5);
        expect(f.genes.APOE.gene_score).toBe(0.5);
        expect(f.genes.APOA2.includedFromRequest).toBe(false);
        expect(f.genes.LDLR.includedFromRequest).toBe(true);
        expect(f.genes.TINY).toBeUndefined();
        expect(f.top_gene_sets.split(";")).toEqual(["HP_X", "GS_Y"]);
        expect(f.geneSets.HP_X.factor_value).toBe(1.7);
        expect(f.geneSets.HP_X.p_value).toBe(1e-10);
        expect(f.geneSets.HP_X.gene_set_score).toBeCloseTo(10, 5);
        expect(f.geneSets.GS_NS).toBeUndefined();
        expect(f.geneSets.HP_X.genes).toEqual(expect.arrayContaining(["APOE", "LDLR", "APOA2"]));
        // No Combined / GWAS scores on phenotype gene map.
        expect(factorData.Factor0.genes.APOE.combined).toBeUndefined();
    });

    test("omits gene sets with p ≥ 0.05 or missing p; sizes with -log10(p)", () => {
        const { buildFactorDataFromBayesPigean } = require("@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneSetEntryFactorData.js");
        const json = {
            input_genes: ["APOE"],
            gene_scores: { APOE: 0.4 },
            gene_sets: [
                { gene_set: "HP_X", p_value: 0.001 },
                { gene_set: "GS_Y", p_value: 0.2 },
            ],
            "pigean-factor": {
                data: [{ factor: "Factor0", label: "L", gene_score: 0.4, gene_set_score: 1.0 }],
            },
            "gene-factor": {
                Factor0: [{ gene: "APOE", factor_value: 0.8, label: "L", label_factor: "Factor0" }],
            },
            "gene-set-factor": {
                Factor0: [
                    { gene_set: "HP_X", factor_value: 0.5, label: "L", label_factor: "Factor0" },
                    { gene_set: "GS_Y", factor_value: 0.9, label: "L", label_factor: "Factor0" },
                    { gene_set: "GS_NO_P", factor_value: 1.0, label: "L", label_factor: "Factor0" },
                ],
            },
        };
        const factorData = buildFactorDataFromBayesPigean(json, ["APOE"]);
        const f = factorData.Factor0.factors[0];
        expect(f.geneSets.HP_X).toBeDefined();
        expect(f.geneSets.HP_X.gene_set_score).toBeCloseTo(3, 5);
        expect(f.geneSets.GS_Y).toBeUndefined();
        expect(f.geneSets.GS_NO_P).toBeUndefined();
    });

    test("minGeneFactorValue filters context genes by |factor_value|; search genes always kept", () => {
        const { buildFactorDataFromBayesPigean } = require("@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqGeneSetEntryFactorData.js");
        const json = {
            input_genes: ["LDLR"],
            gene_scores: { LDLR: 0.4, WEAK: 0.9, STRONG: 0.9 },
            gene_sets: [{ gene_set: "HP_X", p_value: 1e-8 }],
            "pigean-factor": {
                data: [{ factor: "Factor0", label: "L", gene_score: 0.4, gene_set_score: 1.0 }],
            },
            "gene-factor": {
                Factor0: [
                    { gene: "LDLR", factor_value: 0.15, label: "L", label_factor: "Factor0" },
                    { gene: "WEAK", factor_value: 0.1, label: "L", label_factor: "Factor0" },
                    { gene: "STRONG", factor_value: 0.5, label: "L", label_factor: "Factor0" },
                ],
            },
            "gene-set-factor": {
                Factor0: [{ gene_set: "HP_X", factor_value: 1.0, label: "L", label_factor: "Factor0" }],
            },
        };
        const factorData = buildFactorDataFromBayesPigean(json, ["LDLR"], {
            minGeneFactorValue: 0.2,
            maxGenesPerFactor: 100,
            maxGeneSetsPerFactor: 100,
        });
        const f = factorData.Factor0.factors[0];
        expect(f.genes.LDLR.includedFromRequest).toBe(true);
        expect(f.genes.STRONG).toBeDefined();
        expect(f.genes.WEAK).toBeUndefined();
    });
});
