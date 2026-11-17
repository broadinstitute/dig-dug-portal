import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import variantUtils from "@/utils/variantUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        geneSamples: bioIndex("gene-samples", { query_private: true }),
        variantSamples: bioIndex("variant-sample", { query_private: true })
    },
    actions: {
        async queryGeneSamples(context, gene) {
            let name = String(gene || keyParams.gene || "").trim();

            if (!!name) {
                await context.dispatch("geneSamples/query", { q: name.toUpperCase() });
            }
        },
        async queryVariantSamples(context, variantId) {
            let query = String(variantId || keyParams.query || "").trim();
            let varId = variantUtils.parseVariant(query) || query;

            if (!!varId) {
                await context.dispatch("variantSamples/query", { q: varId });
            }
        }
    }
});
