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
import FactorTable from "../../components/FactorTable.vue";
import PigeanPlot from "@/components/PigeanPlot.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";
import FilterBasic from "@/components/criterion/FilterBasic.vue";

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
        FactorTable,
        PigeanPlot,
        ResearchPheWAS,
        GenesetSelectPicker,
        SigmaSelectPicker,
        GenesetSizeSelectPicker,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
        FilterBasic
    },

    data() {
        return {
            geneInput: "",
            genesetParam: "default",
            placeholder: "Enter a list of genes.",
            baseFields: [
                {
                    key: "label_factor",
                    label: "Label factor",
                    sortable: true
                },
                { 
                    key: "factor_value",
                    label: "Overall factor value",
                    formatter: Formatters.tpmFormatter,
                    sortable: true
                },
                {
                    key: "label",
                    label: "Label",
                    sortable: true
                },
            ],
            extraGenesetFields: [
                {
                    key: "gene_Set",
                    label: "Gene set",
                    sortable: true
                }
            ],
            extraGeneFields: [
                {
                    key: "gene",
                    label: "Gene",
                    sortable: true
                },
                {
                    key: "inQuery",
                    label: "In original query?",
                    sortable: true
                }
            ],
            
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
        pigeanFactor() {
            return this.formatLabels(this.$store.state.pigeanFactor);
        },
        geneFactor() {
            let data = this.flatData(this.$store.state.geneFactor);
            return this.formatLabels(this.inputQueryMembership(data));
        },
        genesetFactor() {
            let data = this.flatData(this.$store.state.genesetFactor);
            return this.formatLabels(data);
        },
        genesetFields(){
            return this.baseFields.concat(this.extraGenesetFields);
        },
        geneFields(){
            return this.baseFields.concat(this.extraGeneFields);
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
        this.$store.dispatch("queryGenesetOptions");
    },

    methods: {
        search() {
            if (this.geneInput) {
                let genes = this.geneInput.trim().split(/[\n, ]+/);
                let geneSets = this.genesetParam;
                this.$store.dispatch("queryBayesGenes", genes, geneSets);
            }
        },
        flatData(data){
            let output = [];
            let factors = Object.keys(data);
            factors.forEach(factor => {
                output = output.concat(data[factor]);
            });
            return output;
        },
        inputQueryMembership(data){
            let copy = structuredClone(data);
            let inputGenes = this.$store.state.roundTripInputGenes;
            // enum filters don't work with raw booleans
            copy.forEach(d => {
                d["inQuery"] = inputGenes.includes(d.gene) ? "Yes" : "No";
            });
            return copy;
        },
        formatLabels(data){
            let copy = structuredClone(data);
            copy.forEach(d => d.label = this.formatGroupName(d.label));
            return copy;
        },
        formatGroupName(name){
            const prefix = new RegExp(/Group \d*: /);
            let output = name.trim().replace(prefix, "");
            console.log(output);
            return output;
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
