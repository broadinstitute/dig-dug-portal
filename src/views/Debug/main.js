import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";


// imports the ESM module by default
import VueFlex from "vue-flex";
// Already autoprefixed for vendor prefixes.
// Also namespaced to avoid collisions.
import "vue-flex/dist/vue-flex.css";

Vue.use(VueFlex);

import ForestPlot from "@/components/ForestPlot";

Vue.config.productionTip = false;
new Vue({
    store,
    components: {
        ForestPlot
    },

    data() {
        return {
            phenotypes: ['T2D', 'BMI'],
            addPhenotype: '',
            removePhenotype: '',
        }
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("queryRegion");
        this.$store.dispatch("kp4cd/getForestPlotData");
    },
    mounted() {
        this.addAssociationsPanel({ phenotype: 'T2D' })
    },
    render(createElement, context) {
        return createElement(Template);
    },
    methods: {
        requestCredibleSets(eventData) {
            const { start, end } = eventData;
            if (!!start && !!end) {
                const queryString = `${this.$store.state.phenotype.name},${this.$store.state.chr}:${Number.parseInt(start)}-${Number.parseInt(end)}`
                this.$store.dispatch('credibleSets/query', { q: queryString });
            }
        },
        addAssociationsPanel(event) {
            const { phenotype } = event;
            let self = this;
            this.$children[0].$refs.locuszoom.addAssociationsPanel(phenotype,
                // next arg for dataLoaded callback, second arg for dataResolved callback, last arg for error callback
                function (dataLoadedResponse) {
                    self.$store.commit(`${dataLoadedResponse.index}/setResponse`, dataLoadedResponse);
                }
            );
        },
        addCredibleVariantsPanel(event) {
            const { phenotype, credibleSetId } = event;
            this.$children[0].$refs.locuszoom.addCredibleVariantsPanel(phenotype, credibleSetId,
                // next arg for dataLoaded callback, second arg for dataResolved callback, last arg for error callback
                function (dataLoadedResponse) {
                    // TODO: callbacks for creating a new table column for credible sets might go here
                }
            )
        },
        addComputedCredibleVariantsPanel(event) {
            const { phenotype } = event;
            this.$children[0].$refs.locuszoom.addComputedCredibleVariantsPanel(phenotype);
        },
        addAnnotationIntervalsPanel(event) {
            const { annotation, method } = event;
            this.$children[0].$refs.locuszoom.addAnnotationIntervalsPanel(annotation, method);
        },
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

        credibleSets() {
            return this.$store.state.credibleSets.data;
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            // TODO: I think the garbage collector is freaking out here
            for (let i in data) {
                let assoc = data[i];

                // skip associations not part of the disease group
                if (
                    !this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]
                ) {
                    continue;
                }

                let curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }
            // region loaded, hide search
            // convert to an array, sorted by p-value
            return Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
        },
        htmlForestPlotData() {
            let datasets = this.$store.state.kp4cd.forestPlotData;
            return datasets.data;
        },

    },

    render(createElement, context) {
        return createElement(Template);
    }
}).$mount("#app");
