import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import regionUtils from "@/utils/regionUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        geneOrRegion: null,
        invalidGeneOrRegion: false,
    },
    mutations: {
        setInvalidGeneOrRegion(state, flag) {
            state.invalidGeneOrRegion = flag;
        },
    },
    state: {},
    actions: {
        async onPhenotypeChange(context, phenotype) {
            window.location.href = "./phenotype.html?phenotype=" + phenotype.name;
        },

        async exploreRegion(context) {
            let locus = await regionUtils.parseRegion(context.state.geneOrRegion);

            if (locus) {
                window.location.href = `./gene.html?chr=${locus.chr}&start=${locus.start}&end=${locus.end}`;
            } else {
                context.commit('setInvalidGeneOrRegion', true);
            }
        }
    }
});
