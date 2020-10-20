import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import FilterGroup from "@/components/Filter/FilterGroup.vue"
import FilterControl from "@/components/Filter/FilterControl.vue"
import FilterPValue from "@/components/Filter/FilterPValue.vue"
import FilterEffectDirection from "@/components/Filter/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue"

import { filterFromPredicates, predicateFromSpec } from "@/utils/filterHelpers";


import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;

new Vue({
    store,
    modules: {},
    components: {
        FilterGroup,
        FilterControl,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,
    },

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            counter: 0,
            showAssociations: false,
            filters: null,
            trait: "T2D"
        };
    },

    created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        filterFromPredicates,
        predicateMethod(predicate) {
            return predicate
        },
        testMethod(predicates) {
            this.filters = predicates;
        },
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,


        updateAssociationsTable(data) {

            this.$store.commit(`associations/setResponse`, data);
        },



    },
    mounted() {

    },

    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        region() {
            return this.$store.getters.region;
        },

        symbolName() {
            return this.$store.getters.canonicalSymbol;
        },

        gene() {
            let data = this.$store.state.gene;
            if (data.length > 0) {
                return data[0];
            }
            return {};
        },

        phenotypes() {
            return [this.$store.state.phenotype];
        },


        commonVariationCategory() {
            let data = $store.state.effectorGeneData
        },

        associationsData() {
            if (!!this.$store.state.associations.data) {
                let data = this.$store.state.associations.data;
                let filteredData = [];
                data.forEach(function (row) {
                    if (!!row.consequence) {
                        if (row.consequence == "missense_variant") {
                            filteredData.push(row);
                        }
                    }
                })
                return filteredData;
            }
        },
        //stage 1 - Significant association? (common Variation)
        //this makes sure the gene is in GWAS region or not
        isSignificantAssociationCommonVariation() {
            if (!!this.$store.state.associations.data) {
                let data = this.$store.state.associations.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].pValue <= 5e-8) {
                        return true;
                    }
                }
                return false;
            }

        },

        geneAssociations52k() {
            if (!!this.$store.state.geneAssociations52k) {
                if (!!this.$store.state.geneAssociations52k.data.length) {
                    let data = this.$store.state.geneAssociations52k.data;
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].phenotype == this.trait) {
                            return data[i];
                        }
                    }
                }
            }



        },

        geneAssociationsLoftee() {
            if (!!this.$store.state.geneAssociations52k.data.length) {
                let data = this.$store.state.geneAssociations52k.data;
                let lofteeData = [];
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == this.trait) {
                        data[i].masks.forEach(r => {
                            if (r.mask == "LofTee") {
                                lofteeData.push(r)
                            }
                        })
                    }
                }
                return lofteeData;
            }
        },


        isSignificant52kAssociationRareVariation() {
            if (!!this.$store.state.geneAssociations52k.data.length) {
                let data = this.$store.state.geneAssociations52k.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == this.trait) {
                        if (data[i].pValue <= 2.5e-6) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        //when the gene has significant association  (if exome wide significant)
        //(Rare Variation), that means there is Strong coding evidence
        //show the following instead of stage 2 plot
        stage2Category() {
            return { "category": "CAUSAL", "Evidence": "Strong Coding Evidence", "genetic": "1C" }
        },
        documentationMap() {
            let gene = this.$store.state.geneName;
            let phenotype = this.$store.state.phenotype.description;

            return {
                gene: gene,
                phenotype: phenotype
            }
        },
    },


    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        // the region for the gene was found
        region(region) {
            this.hideElement("variantSearchHolder");
            this.$store.dispatch("queryGeneRegion", region);
        },

    }
}).$mount("#app");
