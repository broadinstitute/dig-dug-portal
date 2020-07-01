/**
 * This is the module to pull data through Lunaris.

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
        async getDataFromLunaris(context, arg) {

            let json = await fetch(`http://34.71.240.244:8080/lunaris/query`, {
                method: 'POST', // or 'PUT'
                body: JSON.stringify(arg),
            }).then(resp => resp.text());
            // set the data
            context.commit('setDataFromLunaris', json)
        },
    }
}
