import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

import Documentation from "@/components/Documentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel"
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import AssociationsTable from "@/components/AssociationsTable.vue";
import PosteriorProbabilityPlot from "@/components/PosteriorProbabilityPlot.vue";
import ConfidenceIntervalPlot from "@/components/ConfidenceIntervalPlot.vue";
import ForestPlot from "@/components/ForestPlot.vue";
import uiUtils from "@/utils/uiUtils";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        Alert,
        Documentation,
        Autocomplete,
        LocusZoom,
        LocusZoomAssociationsPanel,
        GeneSelectPicker,
        PhenotypeSelectPicker,
        AssociationsTable,
        PosteriorProbabilityPlot,
        ConfidenceIntervalPlot,
        ForestPlot
    },

    data() {
        return {
            counter: 0,
            showAssociations: false,
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
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,


        updateAssociationsTable(data) {

            this.$store.commit(`associations/setResponse`, data);
        },
        posteriorProbability(prior, beta, stdErr) {
            let w = 0.0462
            let v = Math.pow(stdErr, 2);
            let f1 = v / (v + w);
            let sqrt_f1 = Math.sqrt(f1);
            let f2 = w * Math.pow(beta, 2);
            let f3 = 2 * v * (v + w);
            let f4 = f2 / f3;
            let bayes_factor = sqrt_f1 * Math.exp(f4);
            let f5 = prior / (1 - prior);
            let p0 = bayes_factor * f5;
            let ppa = p0 / (1 + p0);
            return { "ppa": ppa, "bayes_factor": bayes_factor };
        },

        calculateCategoryScore(category) {
            let score = 1
            if (category == "WEAK") {
                score = 1;
            }
            else if (category == "POSSIBLE") {
                score = 2;
            }
            else if (category == "MODERATE") {
                score = 3;
            }
            else if (category == "STRONG") {
                score = 4;
            }
            else if (category == "CAUSAL") {
                score = 5;
            }
            else if (category == "No") {
                score = 0;
            }
            return score;
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
            return { "category": "CAUSAL", "evidence": "Strong Coding Evidence", "genetic": "1C" }
        },
        documentationMap() {
            let gene = this.$store.state.geneName;
            let phenotype = this.$store.state.phenotype.description;

            return {
                gene: gene,
                phenotype: phenotype
            }
        },



        rareVariationCategoryAndScore() {
            let prior = 0.20;
            let d = this.$store.state.geneAssociations52k.data[0].masks.sort(
                (a, b) => a.pValue - b.pValue
            );
            let mostSignificantMask = d[0];
            let stdErr = mostSignificantMask.stdErr;
            let beta;
            if (this.$store.state.phenotype.isDichotomous) {
                beta = mostSignificantMask.beta;
            } else {
                beta = Math.log(mostSignificantMask.oddsRatio);
            }
            let ppa = this.posteriorProbability(prior, beta, stdErr).ppa;
            let bayes_factor = this.posteriorProbability(prior, beta, stdErr).bayes_factor;
            let category = "";

            if (ppa < 0.30 && bayes_factor > 1) {
                category = "WEAK"

            }
            else if (ppa >= 0.30 && ppa < 0.50) {
                category = "POSSIBLE"
            }
            else if (ppa >= 0.50 && ppa < 0.70) {
                category = "MODERATE"
            }
            else if (ppa >= 0.70 && ppa < 0.90) {
                category = "STRONG"
            }
            else if (ppa >= 0.90) {
                category = "CAUSAL"
            }
            else if (bayes_factor < 1) {
                category = "No"
            }
            let categoryScore = this.calculateCategoryScore(category);
            return { "category": category, "categoryScore": categoryScore };
        },
        commonVariationCategoryAndScore() {
            let category = this.$store.state.effectorGeneData.category;
            let categoryScore = this.calculateCategoryScore(category);
            return { "category": category, "categoryScore": categoryScore };
        },

        finalCategory() {
            let finalCategory = "";
            if (
                this.rareVariationCategoryAndScore.categoryScore +
                this.commonVariationCategoryAndScore.categoryScore >=
                5
            ) {
                finalCategory = "CAUSAL";
            }
            else if (
                this.rareVariationCategoryAndScore.categoryScore +
                this.commonVariationCategoryAndScore.categoryScore ==
                4
            ) {
                finalCategory = "STRONG";
            }
            else if (
                this.rareVariationCategoryAndScore.categoryScore +
                this.commonVariationCategoryAndScore.categoryScore ==
                3
            ) {
                finalCategory = "MODERATE";
            }
            else if (
                this.rareVariationCategoryAndScore.categoryScore +
                this.commonVariationCategoryAndScore.categoryScore ==
                2
            ) {
                finalCategory = "POSSIBLE";
            }
            else if (
                this.rareVariationCategoryAndScore.categoryScore +
                this.commonVariationCategoryAndScore.categoryScore ==
                1
            ) {
                finalCategory = "WEAK";
            }
            else if (
                this.rareVariationCategoryAndScore.categoryScore +
                this.commonVariationCategoryAndScore.categoryScore ==
                0
            ) {
                finalCategory = "No Evidence";
            }
            return finalCategory;
        }


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
