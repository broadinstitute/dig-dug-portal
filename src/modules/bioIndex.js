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
                count: null,
                profile: {},
                userWantsAbort: null,
            };
        },

        getters: {
            percentComplete(state) {
                if (!state.count) {
                    return null;
                }

                return Math.min(state.data.length / state.count, 1.0);
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

            setAbort(state, flag) {
                state.userWantsAbort = flag;
            },

            appendData(state, json) {
                state.data = state.data.concat(json.data);
                state.profile.fetch += json.profile.fetch;
            },
        },

        // dispatch methods
        actions: {
            async count(context, { q }) {
                let qs = querystring.encode({q});
                let json  = await fetch(`${bioIndexHost}/api/count/${index}?${qs}`)
                    .then(resp => resp.json())
                    .catch(error => {count: null});

                context.commit('setCount', json.count);
            },

            async query(context, { q, all, limit, cont }) {
                let qs = querystring.encode({q, limit});

                // clear the abort flag
                context.commit('setAbort', false);

                // issue the request
                let action = (!!all) ? 'all' : 'query';
                let json = await fetch(`${bioIndexHost}/api/${action}/${index}?${qs}`)
                    .then(resp => resp.json());

                // set the data
                context.commit('setResponse', json);

                // loop until done or user aborts
                while (cont && !context.state.userWantsAbort && json.continuation) {
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
