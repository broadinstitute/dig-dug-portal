import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons, BIconMouse2 } from "bootstrap-vue";
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
import ColorBarPlot from "@/components/ColorBarPlot.vue";
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
        ForestPlot,
        ColorBarPlot,
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

            this.$store.commit(`associations/setResponse`, { data });
        },
        bayes_factor(beta, stdErr) {
            let w = 0.3696;
            let v = Math.pow(stdErr, 2);
            let f1 = v / (v + w);
            let sqrt_f1 = Math.sqrt(f1);
            let f2 = w * Math.pow(beta, 2);
            let f3 = 2 * v * (v + w);
            let f4 = f2 / f3;
            let bayes_factor = sqrt_f1 * Math.exp(f4);
            return bayes_factor;
        },

        calculateCategoryScore(category) {
            let score;
            if (category == "WEAK") {
                score = 1;
                return score;
            }
            else if (category == "POSSIBLE") {
                score = 2;
                return score;
            }
            else if (category == "MODERATE") {
                score = 3;
                return score;
            }
            else if (category == "STRONG") {
                score = 4;
                return score;
            }
            else if (category == "CAUSAL") {
                score = 5;
                return score;
            }
            else if (category == "No") {
                score = 0;
                return score;
            }

        },
        calculateCombinedVariationABF(rareVariationABF, commonVariationABF) {
            let combinedVariationABF = 1;
            combinedVariationABF = rareVariationABF * commonVariationABF;
            return combinedVariationABF;
        },
        //determine categories using cutoffs for bayes factor - can be used for rare of common or combined
        // Weak: ABF >= 2.1
        // Potential: ABF >= 7.26
        // Possible: ABF >= 16.5
        // Moderate: ABF >= 36.3
        // Strong: ABF > 82.5
        // Causal: ABF > 1, 650
        determineCategory(bayes_factor) {
            let category;
            let categorymap = {};
            if (bayes_factor < 2.1) {
                category = "No"
                categorymap = {
                    "category": category, "categoryScore": bayes_factor
                }
            }
            else if (bayes_factor >= 2.1 && bayes_factor < 7.26) {
                category = "Weak"
                categorymap = {
                    "category": category, "categoryScore": bayes_factor
                }
            }
            else if (bayes_factor >= 7.26 && bayes_factor < 16.5) {
                category = "Potential"
                categorymap = {
                    "category": category, "categoryScore": bayes_factor
                }
            }
            else if (bayes_factor >= 16.5 && bayes_factor < 36.3) {
                category = "Possible"
                categorymap = {
                    "category": category, "categoryScore": bayes_factor
                }
            }
            else if (bayes_factor >= 36.3 && bayes_factor < 82.5) {
                category = "Moderate"
                categorymap = {
                    "category": category, "categoryScore": bayes_factor
                }
            }
            else if (bayes_factor >= 82.5 && bayes_factor < 1650) {
                category = "Strong"
                categorymap = {
                    "category": category, "categoryScore": bayes_factor
                }
            }
            else if (bayes_factor >= 1650) {
                category = "Causal"
                categorymap = {
                    "category": category, "categoryScore": bayes_factor
                }
            }
            return categorymap;
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
            if (!!this.$store.state.associations.data.length) {
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
            if (!!this.$store.state.associations.data.length) {
                let data = this.$store.state.associations.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].pValue <= 5e-8) {
                        return true;
                    }
                }
                return false;
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

        eglData() {
            let geneSymbol = this.$store.state.geneName;
            if (!!this.$store.state.kp4cd.eglData.data) {
                let effectordata = this.$store.state.kp4cd.eglData.data;
                let effectorGeneData = {}

                for (var i = 0; i < effectordata.length; ++i) {
                    if (effectordata[i].gene.toLowerCase() === geneSymbol.toLowerCase()) {
                        effectorGeneData = effectordata[i];

                        if (effectorGeneData.category == "(T2D_related)") {
                            effectorGeneData.category = "No"
                        }
                        break;
                    }
                    else {
                        effectorGeneData["category"] = "in GWAS"
                    }
                }
                return effectorGeneData;
            }
        },

        //if GWAS Significant? -> yes -> Mccarthy list in T2D -> get the eglData (get the evidence and category)  ->Mccarthy list as T2D_unrelated -> "in GWAS"
        // if not GWAS Significant -> category -> No Evidence:
        //now calculate the ABF based on this.
        commonVariationABF() {
            let commonVariationABF = 1;
            if (this.isSignificantAssociationCommonVariation) {
                let abf1 = 1;
                let abf2 = 1;
                let abf3 = 1;
                //abf = 3 if its in GWAS (essentially it has significant common variation)
                if (this.eglData.genetic == "1C") {
                    abf1 = 500 * 3.3;
                }
                if (this.eglData.genetic == "2C" || this.eglData.regulatory == "2R") {
                    abf2 = 5 * 3.3;
                }
                if (this.eglData.perturbational == "3P" || this.eglData.regulatory == "3R") {
                    abf3 = 2.2 * 3.3
                }
                else if (!this.eglData) {
                    abf1 = 3.3
                    //return commonVariationABF;
                }
                commonVariationABF = abf1 * abf2 * abf3
            }
            return commonVariationABF;
        },

        //calculate only if its not exome wide significant
        //if ABF is <1, then we will set the ABF =1 - which means no change (when multiplied by common abf)
        rareVariationABF() {
            let masks = [];

            let rare_bayes_factor = 1;
            if (this.isSignificant52kAssociationRareVariation) {
                rare_bayes_factor = 1650;
            }
            else {
                if (!!this.$store.state.geneAssociations52k.data[0]) {
                    masks = this.$store.state.geneAssociations52k.data[0].masks
                    let d = masks.sort(
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

                    rare_bayes_factor = this.bayes_factor(beta, stdErr);
                }
            }

            return rare_bayes_factor;
        },

        combinedVariationABF() {
            return this.calculateCombinedVariationABF(this.rareVariationABF, this.commonVariationABF)
        },
        combinedVariationCategory() {
            let bayes_factor = this.calculateCombinedVariationABF(this.rareVariationABF, this.commonVariationABF)
            let categorymap = {}
            categorymap = this.determineCategory(bayes_factor);
            return categorymap;

        },
        commonVariationCategory() {
            let categorymap = {};

            if (!!this.eglData) {
                let bayes_factor = this.commonVariationABF
                categorymap = this.determineCategory(bayes_factor);
            }

            return categorymap;
        },

        rareVariationCategory() {
            let categorymap = {};
            let bayes_factor = this.rareVariationABF
            if (!!this.$store.state.geneAssociations52k.data[0]) {
                categorymap = this.determineCategory(bayes_factor);
            }

            return categorymap;
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
            let rareVariationEvidence;
            let priorVariance = this.$store.state.priorVariance;

            let abf;
            if (!!this.$store.state.geneAssociations52k.data[0]) {
                rareVariationEvidence = this.rareVariationCategory.category;
                abf = this.rareVariationABF;
            }
            return {
                gene: gene,
                phenotype: phenotype,
                category: rareVariationEvidence,
                abf: abf,
                priorVariance: priorVariance
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
        // the canonical symbol was found
        symbolName(symbol) {
            this.$store.dispatch("query52kGeneAssociations", symbol);
        },
        "$store.state.phenotype": function (phenotype) {
            this.$store.dispatch("queryGeneName");
            uiUtils.hideElement("phenotypeSearchHolder");
        },

    }
}).$mount("#app");
