import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import { ACCESSIBLE_PURPLE, ACCESSIBLE_DARK_GRAY, getEnrichr, getTextContent } from "../../utils/content.js";
import Scatterplot from "../../../../components/Scatterplot.vue";
import BulkHeatmap from "../../components/BulkHeatmap.vue";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import BulkTable from "../../components/BulkTable.vue";
import BulkViolinPlot from "../../components/BulkViolinPlot.vue";
import GeneSelectPicker from "../../../../components/GeneSelectPicker.vue";
import MouseGeneSelect from "../../../../components/MouseGeneSelect.vue";
import EnrichrPlot from "../../components/EnrichrPlot.vue";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
import ResearchBarPlot from "@/components/researchPortal/ResearchBarPlot"
import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
import * as d3 from 'd3';
import keyParams from "@/utils/keyParams";
import { isNull } from "lodash";
import { padStart } from "lodash";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";

new Vue({
    store,
    components: {
        Scatterplot,
        BulkHeatmap,
        BulkVolcanoPlot,
        BulkTable,
        BulkViolinPlot,
        GeneSelectPicker,
        MouseGeneSelect,
        EnrichrPlot,
        ResearchBarPlot,
        CriterionFunctionGroup,
        FilterGreaterThan,
        ResearchSingleCellBrowser,
        ResearchSingleCellInfo,
        uiUtils
    },
    mixins: [matkpMixin],
    props: [],
    data() {
        return {
            loading: true,
            dataReady: false,
            allMetadata: null,
            bulkMetadata: null,
            plotId: "bulk_heatmap",
            plotHeight: 300,
            chart: null,
            chartWidth: 0,
            datasets: [],
            enrichrByor: "matkp_enrichrlibraries",
            enrichrUp: [],
            enrichrDown: [],
            enrichrLibraries: [],
            enrichrDefaultLibrary: "KEGG_2015",
            enrichrLibrary: "KEGG_2015",
            endpoint: "single-cell-bulk-z-norm",
            documentation: null,
            utils: {
                uiUtils: uiUtils,
                plotUtils: plotUtils
            },
            colors: [
                "#007bff",
                "#048845",
                "#8490C8",
                "#BF61A5",
                "#EE3124",
                "#FCD700",
                "#5555FF",
                "#7aaa1c",
                "#9F78AC",
                "#F88084",
                "#F5A4C7",
                "#CEE6C1",
                "#cccc00",
                "#6FC7B6",
                "#D5A768",
                "#d4d4d4",
            ],
            margin: {
                top: 20,
                bottom: 100,
                left: 100,
                right: 0,
                bump: 0,
                middleSpacing: 0,
                legendSpacing: 35
            },
            svg: null,
            tableConfig: {
                fields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "logFoldChange",
                        label: "log2 Fold Change",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "-log10P",
                        label: "-log10(FDR adj. p)",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    { key: "expand", label: "Gene query" },
                ],
                queryParam: "gene",
                subtableEndpoint: "single-cell-bulk-melted",
                subtableFields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                ],
            },
            volcanoYCondition: 1.3,
            volcanoXConditionGreater: 1.5,
            volcanoXConditionLower: -1.5,
            enrichrColorScale: null,
        };
    },
    computed: {
        colorScaleEndpoints(){
            let allEnrichr = this.enrichrUp.concat(this.enrichrDown);
            let field = "Adjusted p-value";
            let min = allEnrichr[0][field];
            let max = allEnrichr[0][field];
            allEnrichr.forEach(item => {
                let newValue = item[field];
                if (newValue < min) { min = newValue; }
                if (newValue > max) { max = newValue; }
            });
            min = -Math.log10(min);
            max = -Math.log10(max);
            return [max, min];
        },
        colorScaleArray(){
            if (this.enrichrColorScale === null) { return []; }
            let lo = this.colorScaleEndpoints[0];
            let hi = this.colorScaleEndpoints[1];
            let step = 0.01 * (hi - lo);
            return d3.range(lo, hi, step).map(t => this.enrichrColorScale(t)).join(', ');
        },
        selectedDataset() {
            return this.$store.state.selectedDataset;
        },
        selectedComparison() {
            return this.$store.state.selectedComparison;
        },
        selectedGene() {
            return this.$store.state.selectedGene;
        },
        zNormData() {
            let outputData = structuredClone(this.$store.state.singleBulkZNormData);
            outputData.forEach(item => item["-log10P"] = item.log10FDR);
            return outputData.sort((a,b) => a.logFoldChange - b.logFoldChange);
        },
        bulkData19K() {
            return this.$store.state.bulkData19K.filter(
                item => item.gene !== undefined
                    && item.comparison_id === this.$store.state.selectedComparison);
        },
        volcanoConfig() {
            let config = {
                "type": "volcano plot",
                "label": "This is a Test",
                "legend": "This is a Test",
                "render by": "gene",
                "x axis field": "logFoldChange",
                "x axis label": "log2 Fold Change",
                "y axis field": "-log10P",
                "y axis label": "-log10(FDR adj. p)",
                "width": 600,
                "height": this.plotHeight,
                "x condition": { 
                    "combination": "or", 
                    "greater than": this.volcanoXConditionGreater, 
                    "lower than": this.volcanoXConditionLower },
                //combination for condition can be "greater than", "lower than", "or" and "and."
                "y condition": { 
                    "combination": "greater than", 
                    "greater than": parseFloat(this.volcanoYCondition) },
                "dot label score": 2
                //number of conditions that the value of each dot to meet to have labeled
            };
            return config;
        },
        comparisons() {
            let items = Object.keys(this.$store.state.currentComparisons);
            return items;
        },
        upregulatedIn(){
            if (this.$store.state.selectedDataset === 'bulkRNA_Emont2022_Humans_SAT'){
                return 'insulin resistant';
            }
            let comparisonText = this.$store.state.currentComparisons[this.$store.state.selectedComparison];
            let versus = /[^w]vs/;
            return Formatters.snakeFormatter(comparisonText.split(versus)[0]);
        },
        kpDataset() {
            return keyParams.dataset;
        },
        kpComparison() {
            return keyParams.comparison;
        },
        kpGene() {
            return keyParams.gene;
        },
        isMouse() {
            return this.bulkMetadata?.species === 'Mus musculus';
        },
        regulationConditions(){
            return {
                xGreater: this.volcanoXConditionGreater,
                xLower: this.volcanoXConditionLower,
                yGreater: this.volcanoYCondition
            }
        },
        async downGenes(){
            let genesList = this.getTopGenes(false);
            let enrichrData = await getEnrichr(genesList);
            return enrichrData;
        }
    },
    async mounted() {
        this.init();
        this.getDocumentation();
    },
    created() {
    },
    methods: {
        async init() {
            if (!keyParams.dataset) {
                keyParams.set({ dataset: this.$store.state.selectedDataset });
            }
            if (!keyParams.gene) {
                keyParams.set({ gene: this.$store.state.selectedGene });
            }
            this.getParams();
            this.enrichrLibraries = await getTextContent(this.enrichrByor);
            await this.getBulkMetadata();
            if (!keyParams.comparison) {
                this.$store.dispatch("resetComparison");
                keyParams.set({ comparison: this.$store.state.selectedComparison });
            }
            await this.$store.dispatch("queryBulkFile");
            await this.$store.dispatch("queryBulk");
        
            await this.populateEnrichr();
            this.dataReady = true;
        },
        async populateEnrichr(){
            this.enrichrUp = [];
            this.enrichrDown = [];
            this.enrichrUp = await getEnrichr(this.getTopGenes(true), this.enrichrLibrary);
            this.enrichrDown = await getEnrichr(this.getTopGenes(false), this.enrichrLibrary);
            this.enrichrColorScale = this.createColorScale();
        },
        async getBulkMetadata() {
            if (!this.allMetadata) {
                let metadataUrl = `${BIO_INDEX_HOST}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`;
                let myMetadata = await scUtils.fetchMetadata(metadataUrl);
                this.allMetadata = myMetadata;
            }

            this.bulkMetadata = this.allMetadata.find(x => x.datasetId === this.selectedDataset);
        },
        async getDocumentation() {
            const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id=matkp_differentialgeneexpressionbrowser";

            let jsonContent = await fetch(CONTENT_URL).then(
                resp => resp.json());
            if (jsonContent.length === 0) {
                this.documentation = null;
            }

            this.documentation = jsonContent[0];
        },
        async getParams() {
            let url = `${BIO_INDEX_HOST}/api/bio/keys/${this.endpoint}/2`;
            try {
                const response = await fetch(url);
                const data = await (response.json());
                let allKeys = data.keys;
                this.datasets = Array.from(new Set(allKeys.map(item => item[0])));
            } catch (error) {
                console.error("Error: ", error);
            }
        },
        getTopGenes(up=true){
            let data = structuredClone(this.bulkData19K);
            data = data.filter(d => 
                up ? d.logFoldChange > 0
                : d.logFoldChange < 0 );
            data.sort((a,b) => b["-log10P"] - a["-log10P"]);
            data = data.slice(0,10).map(d => d.gene);
            return data;
        },
        highlight(highlightedGene) {
            this.$store.state.selectedGene = highlightedGene;
        },
        createColorScale(){
            let ends = this.colorScaleEndpoints;
            return d3.scaleLinear()
              .range([ACCESSIBLE_DARK_GRAY, ACCESSIBLE_PURPLE])
              .domain(ends);
        }
    },
    watch: {
        async selectedDataset(newData, oldData) {
            if (newData !== oldData) {
                this.dataReady = false;
                keyParams.set({ dataset: newData });
                // Reset highlighted gene upon changing dataset
                await this.$store.dispatch("firstGene");
                await this.$store.dispatch("queryBulkFile");
                await this.$store.dispatch("queryBulk");
                if (newData !== "") {
                    this.getBulkMetadata();
                }
                await this.populateEnrichr();
                this.dataReady = true;
            }
        },
        async enrichrLibrary(newData, oldData){
            console.log(newData, oldData);
            if(newData != oldData){
                this.dataReady = false;
                await this.populateEnrichr();
                this.dataReady = true;
            }
        },
        selectedComparison(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ comparison: newData });
                this.$store.dispatch("queryBulk");
            }
        },
        selectedGene(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ gene: newData });
            }
        },
        comparisons(newData) {
            if (!newData.includes(this.selectedComparison)) {
                this.$store.dispatch("resetComparison");
            }
        },
        kpDataset(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedDataset = newData;
            }
        },
        kpComparison(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedComparison = newData;
            }
        },
        kpGene(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedGene = newData;
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
