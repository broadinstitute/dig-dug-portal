import Vue from "vue";
import store from "./store"
import Template from "./Template.vue";

import IGV from "@/components/igv/IGV.vue"
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack.vue"
import IGVIntervalTrack from "@/components/igv/tracks/IGVIntervalTrack.vue"
import IGVCredibleVariantsTrack from "@/components/igv/tracks/IGVCredibleVariantsTrack.vue"

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        IGV,
        IGVAssociationsTrack,
        IGVIntervalTrack,
        IGVCredibleVariantsTrack,
    },
    data() {
        return {
            trackPhenotype: '',
            trackPhenotypeVisualization: 'gwas',
            trackTissueDescription: '',
            variantSelections: [],
            phenotypes: ['BMI', 'T2D'],
            datasets: [],
        }
    },
    methods: {
        removeVariant: function (variant) {
            this.variantSelections = this.variantSelections.filter(variantName => variant !== variantName)
        },

        addAssociationsTrack: function () {
            this.$children[0].$refs.igv.addIGVTrack(IGVAssociationsTrack, {
                data: {
                    phenotype: this.trackPhenotype,
                    visualization: this.trackPhenotypeVisualization,
                }
            });
        },

        addIntervalsTrack: function () {
            this.$children[0].$refs.igv.addIGVTrack(IGVIntervalTrack, {
                data: {
                    tissue: this.trackTissueDescription,
                }
            });
        },

    },
    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
