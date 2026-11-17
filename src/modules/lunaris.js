import queryString from "query-string";
import host from "@/utils/hostUtils";

export default {
    namespaced: true,

    state() {
        return {
            dataFromLunaris: []
        };
    },

    mutations: {
        setDataFromLunaris(state, dataFromLunaris) {
            state.dataFromLunaris = dataFromLunaris;
        }
    },

    actions: {
        async getDataFromLunaris(context, arg) {
            let json = await fetch(
                `https://lunaris.hugeamp.org/lunaris/query`,
                {
                    method: "POST",
                    body: JSON.stringify(arg)
                }
            ).then(resp => resp.text());
            context.commit("setDataFromLunaris", json);
        }
    }
};
