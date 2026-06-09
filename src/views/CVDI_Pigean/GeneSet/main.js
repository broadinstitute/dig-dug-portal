import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GenesetSelectPicker from "@/components/GenesetSelectPicker.vue";
import TraitGroupSelectPicker from "@/components/TraitGroupSelectPicker.vue";
import CVDIPigeanTable from "../CVDIPigeanTable.vue";
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
import pigeanUtils from "@/utils/pigeanUtils.js";
import cvdiBioIndexUtils from "../utils/cvdiBioIndexUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        SearchHeaderWrapper,
        CVDIPigeanTable,
        PigeanPlot,
        ResearchPheWAS,
        GenesetSelectPicker,
        TraitGroupSelectPicker,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
    },
    mixins: [pageMixin],

    data() {
        return {
            pigeanPhenotypeMap: {},
            filterFields: [
                { key: "beta_uncorrected", label: "Effect (uncorrected)" },
                { key: "beta", label: "Effect (joint)" },
            ],
            tableConfig: {
                fields: [
                    { key: "phenotypeDesc", label: "Phenotype", sortable: true },
                    {
                        key: "beta_uncorrected",
                        label: "Effect (uncorrected)",
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
                        label: "Indirect support",
                        sortable: true,
                    },
                ],
            },
            pigeanPlotConfig: {
                xField: "beta_uncorrected",
                xAxisLabel: "Effect (uncorrected)",
                yField: "beta",
                yAxisLabel: "Effect (joint)",
                dotKey: "phenotype",
                linkRoot: "/cvdi_pigean",
            },
            plotColors: plotUtils.plotColors(),
            pigeanColors: null,
            renderConfig: {
                type: "phewas plot",
                "render by": "phenotype",
                "group by": "group",
                "phenotype map": "kp phenotype map",
                "y axis field": "beta_uncorrected",
                "convert y -log10": "false",
                "y axis label": "Effect (uncorrected)",
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
            genesetSearchOptions: [],
            matchingGenesets: [],
        };
    },
    computed: {
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
                this.phewasAllData.length > 0 &&
                Object.keys(this.pigeanPhenotypeMap).length > 0
            );
        },
        phewasAdjustedData() {
            let adjustedData = structuredClone(this.phewasAllData);
            for (let i = 0; i < adjustedData.length; i++) {
                if (adjustedData[i].beta_uncorrected < 0) {
                    adjustedData[i].beta_uncorrected = 0;
                }
            }
            return adjustedData;
        },
        pigeanMap(){
            return this.pigeanPhenotypeMap;
        },
        phewasAllData(){
            let data = structuredClone(this.$store.state.phewasData);
            data.forEach(p => {
                let delimiter = "___";
                // Harmonize this formatting
                if (p.phenotype.includes(delimiter)){
                    p.phenotype = p.phenotype.split(delimiter)[0];
                }
            });
            return data;
        }
    },
    methods: {
        storeColors(colors){
            this.pigeanColors = colors;
        },
        lookupGenesets(input) {
            let query = input ? input.toLowerCase() : "";
            this.matchingGenesets = query
                ? this.genesetSearchOptions
                      .filter(d => d.toLowerCase().includes(query))
                      .slice(0, 10)
                : [];
        },
        selectGeneset(geneset) {
            this.$store.state.genesetToQuery = geneset;
        },
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },
    async created() {
        this.pigeanPhenotypeMap = await cvdiBioIndexUtils.getPhecodeMap();
        this.$store.dispatch("queryGeneset", this.$store.state.geneset);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.genesetSearchOptions = await cvdiBioIndexUtils.getAllGenesets();
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
