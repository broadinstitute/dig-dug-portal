import Vue from "vue";

import keyParams from "@/utils/keyParams"

import store from "./store"
import Template from "./Template.vue";
import IGV from "@/components/igv/IGV.vue"
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack.vue"
import IGVIntervalTrack from "@/components/igv/tracks/IGVIntervalTrack.vue"
import IGVCredibleVariantsTrack from "@/components/igv/tracks/IGVCredibleVariantsTrack.vue"

import TissueSelectPicker from "@/components/TissueSelectPicker"
import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker"

import * as _ from "lodash";

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        IGV,
        IGVAssociationsTrack,
        IGVIntervalTrack,
        IGVCredibleVariantsTrack,
        TissueSelectPicker,
        CredibleSetSelectPicker,
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
    mounted() {
        this.$store.dispatch('regions/query',{
            q: `${keyParams.chr}:${keyParams.start}-${keyParams.end}`
        });
        this.$store.dispatch('credibleSets/query',{
            q: `${keyParams.phenotype},${keyParams.chr}:${keyParams.start}-${keyParams.end}`
        });
    },
    computed: {
        tissues() {
            return _.uniqBy(this.$store.state.regions.data.filter(interval => !!interval.tissue).map(interval => interval.tissue), 'id');
        },
        credibleSets() {
            return this.$store.state.credibleSets.data;
        },
    },
    methods: {
        removeVariant: function (variant) {
            this.variantSelections = this.variantSelections.filter(variantName => variant !== variantName)
        },

        addCredibleSetsTrack: function () {
            this.$children[0].$refs.igv.addIGVTrack(IGVCredibleVariantsTrack, {
                data: {
                    phenotype: keyParams.phenotype,
                    credibleSetId: this.$store.state.currentCredibleSet,
                    visualization: this.trackPhenotypeVisualization,
                }
            });
        },

        addIntervalsTrack: function () {
            this.$children[0].$refs.igv.addIGVTrack(IGVIntervalTrack, {
                data: {
                    tissue: this.$store.state.currentTissue,
                }
            });
        },

    },
    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
