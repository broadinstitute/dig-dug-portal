import Vue from "vue";
import Vuex from "vuex";
import bioPortal from "../../../../modules/bioPortal";
import bioIndex from "../../../../modules/bioIndex";
import kp4cd from "../../../../modules/kp4cd";
import keyParams from "../../../../utils/keyParams";
import bioIndexUtils from "../../../../utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "../../../../utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        tissueKeys: []
    },

    mutations: {},

    getters: {
    },

    actions: {
        async getTissueKeys(context) {
            let tissues = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/diff-exp/2?columns=tissue`)
                .then(resp => resp.json())
                .then(json => {
                    if (json.count == 0) {
                        return null;
                    }
                    return json.keys.map(key => key[0])
                });
            context.state.tissueKeys = tissues;
        },
    },
});
