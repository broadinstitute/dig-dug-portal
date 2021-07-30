import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import Documentation from "@/components/Documentation.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import AssociationsTable from "@/components/AssociationsTable";

import { pageMixin } from "@/mixins/pageMixin";

Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        Documentation,
        GeneSelectPicker,
        AssociationsTable
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return { regionPageSearchCriterion: [] };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        //this.initCriteria();
    },
    computed: {
        allphenotypes() {
            let phenotypes = this.$store.state.bioPortal.phenotypes;
            let permittedValues = [];
            phenotypes.map(value => {
                permittedValues.push(value.name);
            });
            return permittedValues;
        },

        documentationMap() {
            return {
                phenotype:
                    this.$store.state.phenotype &&
                    this.$store.state.phenotype.description
            };
        },

        genes() {
            return this.$store.state.genes.data.filter(function(gene) {
                return gene.source == "symbol";
            });
        },

        phenotypes() {
            return [this.$store.state.phenotype];
        },

        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },

        credibleSets() {
            return this.$store.state.credibleSets.data;
        },

        regionString() {
            let chr = this.$store.state.chr;
            let start = parseInt(this.$store.state.start);
            let end = parseInt(this.$store.state.end);
            return Formatters.locusFormatter(chr, start, end);
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }
            // region loaded, hide search
            uiUtils.hideElement("regionSearchHolder");
            // convert to an array, sorted by p-value
            let x = Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);

            return x;
        },
        globalEnrichmentAnnotations() {
            // an array of annotations
            let annotations = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                el => el.annotation
            );
            return annotations;
        },
        globalEnrichmentTissues() {
            let tissues = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                el => el.tissue
            );
            //sort the tissues
            return tissues;
        },
        associationConsequences() {
            return this.pageAssociations.map(v => v.consequence);
        },
        associationNearestGenes() {
            return this.pageAssociations.flatMap(assoc => assoc.nearest);
        },
        selectedPhenotypes() {
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            if (Object.keys(phenotypeMap).length === 0) {
                return [];
            }

            return this.regionPageSearchCriterion
                .filter(criterion => criterion.field === "phenotype")
                .map(criterion => phenotypeMap[criterion.threshold]);
        }
    },
    methods: {},
    watch: {}
}).$mount("#app");
