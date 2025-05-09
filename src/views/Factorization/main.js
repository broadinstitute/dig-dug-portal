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
import GenesetSizeSelectPicker from "@/components/GenesetSizeSelectPicker.vue";
import PigeanTable from "@/components/PigeanTable.vue";
import PigeanBayesTable from "@/components/PigeanBayesTable.vue";
import PigeanPlot from "@/components/PigeanPlot.vue";
import FactorizationNetworkGraph from "@/components/FactorizationNetworkGraph.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";
import FilterBasic from "@/components/criterion/FilterBasic.vue";
import FilterLessThan from "@/components/criterion/FilterLessThan.vue";

import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import pigeanUtils from "@/utils/pigeanUtils";

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
        FactorizationNetworkGraph,
        ResearchPheWAS,
        GenesetSelectPicker,
        GenesetSizeSelectPicker,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
        FilterBasic,
        FilterLessThan,
    },

    data() {
        return {
            geneInput: "",
            genesetParam: "default",
            placeholder: "Enter a list of genes.",
            maxPhenotypes: 100,
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
                    key: "gene_set",
                    label: "Gene set",
                    sortable: true
                },
                {
                    key: "gene_set_score",
                    label: "Gene set score",
                    sortable: true,
                    formatter: Formatters.tpmFormatter
                },
                {
                    key: "p_value",
                    label: "P-value",
                    formatter: Formatters.pValueFormatter,
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
                    key: "gene_score",
                    label: "Gene score",
                    sortable: true,
                    formatter: Formatters.tpmFormatter
                },
                {
                    key: "inQuery",
                    label: "In original query?",
                    sortable: true
                }
            ],
            topFields: [
                {
                    key: "factor",
                    label: "Factor",
                    sortable: true
                },
                {
                    key: "gene_score",
                    label: "Gene score",
                    sortable: true
                },
                {
                    key: "gene_set_score",
                    label: "Gene set score",
                    sortable: true,
                },
                {
                    key: "label",
                    label: "Label",
                    sortable: true,
                },
                {
                    key: "top_genes",
                    label: "Top genes",
                    sortable: false,
                },
                {
                    key: "top_gene_sets",
                    label: "Top gene sets",
                    sortable: false
                }
            ],
            phenotypeFields: [
                {
                    key: "p_value",
                    label: "P-value",
                    sortable: true,
                    formatter: Formatters.pValueFormatter
                },
                {
                    key: "phenotype",
                    label: "Phenotype",
                    sortable: true,
                }
            ]
            
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
            data.forEach(item => {
                let gene = item.gene;
                item.gene_score = this.$store.state.geneScores[gene];
            })
            return this.formatLabels(this.inputQueryMembership(data));
        },
        genesetFactor() {
            let data = this.flatData(this.$store.state.genesetFactor);
            data.forEach(item => { 
                let geneSet = item.gene_set
                item["p_value"] = this.pValueLookup[geneSet];
                item["gene_set_score"] = this.$store.state.genesetScores[geneSet];
            });
            return this.formatLabels(data);
        },
        genesetFields(){
            return this.baseFields.concat(this.extraGenesetFields);
        },
        geneFields(){
            return this.baseFields.concat(this.extraGeneFields);
        },
        pValueLookup(){
            let pValueList = this.$store.state.genesetPValues;
            let lookup = {};
            pValueList.forEach(item =>
                lookup[item.gene_set] = item.p_value
            );
            return lookup;
        },
        networkGraph(){
            return this.$store.state.networkGraph;
        }
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

    async created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("queryGenesetOptions");
        await this.$store.dispatch("getPigeanPhenotypes");
        this.pigeanPhenotypeMap = 
                    pigeanUtils.mapPhenotypes(this.$store.state.pigeanAllPhenotypes.data);
    },

    methods: {
        search() {
            if (this.geneInput) {
                let genes = this.geneInput.trim().split(/[\n, ]+/);
                console.log(genes.length);
                let geneSets = this.genesetParam;
                let query = {
                    "max_number_phenotypes": this.maxPhenotypes,
                    "calculate_gene_scores": true,
                    "genes": genes,
                };
                this.$store.dispatch("queryBayesPhenotypes", JSON.stringify(query));
                query["gene_sets"] = geneSets;
                this.$store.dispatch("queryBayesGenes", JSON.stringify(query));
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
            return output;
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
