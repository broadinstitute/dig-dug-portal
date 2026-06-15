import {
    buildFactorConnectivityNetwork,
    buildMergedFactorDataNetwork,
    genesFromFactorDataNetwork,
} from "@/components/researchPortal/customComponents/factorRevealDataNetwork.js";

function makeFactorObj(overrides = {}) {
    return {
        factor: "42",
        label: "lipid cluster",
        top_gene_sets: "GS1;GS2",
        gene_set_program: "gtex|lincs",
        genes: {
            APOE: { geneSetIds: ["GS1"] },
            LDLR: {},
        },
        geneSets: {},
        ...overrides,
    };
}

function makeFactorData() {
    return {
        PHENO1: {
            genes: {
                APOE: { gwasSupport: 2.1, geneSetSupport: 1.5, combined: 3.2 },
                LDLR: { gwasSupport: 1.2, geneSetSupport: 0.8, combined: 1.9 },
            },
            factors: [],
        },
    };
}

describe("factorRevealDataNetwork", () => {
    it("builds phenotype-factor-gene-set-gene connectivity", () => {
        const factorObj = makeFactorObj();
        const net = buildFactorConnectivityNetwork({
            phenotype: "PHENO1",
            factorObj,
            factorData: makeFactorData(),
            phenotypeDisplay: () => "LDL cholesterol",
        });
        const types = net.nodes.map((n) => n.type);
        expect(types).toContain("Phenotype");
        expect(types).toContain("Factor");
        expect(types).toContain("Pathway");
        expect(types).toContain("Gene");
        expect(net.edges.length).toBeGreaterThan(0);
    });

    it("merges graphs across pairs without duplicate gene nodes", () => {
        const pairs = [
            {
                phenotype: "PHENO1",
                factorObj: makeFactorObj({ factor: "42" }),
            },
            {
                phenotype: "PHENO1",
                factorObj: makeFactorObj({ factor: "99", label: "other cluster" }),
            },
        ];
        const net = buildMergedFactorDataNetwork(pairs, makeFactorData(), {
            phenotypeDisplay: () => "LDL cholesterol",
        });
        const geneNodes = net.nodes.filter((n) => n.type === "Gene");
        const geneIds = geneNodes.map((n) => n.id);
        expect(new Set(geneIds).size).toBe(geneIds.length);
        expect(genesFromFactorDataNetwork(net).length).toBe(geneNodes.length);
    });
});
