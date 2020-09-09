import Vue from "vue";
import * as d3 from "d3";

import Template from "./Template.vue";
import store from "./store.js";

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import LocusZoom from "@/components/lz/LocusZoom";

import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker"
import AnnotationMethodSelectPicker from "@/components/AnnotationMethodSelectPicker"
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker"

Vue.config.productionTip = false;
new Vue({
    store,
    components: {
        LocusZoom,

        CredibleSetSelectPicker,
        AnnotationMethodSelectPicker,
        PhenotypeSelectPicker,
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

    },
    watch: {
        topAssociations(top) {
            if (!this.selectedPhenotype && top.length > 0) {
                let topAssoc = top[0];
                let topPhenotype = this.$store.state.bioPortal.phenotypeMap[
                    topAssoc.phenotype
                ];
                this.$store.commit("setSelectedPhenotype", topPhenotype);
            }
        },
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let param = this.$store.state.phenotypeParam;

            // if there's a phenotypeParam, then pick that phenotype
            if (param) {
                let phenotype = phenotypeMap[param];

                if (phenotype) {
                    this.$store.commit("setSelectedPhenotype", phenotype);
                }
            } else {
                console.log('no phenotype param')
            }
        },
        "$store.state.phenotype": function (phenotype) {
            // this.$store.dispatch('associations/query', { q: `${this.$store.state.phenotype.name},${this.$store.state.chr}:${this.$store.state.start}-${this.$store.state.end}` });
            this.$store.dispatch('globalEnrichment/query', { q: this.$store.state.phenotype.name });
            this.$store.dispatch('credibleSets/query', { q: `${this.$store.state.phenotype.name},${this.$store.state.chr}:${this.$store.state.start}-${this.$store.state.end}` });
        },
    }

}).$mount("#app");
