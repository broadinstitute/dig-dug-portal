import Vue from "vue";
import store from "./store"
import Template from "./Template.vue";

import IGV from "@/components/igv/IGV.vue"
import IGVTrack from "@/components/igv/IGVTrack.vue"
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack.vue"

import { cloneDeep } from "lodash";

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        IGV,
        IGVTrack,
        IGVAssociationsTrack,
    },

    data() {
        return {
            nums: 3,
        }
    },

    methods: {
        associationsForIGV: function (associations) {
            return associations.map(association => {
                const annotation = cloneDeep(association);
                annotation['chromosome'] = undefined;
                annotation['position'] = undefined;
                return {
                    chr: association.chromosome,
                    start: association.position,
                    end: association.position,
                    ...annotation,
                    // for GWAS:
                    value: association.pValue,
                }
            });
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
