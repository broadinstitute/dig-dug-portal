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
        }
    },

    // dispatch methods
    actions: {

        async getAggregatedData(context, { mdv, chrom, start, end, call }) {
            //input JSON
            if (call == "phenotypes") {
                let body = {
                    version: mdv,
                    pagination: { "size": 5000, "offset": 0 },
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

            // download the variants
            let variantJson = fetch(`/dccservices/getAggregatedData/` + call, {
                method: "POST",
                body: JSON.stringify(body)
            })
                .then(resp => resp.json())
                .then(aggregatedData => context.commit("aggregatedData", aggregatedData))
                .catch(error => console.log(error.message));
        }
    },
};
