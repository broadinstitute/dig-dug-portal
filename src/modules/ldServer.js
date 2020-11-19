/*
! LD Server specific data
*/

import * as raremetal from "raremetal.js";

export default {
    namespaced: true,

    state() {
        return {
            phenotypes: [],
            variants: [],
            masks: [],
            covariances: []
        };
    },
    mutations: {
        setPhenotypes(state, data) {
            state.phenotypes = data;
        },
        setCovariances(state, data) {
            state.covariances = data;
        }
    },
    // getters: {
    //     covarianceCount(state) {
    //         return state.covariances.groups
    //             ? state.covariances.groups[0].variants.length
    //             : 0;
    //     }
    // },
    actions: {
        // fetch all the phenotypes available
        async getPhenotypes({ state, commit }) {
            let json = await fetch(
                "https://ld.hugeamp.org/aggregation/metadata"
            ).then(resp => resp.json());

            // phenotypes for dataset
            commit(
                "setPhenotypes",
                json.data[0].phenotypeDatasets[0].phenotypes
            );
        },
        async getCovariances(context, { variants, phenotype, dataset, tests }) {
            //console.log("state", state);
            //let variants = state.variants;
            // let gene = await state.gene.data[0];
            // let chrom = gene.chromosome;
            // let start = gene.start;
            // let stop = gene.end;

            //console.log("variants", variants);
            //console.log("gene", gene);
            //console.log("context", context);
            let query = {};
            let region = context.rootGetters.region;

            if (dataset == "52k") {
                query = {
                    chrom: region.chromosome,
                    start: region.start,
                    stop: region.end,
                    genotypeDataset: 1,
                    phenotypeDataset: 1,
                    variantFormat: "COLONS", //optinal, input and output format for requests
                    phenotype: phenotype, //string only, no array
                    samples: "ALL",
                    genomeBuild: "GRCh37",
                    maskDefinitions: [
                        {
                            id: 1, //integer, required
                            name: "Fetch Data", //required
                            description: "Default", //required
                            genome_build: "GRCh37",
                            group_type: "GENE",
                            identifier_type: "ENSEMBL",
                            groups: {
                                VARIANTS: variants
                            }
                        }
                    ]
                };
            } else {
                //TopMed dataset
                query = {
                    chrom: region.chromosome,
                    start: region.start,
                    stop: region.end,
                    summaryStatisticDataset: 1,
                    variantFormat: "COLONS",
                    samples: "ALL",
                    genomeBuild: "GRCh37",
                    maskDefinitions: [
                        {
                            id: 1, //integer, required
                            name: "Fetch Data", //required
                            description: "Default", //required
                            genome_build: "GRCh37",
                            group_type: "GENE",
                            identifier_type: "ENSEMBL",
                            groups: {
                                VARIANTS: variants
                            }
                        }
                    ]
                };
            }

            //console.log("query", query);
            let json = await fetch(
                "https://ld.hugeamp.org/aggregation/covariance",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(query)
                }
            )
                .then(resp => {
                    if (resp.ok) {
                        return resp.json();
                    } else {
                        throw new Error("Request to LD server failed");
                    }
                })
                .then(json => {
                    // Use the returned covariance data to run aggregation tests and return results (note that runner.run() returns a Promise)
                    const [
                        groups,
                        variants
                    ] = raremetal.helpers.parsePortalJSON(json);
                    const runner = new raremetal.helpers.PortalTestRunner(
                        groups,
                        variants,
                        tests
                        //[
                        // One or more test names can be specified!
                        //"burden",
                        //"skat-o"
                        //"vt"
                        //]
                    );
                    console.log("here run");
                    return runner.run();
                });
            //.then(resp => resp);

            return [{ phenotype: phenotype }, { data: json }];
        },
        async runTests(context, { variants, phenotypes, dataset, tests }) {
            console.log("running tests");
            console.log("p", phenotypes);
            if (!tests || !tests.length) {
                tests = ["burden"]; //if no test is selected, just run burden by default
            }
            let queries = phenotypes.map(phenotype =>
                context.dispatch("getCovariances", {
                    variants,
                    phenotype,
                    dataset,
                    tests
                })
            );
            let data = await Promise.all(queries);

            context.commit("setCovariances", data);
        }
    }
};
