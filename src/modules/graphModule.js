/**
 * This is the base module used for all KB graph end-points. All KB
 * end-points that access the graph database follow the same format:
 *
 *   /dccservices/graph/{output}/{method}/{format}?{params}
 *
 * To use this, import it and then call the resulting function with
 * the {output} type desired. For example:
 *
 *   import graphModule from "./graphModule"
 *
 *   // instantiate a new graphModule instance for a given type
 *   export default graphModule('phenotype', {
 *       getters: { ... },
 *       methods: { ... },
 *       actions: { ... },
 *   });
 *
 *   // instantiate a new graphModule for a type, but no overrides
 *   new Vuex.Store({
 *       modules: {
 *           phenotypeModule: graphModule('phenotype'),
 *       }
 *   },
 */

import merge from "lodash.merge"
import querystring from "querystring";

// Override the base module with an extended object that may contain
// additional actions, getters, methods, state, etc.

export default function (output, extend) {
    let module = {
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
            async query(context, { method, format, params }) {
                let qs = querystring.stringify(params);
                console.log(qs);
                let fmt = format || "object";
                let json = await fetch(`/dccservices/graph/${output}/${method}/${fmt}?${qs}`)
                    .then(resp => resp.json());

                // set the data
                context.commit('setData', json)
            },
        },
    };

    // override module settings
    return merge(module, extend || {});
}
