import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GenesetSelectPicker from "@/components/GenesetSelectPicker.vue";
import SigmaSelectPicker from "@/components/SigmaSelectPicker.vue";
import GenesetSizeSelectPicker from "@/components/GenesetSizeSelectPicker.vue";
import PigeanTable from "@/components/PigeanTable.vue";
import PigeanBayesTable from "@/components/PigeanBayesTable.vue";
import PigeanPlot from "@/components/PigeanPlot.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";

import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        SearchHeaderWrapper,
        PigeanTable,
        PigeanBayesTable,
        PigeanPlot,
        ResearchPheWAS,
        GenesetSelectPicker,
        SigmaSelectPicker,
        GenesetSizeSelectPicker,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
    },

    data() {
        return {
            testGenes : [
                "INS", "IGF1", "IRS1", "PIK3CA", "AKT1", "GSK3B", "FOXO1",
                "GLP1R", "GIP", "GCG",
                "PPARG", "SREBF1", "FASN", "ACACA",
                "TNF", "IL6", "CRP", "NFKB1",
                "LEP", "NPY", "MC4R", "POMC",
                "ADIPOQ", "FABP4", "C/EBPα",
                "UCP1", "SOD2", "NRF1",
                "TP53", "BAX", "BCL2", "CASP3",
                "PRKAA1", "TSC2", "MTOR",
                "SLC2A4", "HNF1A", "PDX1", "GCK", "MMP9", "APOA1", "CPT1A",
                "SIRT1", "FOXA2", "HNF4A",
                "NOS3", "APOE", "VEGFA"
            ],
            geneInput: "",
            placeholder: "Enter a set of genes, one per line of text."
        };
    },
    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
            };
            return utils;
        },
        pigeanFactor(){
            return this.$store.state.pigeanFactor;
        },
        geneFactor(){
            return this.$store.state.geneFactor;
        },
        genesetFactor(){
            return this.$store.state.genesetFactor;
        }
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    methods: {
        search(){
            let genes = this.geneInput.trim().split("\n");
            console.log(genes);
            this.$store.dispatch("queryBayesGenes", genes);
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
