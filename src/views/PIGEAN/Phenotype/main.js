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
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GenesetSizeSelectPicker from "@/components/GenesetSizeSelectPicker.vue";
import PigeanTable from "@/components/PigeanTable.vue";
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
        GenesetSizeSelectPicker,
        ResearchMPlot,
        RawImage,
        PigeanTable,
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
            plotColors: plotUtils.plotColors(),
            pigeanPhenotypeMap: {},
            traitGroups: {
                portal: "A2F",
                gcat_trait:"GWAS Catalog",
                rare_v2: "Orphanet"
            },
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
                    { key: "expand3", label: "View locus plot"}
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
                    { key: "label", label: "Mechanism", sortable: true },
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
            factorTableConfig: {
                fields: [
                    { key: "label", label: "Mechanism", sortable: true },
                    {
                        key: "gene_set_score",
                        label: "Relevance to trait",
                        sortable: true,
                    },
                    { key: "phewasPlot", label: "PheWAS" },
                    { key: "expand1", label: "Top gene loadings" },
                    { key: "expand2", label: "Top gene set loadings" },
                ],
                queryParam: "cluster",
                sortBy: "gene_set_score",
                subtableEndpoint: "pigean-gene-factor",
                subtable2Endpoint: "pigean-gene-set-factor",
                subtableFields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "combined",
                        label: "Combined genetic support",
                        sortable: true,
                    },
                    {
                        key: "factor_value",
                        label: "Mechanism value",
                        sortable: true,
                    },
                    {
                        key: "log_bf",
                        label: "Direct support (w/ gene sets)",
                        sortable: true,
                    },
                    { key: "prior", label: "Indirect support", sortable: true },
                ],
                subtable2Fields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    {
                        key: "factor_value",
                        label: "Mechanism value",
                        sortable: true,
                    },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                    {
                        key: "beta_uncorrected",
                        label: "Effect (marginal)",
                        sortable: true,
                    },
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
            mechanismTooltip:
                "Genes with genetic support for this trait " +
                "and gene sets with strong effects on genetic support " +
                "for the trait are compiled into a membership matrix. " +
                "Bayesian non-negative matrix factorization with " +
                "automatic relevance determination is then applied " +
                "to the membership matrix to determine latent factors, " +
                "each of which is characterized by loadings of both " +
                "genes and gene sets within the factor. The relevance " +
                "of each factor to this trait is calculated as the sum " +
                "of gene set effects within the factor. The gene factors " +
                "are finally included in a joint regression model to " +
                "independently predict genetic support for each trait " +
                "in the portal, producing a PheWAS that independently " +
                "determines additional traits affected by the mechanism. " +
                "Associations with other traits are used only to " +
                "construct the PheWAS and not to determine the factor weights.",
            heatmapConfig: {
                type: "heat map",
                label: "Mechanisms PheWAS",
                main: {
                    field: "Z",
                    label: "Z-score",
                    type: "scale",
                    direction: "positive",
                    low: -3.0,
                    middle: 0,
                    high: 5.0,
                },
                sub: {
                    field: "pValue",
                    label: "P-value",
                    type: "steps",
                    direction: "negative",
                    valueRange: [0.00001, 0.001],
                    "value range": [0.00001, 0.001],
                },
                columnField: "other_phenotype",
                columnLabel: "Other phenotype",
                rowField: "mechanism",
                rowLabel: "Mechanism",
                fontSize: 12,
                legend: "Legend",
                sortPhenotypeColumns: true,
                colorByPhenotype: true,
                truncateColumns: true,
                sortRowsDescending: true,
                rowScorePrefixes: true,
            },
            heatmapMaxP: 0.001,
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
        heatmapData() {
            return this.filterHeatmapData(this.heatmapMaxP);
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
        mechanismMap() {
            let data = this.$store.state.pigeanFactor.data;
            let mechanisms = {};
            data.forEach((item) => {
                if (!mechanisms[item.factor]) {
                    mechanisms[item.factor] = {
                        label: item.label,
                        score: item.gene_set_score,
                    };
                }
            });
            return mechanisms;
        },
        pigeanMap(){
            return this.pigeanPhenotypeMap;
        }

    },

    watch: {
        "$store.state.phenotype": function (phenotype) {
            keyParams.set({ phenotype: phenotype.name });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

    async created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        await this.$store.dispatch("getPigeanPhenotypes");
        this.pigeanPhenotypeMap = 
            pigeanUtils.mapPhenotypes(this.$store.state.pigeanAllPhenotypes.data);
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
        filterHeatmapData(p) {
            let phewasData = this.namesAndMechanisms(
                this.$store.state.pigeanTopPhewas.data
            );
            if (p === "" || Number.isNaN(p)) {
                return phewasData;
            }
            let significantEntries = phewasData.filter(
                (item) => item.pValue <= p
            );
            let significantPhenotypes = significantEntries.map(
                (item) => item.other_phenotype
            );
            return phewasData.filter((item) =>
                significantPhenotypes.includes(item.other_phenotype)
            );
        },
        namesAndMechanisms(originalData) {
            let data = structuredClone(originalData);
            let mechanisms = this.mechanismMap;
            data.forEach((item) => {
                const mechanism = mechanisms[item.factor] || {};
                item.mechanism = `${mechanism.score || ""}___${
                    mechanism.label || ""
                }`;
            });
            return data;
        },
        lookupInPigeanMap(){
            let name = keyParams.phenotype;
            let phenotype = this.pigeanPhenotypeMap[name];
            if (phenotype) {
                this.$store.state.selectedPhenotype = phenotype;
                keyParams.set({ phenotype: phenotype.name });
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
