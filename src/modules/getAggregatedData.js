import jp from "jsonpath"

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            aggregatedData: {},
            call: "phenotypes",
        };
    },

    // commit methods
    mutations: {
        setAggregatedData(state, json) {
            state.aggregatedData = json;
        },
        setCall(state, call) {
            state.call = call;
        },
    },

    // dispatch methods
    actions: {

        async getAggregatedData(context, { mdv, chrom, start, end, phenotype, var_id }) {
            let call = context.state.call;
            let body = {};
            //input JSON
            if (call == "phenotypes") {
                body = {
                    version: mdv,
                    pagination: { "size": 50, "offset": 0 },
                    filters: [
                        {
                            parameter: "chrom",
                            operator: "eq",
                            value: chrom
                        },
                        {
                            parameter: "pos",
                            operator: "ge",
                            value: start
                        },
                        {
                            parameter: "pos",
                            operator: "le",
                            value: end
                        }
                    ],
                    topVariants: true,
                    sort: [{ "parameter": "P_VALUE" }]
                };
            }
            else if (call == "variants") {
                body = {
                    version: mdv,
                    pagination: { "size": 50, "offset": 0 },
                    filters: [
                        {
                            parameter: "phenotype",
                            operator: "eq",
                            value: phenotype
                        },
                        {
                            parameter: "chrom",
                            operator: "eq",
                            value: chrom
                        },
                        {
                            parameter: "pos",
                            operator: "ge",
                            value: start
                        },
                        {
                            parameter: "pos",
                            operator: "le",
                            value: end
                        }
                    ],
                    topVariants: false
                };
            }
            else if (context.state.call == "PheWAS") {

                body = {
                    version: mdv,
                    filters: [
                        {
                            parameter: "var_id",
                            operator: "eq",
                            value: var_id
                        },
                    ],
                    topVariants: false
                };

            }
            // download the variants
            let variantJson = fetch(`/dccservices/getAggregatedData/` + call, {
                method: "POST",
                body: JSON.stringify(body)
            })
                .then(resp => resp.json())
                .then(aggregatedData => context.commit("setAggregatedData", aggregatedData))
                .catch(error => console.log(error.message));
        }
    },
};
