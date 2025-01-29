import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import regionUtils from "@/utils/regionUtils";
import variantUtils from "@/utils/variantUtils";
import { postAlertError } from "@/components/Alert.vue";
import { match } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd
    },
    state: {
        geneOrRegionOrVariant: null,
        invalidGeneOrRegionOrVariant: false,
        userInput: null,
        matchingGenes: null
    },
    mutations: {
        setInvalidGeneOrRegionOrVariant(state, flag) {
            state.invalidGeneOrRegionOrVariant = flag;
        },
        setExample(state, example) {
            state.geneOrRegionOrVariant = example;
        },
        setMatchingGenes(state, genes) {
            state.matchingGenes = genes;
        }
    },

    actions: {
        async onPhenotypeChange(context, phenotype) {
            window.location.href =
                "./phenotype.html?phenotype=" + phenotype.name;
        },

        async exploreRegionOrVariant(context, input) {
            let locus = await regionUtils.parseRegion(input, true, 50000);
            let varID = await variantUtils.parseVariant(input);

            if (locus) {
                window.location.href = `./region.html?chr=${locus.chr}&start=${locus.start}&end=${locus.end}`;
            } else if (varID) {
                window.location.href = `./variant.html?variant=${varID}`;
            } else {
                postAlertError("Invalid gene, variant, or region");
            }
        },

        async lookupGenes(context, input) {
            let matches = await match("gene", input, { limit: 10 });
            context.commit("setMatchingGenes", matches);
        },

        //select gene on autocomplete.
        async onGeneChange(context, gene) {
            //go to gene page instead of region page, unlike main portals
            window.location.href = `/gene.html?gene=${gene}`;
        },

        //select gene on autocomplete.
        async onDatasetChange(context, dataset) {
            window.location.href = "./dinspector.html?dataset=" + dataset.name;
        }
    }
});
