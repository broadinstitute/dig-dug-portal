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
            filterFields: [
                { key: "beta_uncorrected", label: "Effect (marginal)" },
                { key: "beta", label: "Effect (joint)" },
            ],
            tableConfig: {
                fields: [
                    { key: "phenotype", label: "Phenotype", sortable: true },
                    {
                        key: "beta_uncorrected",
                        label: "Effect (marginal)",
                        sortable: true,
                    },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                    { key: "expand", label: "Genes" },
                ],
                queryParam: "gene_set",
                subtableEndpoint: "pigean-joined-gene-set",
                subtableFields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "combined",
                        label: "Combined genetic support",
                        showProbability: true,
                        sortable: true,
                    },
                    {
                        key: "log_bf",
                        label: "Direct support (w/ gene sets)",
                        sortable: true,
                    },
                    {
                        key: "prior",
                        label: "Gene set evidence",
                        sortable: true,
                    },
                ],
            },
            pigeanPlotConfig: {
                xField: "beta_uncorrected",
                xAxisLabel: "Effect (marginal)",
                yField: "beta",
                yAxisLabel: "Effect (joint)",
                dotKey: "phenotype",
            },
            plotColors: plotUtils.plotColors(),
            renderConfig: {
                type: "phewas plot",
                "render by": "phenotype",
                "group by": "group",
                "phenotype map": "kp phenotype map",
                "y axis field": "beta_uncorrected",
                "convert y -log10": "false",
                "y axis label": "Beta (uncorrected)",
                "x axis label": "",
                "beta field": "beta_uncorrected",
                "hover content": ["beta", "beta_uncorrected"],
                thresholds: [0.01, 0.1],
                "label in black": "greater than",
                height: "535",
                "plot margin": {
                    left: 150,
                    right: 180,
                    top: 250,
                    bottom: 300,
                },
            },
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
        plotReady() {
            return (
                this.$store.state.pigeanGeneset.data.length > 0 &&
                Object.keys(this.$store.state.bioPortal.phenotypeMap).length > 0
            );
        },
        phewasAdjustedData() {
            let adjustedData = JSON.parse(
                JSON.stringify(this.$store.state.pigeanGeneset.data)
            ); // Deep copy
            for (let i = 0; i < adjustedData.length; i++) {
                if (adjustedData[i].beta_uncorrected < 0) {
                    adjustedData[i].beta_uncorrected = 0;
                }
            }
            return adjustedData;
        },
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

    created() {
        this.$store.dispatch("queryGeneset", this.$store.state.geneset);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    methods: {},

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
