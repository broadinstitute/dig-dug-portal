import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import regionUtils from "@/utils/regionUtils";
import variantUtils from "@/utils/variantUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        geneOrRegionOrVariant: null,
        invalidGeneOrRegionOrVariant: false,
    },
    mutations: {
        setInvalidGeneOrRegionOrVariant(state, flag) {
            state.invalidGeneOrRegionOrVariant = flag;
        },

    },
    state: {},
    actions: {
        async onPhenotypeChange(context, phenotype) {
            window.location.href = "./phenotype.html?phenotype=" + phenotype.name;
        },

        async exploreRegionOrVariant(context) {
            let locus = await regionUtils.parseRegion(context.state.geneOrRegionOrVariant);
            let varID = await variantUtils.parseVariant(context.state.geneOrRegionOrVariant);

            if (locus) {
                window.location.href = `./gene.html?chr=${locus.chr}&start=${locus.start}&end=${locus.end}`;
            }
            if (varID) {

                window.location.href = `./variant.html?variant=${varID}`;
            }
            else {
                context.commit('setInvalidGeneOrRegionOrVariant', true);
            }

        }
    }
});
