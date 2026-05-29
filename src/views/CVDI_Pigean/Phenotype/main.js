import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import RawImage from "@/components/RawImage.vue";
import keyParams from "@/utils/keyParams";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import pigeanUtils from "@/utils/pigeanUtils.js";
import sessionUtils from "@/utils/sessionUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";
import cvdiBioIndexUtils from "../utils/cvdiBioIndexUtils";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import CVDIPigeanTable from "../CVDIPigeanTable.vue";
import PigeanPlot from "@/components/PigeanPlot.vue";
import Heatmap from "@/components/Heatmap.vue";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import NetworkGraph from "@/components/NetworkGraph.vue";
import { pageMixin } from "@/mixins/pageMixin.js";
new Vue({
    store,
    components: {
        SearchHeaderWrapper,
        ResearchMPlot,
        RawImage,
        CVDIPigeanTable,
        PigeanPlot,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
        TooltipDocumentation,
        Heatmap,
        ResearchHeatmap,
        FilterPValue,
        NetworkGraph,
    },
    mixins: [pageMixin],
    data() {
        return {
            pigeanPhenotypeMap: {},
            phewasPlotLabel: "",
            phenotypeSearchKey: null,
            newPhenotypeSearchKey: null,
            hidePValueFilter: true,
            geneFilterFields: [
                { key: "combined", label: "Combined genetic support" },
                { key: "combined_probability", label: "Combined probability" },
                { key: "huge_score", label: "Direct support (w/o gene sets)" },
                { key: "log_bf", label: "Direct support (w/ gene sets)" },
                { key: "prior", label: "Indirect support" },
            ],
            tableConfig: {
                fields: [
                    { key: "gene", label: "Gene", sortable: true },
                    { key: "label", label: "Mechanism", sortable: true },
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
                xAxisLabel: "Indirect support",
                yField: "log_bf",
                yAxisLabel: "Direct support (w/ gene sets)",
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
            genesetPigeanPlotConfig: {
                xField: "beta_uncorrected",
                xAxisLabel: "Effect (marginal)",
                yField: "beta",
                yAxisLabel: "Effect (joint)",
                dotKey: "gene_set",
                hoverBoxPosition: "both",
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
                "hover content": [
                    "Z",
                    "pValue",
                    "pValue_marginal",
                    "pValue_orig",
                    "pValue_robust",
                ],
                thresholds: [0.05, 0.00005],
                "label in black": "lower than",
                height: "475",
                "plot margin": {
                    left: 150,
                    right: 180,
                    top: 300,
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
        traitGroups(){
            return cvdiBioIndexUtils.TRAIT_GROUPS;
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
        pigeanMap(){
            return this.pigeanPhenotypeMap;
        },
        pigeanColors(){
            let colors = {};
            colors[this.$store.state.phenotype.group] = plotUtils.plotColors()[0];
            return colors;
        },
        pigeanPhenotypeData(){
            return this.$store.state.pigeanPhenotype.data;
        }

    },

    watch: {
        "$store.state.phenotype": function (phenotype) {
            console.log("Is this the problem?");
            //keyParams.set({ phenotype: phenotype.name });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        pigeanPhenotypeData(newData){
            console.log("Received new BI data", JSON.stringify(newData));
        }
    },

    async created() {
        this.pigeanPhenotypeMap = await cvdiBioIndexUtils.getPhecodeMap();
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.lookupInPigeanMap();
    },
    methods: {
        ...uiUtils,
        ...sessionUtils,
        getToolTipPosition(ELEMENT) {
            uiUtils.getToolTipPosition(ELEMENT);
        },
        setSelectedPhenotype(PHENOTYPE) {
            let oldStylePhenotype = pigeanUtils.toOldStyle(PHENOTYPE);
            this.newPhenotypeSearchKey = oldStylePhenotype.description;
            this.phenotypeSearchKey = null;
            this.$store.dispatch("selectedPhenotype", oldStylePhenotype);
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
        lookupInPigeanMap(){
            let name = keyParams.phenotype;
            let phenotype = this.pigeanPhenotypeMap[name];
            if (phenotype) {
                this.$store.state.selectedPhenotype = phenotype;
                //keyParams.set({ phenotype: phenotype.name });
                this.$store.state.traitGroupToQuery = phenotype.trait_group;
                keyParams.set({ traitGroup: phenotype.trait_group });
            }
            //Initial query. Should only happen once.
            this.$store.dispatch("queryPhenotype");
        }
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
