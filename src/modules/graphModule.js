/**
 * This is the base module used for all KB graph end-points. All KB
 * end-points that access the graph database follow the same format:
 *
 *   /dccservices/graph/{output}/{method}/{format}?params
 *
 * To use this, import it and then call the resulting function with
 * the {output} type desired. For example:
 *
 *   import graphModule from "./graphModule"
 *
 *   // instantiate a new graphModule instance for a given type
 *   export default {
 *      ...graphModule('outputDataType', 'object'),
 *
 *      // rest of the module here
 *      getters: { ... },
 *      methods: { ... },
 *   }
 */

export default function (path, format) {
    return {
        namespaced: true,

        // initial module state
        state() {
            return {
                data: {},
            };
        },

        // commit methods
        mutations: {
            setData(state, data) {
                state.data = data;
            }
        },

        // dispatch methods
        actions: {
            async get(context, { method, queryParams }) {
                let qs = '';
                let fmt = format || "object";
                let json = await fetch(`/dccservices/graph/${path}/${method}/${fmt}?${qs}`)
                    .then(resp => resp.json());

                // set the data
                context.commit('setData', json)
            },
        },
    };
}
