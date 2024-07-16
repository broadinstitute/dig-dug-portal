import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import RawImage from "@/components/RawImage.vue";
import keyParams from "@/utils/keyParams";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import sessionUtils from "@/utils/sessionUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";
import Alert from "@/components/Alert";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import SigmaSelectPicker from "@/components/SigmaSelectPicker.vue";
import GenesetSizeSelectPicker from "@/components/GenesetSizeSelectPicker.vue";
import PigeanTable from "@/components/PigeanTable.vue";
import PigeanPlot from "@/components/PigeanPlot.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        SearchHeaderWrapper,
        SigmaSelectPicker,
        GenesetSizeSelectPicker,
        ResearchMPlot,
        RawImage,
        PigeanTable,
        PigeanPlot,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
    },
    data() {
        return {
            plotColors: plotUtils.plotColors(),
            phenotypeSearchKey: null,
            newPhenotypeSearchKey: null,
            hidePValueFilter: true,
            geneFilterFields: [
                { key: "combined", label: "Combined" },
                { key: "combined_probability", label: "Combined probability" },
                { key: "huge_score", label: "GWAS evidence unweighted" },
                { key: "log_bf", label: "GWAS evidence weighted" },
                { key: "prior", label: "Gene set evidence" },
            ],
            tableConfig: {
                fields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "combined",
                        label: "Combined",
                        showProbability: true,
                        sortable: true,
                    },
                    {
                        key: "huge_score",
                        label: "GWAS evidence unweighted",
                        sortable: true,
                    },
                    {
                        key: "log_bf",
                        label: "GWAS evidence weighted",
                        sortable: true,
                    },
                    {
                        key: "prior",
                        label: "Gene set evidence",
                        sortable: true,
                    },
                    { key: "n", label: "Number of gene sets", sortable: true },
                    { key: "expand", label: "Gene sets" },
                ],
                queryParam: "gene",
                subtableEndpoint: "pigean-joined-gene",
                subtableFields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                ],
            },
            genePigeanPlotConfig: {
                xField: "prior",
                xAxisLabel: "Gene set evidence",
                yField: "log_bf",
                yAxisLabel: "GWAS evidence weighted",
                dotKey: "gene",
                hoverBoxPosition: "both",
                hoverFields: ["combined"],
            },
            genesetFilterFields: [
                { key: "beta", label: "Effect (joint)" },
                { key: "beta_uncorrected", label: "Effect (marginal)" },
            ],
            genesetTableConfig: {
                fields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                    {
                        key: "beta_uncorrected",
                        label: "Effect (marginal)",
                        sortable: true,
                    },
                    { key: "n", label: "Number of genes", sortable: true },
                    { key: "expand", label: "Genes" },
                ],
                queryParam: "gene_set",
                sortBy: "beta",
                subtableEndpoint: "pigean-joined-gene-set",
                subtableFields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "combined",
                        label: "Combined",
                        showProbability: true,
                        sortable: true,
                    },
                    {
                        key: "log_bf",
                        label: "GWAS evidence weighted",
                        sortable: true,
                    },
                    {
                        key: "prior",
                        label: "Gene set evidence",
                        sortable: true,
                    },
                ],
            },
            genesetPigeanPlotConfig: {
                xField: "beta_uncorrected",
                xAxisLabel: "Effect (marginal)",
                yField: "beta",
                yAxisLabel: "Effect (joint)",
                dotKey: "gene_set",
                hoverBoxPosition: "both",
            },
            factorTableConfig: {
                fields: [
                    { key: "label", label: "Label", sortable: true },
                    {
                        key: "gene_set_score",
                        label: "Gene set score",
                        sortable: true,
                    },
                    { key: "top_gene_sets", label: "Top gene sets"},
                    { key: "gene_score", label: "Gene score", sortable: true },
                    { key: "top_genes", label: "Top genes" },
                    { key: "phewasPlot", label: "Show PheWAS" },
                    { key: "expand", label: "Show top genes" },
                    { key: "expand2", label: "Show top gene sets" },
                ],
                queryParam: "cluster",
                sortBy: "gene_set_score",
                subtableEndpoint: "pigean-gene-factor",
                subtable2Endpoint: "pigean-gene-set-factor",
                subtableFields: [
                    { key: "gene", label: "Gene", sortable: true},
                    { key: "combined", label: "Combined", sortable: true},
                    { key: "factor_value", label: "Factor value", sortable: true},
                    { key: "log_bf", label: "GWAS evidence weighted", sortable: true},
                    { key: "prior", label: "Prior", sortable: true}
                ],
                subtable2Fields: [
                    { key: "gene_set", label: "Gene set", sortable: true},
                    { key: "factor_value", label: "Factor value", sortable: true},
                    { key: "beta", label: "Effect (joint)", sortable: true },
                    { key: "beta_uncorrected", label: "Effect (marginal)", sortable: true },
                ],
            },
            renderConfig: {
                type: "phewas plot",
                "render by": "other_phenotype",
                "group by": "group",
                "phenotype map": "kp phenotype map",
                "y axis field": "pValue",
                "convert y -log10": "true",
                "y axis label": "-Log10(p-value)",
                "x axis label": "",
                "beta field": "null",
                "hover content": ["Z", "pValue"],
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
        /// for disease systems
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        ///
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
        plotReady() {
            return (
                this.$store.state.genesetPhenotype.data.length > 0 &&
                this.$store.state.pigeanPhenotype.data.length > 0 &&
                this.$store.state.pigeanFactor.data.length > 0 &&
                Object.keys(this.$store.state.bioPortal.phenotypeMap).length > 0
            );
        },
        phewasReady(){
            return this.$store.state.pigeanPheWAS.data.length > 0;
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
    },

    watch: {
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let name = keyParams.phenotype;
            let phenotype = phenotypeMap[name];

            if (phenotype) {
                this.$store.state.selectedPhenotype = phenotype;
                keyParams.set({ phenotype: phenotype.name });
            }
            //Initial query. Should only happen once.
            this.$store.dispatch("queryPhenotype");
        },

        "$store.state.phenotype": function (phenotype) {
            keyParams.set({ phenotype: phenotype.name });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        "$store.state.pigeanPheWAS.data": function(data){
            console.log(JSON.stringify(data));
        }
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },
    methods: {
        ...uiUtils,
        ...sessionUtils,
        setSelectedPhenotype(PHENOTYPE) {
            this.newPhenotypeSearchKey = PHENOTYPE.description;
            this.phenotypeSearchKey = null;
            this.$store.dispatch("selectedPhenotype", PHENOTYPE);
        },
        ifPhenotypeInSearch(DESCRIPTION) {
            let searchKeys = this.phenotypeSearchKey.split(" ");
            let isInPhenotype = 0;

            searchKeys.map((w) => {
                if (DESCRIPTION.toLowerCase().includes(w.toLowerCase())) {
                    isInPhenotype++;
                }
            });

            return isInPhenotype == searchKeys.length ? true : null;
        },
        clickedTab(tabLabel) {
            this.hidePValueFilter = tabLabel === "hugescore";
        },
        phewasPlot(plotDetails){
            this.$store.dispatch("queryPheWAS", plotDetails);
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
