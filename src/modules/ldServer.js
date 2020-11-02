/*
! LD Server specific data
*/

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
        async getCovariances({ state, commit }) {
            let variants = state.variants;
            let query = {
                chrom: "22",
                start: 50276998,
                stop: 50357719,
                genotypeDataset: 1,
                phenotypeDataset: 1,
                phenotype: "LDL",
                samples: "ALL",
                genomeBuild: "GRCh37",
                maskDefinitions: [
                    {
                        id: 10,
                        name: "On-the-fly mask",
                        description:
                            "Mask created on the fly, potentially by using a browser UI",
                        genome_build: "GRCh37",
                        group_type: "GENE",
                        identifier_type: "ENSEMBL",
                        groups: {
                            CRELD2: [
                                "22:50312454_C/T",
                                "22:50313452_C/T",
                                "22:50313465_C/A",
                                "22:50315537_A/G",
                                "22:50315971_C/G",
                                "22:50316015_C/T",
                                "22:50316301_A/G",
                                "22:50316902_G/A",
                                "22:50316906_C/T",
                                "22:50317418_C/T",
                                "22:50318061_G/C",
                                "22:50318402_C/T",
                                "22:50318757_C/T",
                                "22:50319373_C/T",
                                "22:50319968_G/A",
                                "22:50320921_G/A"
                            ]
                        }
                    }
                ]
            };
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
            ).then(resp => resp.json());

            commit("setCovariances", json.data);
        }
    }
};
