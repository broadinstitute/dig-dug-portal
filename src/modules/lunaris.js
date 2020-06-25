/**
 * This is the module that is used to pull the news feed for KPN website

 */
import queryString from 'query-string';
import host from '@/utils/hostUtils';

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            dataFromLunaris: [],
        };
    },

    // commit methods
    mutations: {
        setDataFromLunaris(state, dataFromLunaris) {
            state.dataFromLunaris = dataFromLunaris;
        },
    },

    // dispatch methods
    actions: {
        async getDataFromLunaris(context, lunarisQueryInfo) {

            let arg = {
                "id": "requestMinimalTsv",
                "regions": {
                    "1": [
                        {
                            "begin": 100000,
                            "end": 200000
                        }
                    ]
                },
                "recipe": {
                    "read": {
                        "file": "gs://fc-6fe31e1f-2c36-411c-bf23-60656d621184/data/t2d/variants.tsv.gz",
                        "idField": "varId",
                        "tool": "IndexedRecordReader"
                    },
                    "write": {
                        "from": "read",
                        "file": "responseMinimalTsv.json",
                        "tool": "JSONWriter"
                    }
                }
            };

            let json = await fetch(`http://34.71.240.244:8080/lunaris/query`, arg)
                .then(resp => resp.json());
            // set the data
            context.commit('setDataFromLunaris', json)
        },
    }
}
