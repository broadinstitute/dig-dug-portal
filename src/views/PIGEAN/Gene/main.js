import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import GenesetSizeSelectPicker from "@/components/GenesetSizeSelectPicker.vue";
import TraitGroupSelectPicker from "@/components/TraitGroupSelectPicker.vue";
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
import pigeanUtils from "@/utils/pigeanUtils.js";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    modules: {},
    components: {
        SearchHeaderWrapper,
        GeneSelectPicker,
        GenesetSizeSelectPicker,
        TraitGroupSelectPicker,
        PigeanTable,
        PigeanPlot,
        ResearchPheWAS,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
    },
    mixins: [pageMixin],

    data() {
        return {
            pigeanPhenotypeMap: {},
            filterFields: [
                { key: "combined", label: "Combined genetic support" },
                { key: "huge_score", label: "Direct support w/o gene sets" },
                { key: "log_bf", label: "Direct support w/ gene sets" },
                { key: "prior", label: "Indirect support" },
            ],
            tableConfig: {
                fields: [
                    { key: "phenotype", label: "Phenotype", sortable: true },
                    {
                        key: "combined",
                        label: "Combined genetic support",
                        showProbability: true,
                        sortable: true,
                    },
                    {
                        key: "huge_score",
                        label: "Direct support (w/o gene sets)",
                        sortable: true,
                    },
                    {
                        key: "log_bf",
                        label: "Direct support (w/ gene sets)",
                        sortable: true,
                    },
                    {
                        key: "prior",
                        label: "Indirect support",
                        sortable: true,
                    },
                    { key: "expand", label: "Gene sets" },
                ],
                queryParam: "gene",
                subtableEndpoint: "pigean-joined-gene",
                subtableFields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                ],
            },
            pigeanPlotConfig: {
                xField: "prior",
                xAxisLabel: "Indirect support",
                yField: "log_bf",
                yAxisLabel: "Direct support (w/ gene sets)",
                dotKey: "phenotype",
                hoverFields: ["gene", "combined"],
            },
            plotColors: plotUtils.plotColors(),
            renderConfig: {
                type: "phewas plot",
                "render by": "phenotype",
                "group by": "group",
                "phenotype map": "kp phenotype map",
                "y axis field": "combined",
                "convert y -log10": "false",
                "y axis label": "Combined genetic support",
                "x axis label": "",
                "beta field": "null",
                "hover content": ["combined", "huge_score", "log_bf", "prior"],
                thresholds: [Math.log(3), Math.log(30)],
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
        region() {
            return this.$store.getters.region;
        },
        symbolName() {
            return this.$store.getters.canonicalSymbol;
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
                this.pigeanFilteredData.length > 0 &&
                Object.keys(this.pigeanPhenotypeMap).length > 0
            );
        },
        phewasAdjustedData() {
            let adjustedData = structuredClone(this.pigeanFilteredData); // Deep copy
            for (let i = 0; i < adjustedData.length; i++) {
                if (adjustedData[i].combined < 0) {
                    adjustedData[i].combined = 0;
                }
            }
            return adjustedData;
        },
        pigeanFilteredData(){
            let rawData = structuredClone(this.phewasAllData);
            let filteredData = rawData.filter(item => item.log_bf > 0 || item.prior > 0);
            return filteredData;
        },
        pigeanMap(){
            return this.pigeanPhenotypeMap;
        },
        phewasAllData(){
            return this.$store.state.phewasData;
        }
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        phewasAllData(newData){
            //console.log("watching", JSON.stringify(newData));
        }
    },

    async created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        await this.$store.dispatch("getPigeanPhenotypes");
        this.pigeanPhenotypeMap = 
            pigeanUtils.mapPhenotypes(this.$store.state.pigeanAllPhenotypes.data);
    },
    methods: {
        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (r) {
                window.location.href = `../region.html?chr=${
                    r.chromosome
                }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
