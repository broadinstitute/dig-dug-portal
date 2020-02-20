import merge from "lodash.merge"
import querystring from "querystring"

// Override the base module with an extended object that may contain
// additional actions, getters, methods, state, etc.

const bioIndexHost = 'http://18.215.38.136:5000';

export default function (index, extend) {
    let module = {
        namespaced: true,

        // initial module state
        state() {
            return {
                data: [],
                count: undefined,
                profile: {},
            };
        },

        getters: {
            percentComplete(state) {
                if (!state.count) {
                    return undefined;
                }

                return Math.max(state.data.length / state.count, 1.0);
            }
        },

        // commit methods
        mutations: {
            setResponse(state, json) {
                state.data = json.data;
                state.profile = json.profile;
            },

            setCount(state, n) {
                state.count = n;
            },

            appendData(state, json) {
                state.data.concat(json.data);
                state.profile.fetch += json.profile.fetch;
            }
        },

        // dispatch methods
        actions: {
            async count(context, { q }) {
                let json  = await fetch(`${bioIndexHost}/api/count/${index}?${qs}`)
                    .then(resp => resp.json())
                    .catch(() => {count: undefined});

                context.commit('setCount', json.count);
            },

            async query(context, { q, all, limit, cont }) {
                let qs = querystring.encode({q, limit});

                let action = (!!all) ? 'all' : 'query';
                let json = await fetch(`${bioIndexHost}/api/${action}/${index}?${qs}`)
                    .then(resp => resp.json());

                // set the data
                context.commit('setResponse', json);

                while (cont && json.continuation) {
                    qs = querystring.encode({token: json.continuation});
                    json = await fetch(`${bioIndexHost}/api/cont?${qs}`)
                        .then(resp => resp.json());

                    context.commit('appendData', json);
                }
            },
        },
    };

    // override module settings
    return merge(module, extend || {});
}
