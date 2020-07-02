import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';



import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasForestPanel";
import LocusZoomChild from "@/components/lz/panels/LocusZoomChild";

Vue.config.productionTip = false;
new Vue({
    store,
    components: {
        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomPhewasPanel,
    },

    data() {
        return {
            phenotypes: ['T2D', 'BMI'],
            addPhenotype: '',
            removePhenotype: '',
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
    methods: {
        addAssociationsPanel(event) {
            this.$children[0].$refs.locuszoom.addAssociationsPanel('T2D')
        },
        addCredibleVariantsPanel(event) {
            // TODO
            this.$children[0].$refs.locuszoom.addAssociationsPanel('T2D')
        },
        addIntervalsPanel(event) {
            this.$children[0].$refs.locuszoom.addIntervalsPanel(event)
        },
        addAPhenotype() {
            console.log(this.addPhenotype);
            this.phenotypes.push(this.addPhenotype);
        },
        removeAPhenotype() {
            console.log(this.removePhenotype);
            this.phenotypes = this.phenotypes.filter(p => p !== this.removePhenotype);
        }
     },

    computed: {
        globalEnrichmentAnnotations() {
            // an array of annotations
            return _.uniqBy(this.$store.state.globalEnrichment.data, el => JSON.stringify([el.annotation, !!el.method ? el.method : ''].join()));
        },

        tissues() {
            // an array of tissue
            return _.uniq(this.$store.state.globalEnrichment.data.filter(interval => !!interval.tissue).map(interval => interval.tissue));
        },

        // TODO: refactor into IGV Utils
        tissueColorScheme() {
            return d3.scaleOrdinal().domain(this.tissues).range(d3.schemeSet1);
        },

        tissueScoring() {
            let groups = {};

            for (let i in this.$store.state.globalEnrichment.data) {
                let r = this.$store.state.globalEnrichment.data[i];
                let t = r.tissueId || "NA";
                let m = r.method || "NA";

                let key = `${t}_${m}_${r.annotation}`;
                let group = groups[key];
                let fold = r.SNPs / r.expectedSNPs;

                if (!group) {
                    groups[key] = {
                        minP: r.pValue,
                        maxFold: fold,
                    };
                } else {
                    group.minP = Math.min(group.minP, r.pValue);
                    group.maxFold = Math.max(group.maxFold, fold);
                }
            }

            return groups;
        },
    },

}).$mount("#app");
