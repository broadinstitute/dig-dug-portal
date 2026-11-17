
import { postAlertError } from "@/components/Alert";
import * as raremetal from "raremetal.js";

export default {
    namespaced: true,

    state() {
        return {
            phenotypes: [],
            variants: [],
            masks: [],
            covariances: [],
            runTestsError: "",
        };
    },
    mutations: {
        setPhenotypes(state, data) {
            state.phenotypes = data;
        },
        setCovariances(state, data) {
            state.covariances = data;
        },
        setError(state, data) {
            state.runTestsError = data;
        },
    },
    actions: {
        async getPhenotypes({ state, commit }) {
            let json = await fetch(
                "https://ld.hugeamp.org/aggregation/metadata"
            ).then((resp) => resp.json());

            commit(
                "setPhenotypes",
                json.data[0].phenotypeDatasets[0].phenotypes
            );
        },
        async getCovariances(
            context,
            { variants, phenotype, dataset, tests, build = "GRCh37" }
        ) {
            let samples = {};
            let query = {};
            let region = context.rootGetters.region;

            if (dataset == "55k") {
                query = {
                    chrom: region.chromosome,
                    start: region.start,
                    stop: region.end,
                    genotypeDataset: 1,
                    phenotypeDataset: 1,
                    variantFormat: "COLONS",
                    phenotype: phenotype,
                    samples: "ALL",
                    genomeBuild: build,
                    maskDefinitions: [
                        {
                            id: 1,
                            name: "Fetch Data",
                            description: "Default",
                            genome_build: build,
                            group_type: "GENE",
                            identifier_type: "ENSEMBL",
                            groups: {
                                VARIANTS: variants,
                            },
                        },
                    ],
                };
            } else {
                const datasets = [
                    { phenotype: "FG", id: 6 },
                    { phenotype: "T2D", id: 7 },
                    { phenotype: "FI", id: 8 },
                ];
                query = {
                    chrom: region.chromosome,
                    start: region.start,
                    stop: region.end,
                    summaryStatisticDataset: datasets.find(
                        (p) => p.phenotype === phenotype
                    ).id,
                    variantFormat: "COLONS",
                    samples: "ALL",
                    genomeBuild: build,
                    maskDefinitions: [
                        {
                            id: 1,
                            name: "Fetch Data",
                            description: "Default",
                            genome_build: build,
                            group_type: "GENE",
                            identifier_type: "ENSEMBL",
                            groups: {
                                VARIANTS: variants,
                            },
                        },
                    ],
                };
            }

            let json = await fetch(
                "https://ld.hugeamp.org/aggregation/covariance",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(query),
                }
            )
                .then((resp) => {
                    if (resp.ok) {
                        return resp.json();
                    } else {
                        throw new Error("Request to LD server failed");
                    }
                })
                .then((json) => {
                    samples = json.data.nSamples;
                    const [groups, variants] =
                        raremetal.helpers.parsePortalJSON(json);
                    const runner = new raremetal.helpers.PortalTestRunner(
                        groups,
                        variants,
                        tests
                    );
                    return runner.run();
                });

            return { phenotype, samples, data: json };
        },
        async runTests(context, { variants, phenotypes, dataset, tests }) {
            let queries = phenotypes.map((phenotype) =>
                context.dispatch("getCovariances", {
                    variants,
                    phenotype,
                    dataset,
                    tests,
                })
            );

            try {
                let data = await Promise.all(queries);

                context.commit("setError", "");
                context.commit("setCovariances", data);
            } catch (e) {
                console.error(e);
                context.commit("setError", e);
            }
        },
    },
};
