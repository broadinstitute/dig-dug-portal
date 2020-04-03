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
        geneOrRegion: null,
        invalidGeneOrRegion: false,
        varID: null,
        // fix this infure
        // invalidVarID: false,
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
        },

        async exploreVariant(context) {
            let variantID = context.state.variantID
            let chr = variantID.split(":")[0]
            let position = variantID.split(":")[1]
            let ref = variantID.split(":")[2]
            let alt = variantID.split(":")[3]
            let varID = { chr, position, ref, alt }
            // let varID = variantUtils.parseVariantID(context.state.variantID)
            window.location.href = `./variant.html?chr=${varID.chr}&position=${varID.position}&ref=${varID.ref}&alt=${varID.alt}`;
        }
    }
});
