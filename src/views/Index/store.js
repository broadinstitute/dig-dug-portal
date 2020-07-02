import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import regionUtils from "@/utils/regionUtils";
import variantUtils from "@/utils/variantUtils";
import { postAlertError } from "@/components/Alert.vue";

Vue.use(Vuex);

export default new Vuex.Store({

    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        geneOrRegionOrVariant: null,
        invalidGeneOrRegionOrVariant: false,
        userInput: null,
    },
    mutations: {
        setInvalidGeneOrRegionOrVariant(state, flag) {
            state.invalidGeneOrRegionOrVariant = flag;
        },
        setExample(state, example) {
            state.geneOrRegionOrVariant = example;
        },
        

    },

    actions: {
        async onPhenotypeChange(context, phenotype) {
            window.location.href = "./phenotype.html?phenotype=" + phenotype.name;
        },

        async exploreRegionOrVariant(context) {
            let locus = await regionUtils.parseRegion(context.state.geneOrRegionOrVariant, true, 50000);
            let varID = await variantUtils.parseVariant(context.state.geneOrRegionOrVariant);

            if (locus) {
                if (locus.gene) {
                    window.location.href = `./gene.html?gene=${locus.gene}`;
                }
                else {
                    window.location.href = `./region.html?chr=${locus.chr}&start=${locus.start}&end=${locus.end}`;
                }
            }
            else if (varID) {
                window.location.href = `./variant.html?variant=${varID}`;
            } else {
                postAlertError("Invalid gene, variant, or region");
            }

        },

        //select gene on autocomplete.
        async onGeneChange(context, gene) {
            window.location.href = "./gene.html?gene=" + gene;
        },
    }
});
