import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/layout.css";
import "../../assets/pkb-styles.css";

import { pankbaseMixin } from "../../mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import Scatterplot from "../../../../components/Scatterplot.vue";
import BulkHeatmap from "../../components/BulkHeatmap.vue";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import BulkTable from "../../components/BulkTable.vue";
import BulkViolinPlot from "../../components/BulkViolinPlot.vue";
import GeneSelectPicker from "../../../../components/GeneSelectPicker.vue";
import MouseGeneSelect from "../../../../components/MouseGeneSelect.vue";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
import * as d3 from 'd3';
import keyParams from "@/utils/keyParams";
import { isNull } from "lodash";

import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";


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
        CriterionFunctionGroup,
        FilterGreaterThan,
        ResearchSingleCellBrowser,
        ResearchSingleCellInfo,
        uiUtils
    },
    mixins: [pankbaseMixin],
    props: [],
    data() {
        return {
            loading: true,
            sampleDataId: "brusman_749",
            sampleData: [],
            heatmapSampleDataId: "brusman_750",
            heatmapSampleData: [],
            dataReady: false,
            allMetadata: null,
            bulkMetadata: null,
            plotId: "bulk_heatmap",
            plotHeight: 300,
            chart: null,
            chartWidth: 0,
            datasets: [],
            endpoint: "single-cell-bulk-z-norm",
            documentation: null,
            utils: {
                uiUtils: uiUtils
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
                        key: "log2FoldChange",
                        label: "log2 Fold Change",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "minusLog10P",
                        label: "-log10(P adj.)",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    //{ key: "expand", label: "Gene query" },
                ],
                queryParam: "gene",
                subtableEndpoint: "single-cell-bulk-melted",
                subtableFields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                ],
            },
            volcanoYCondition: 0.05,
            volcanoXConditionGreater: 1.5,
        };
    },
    computed: {
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
            if (this.heatmapSampleData.length > 0){
                return this.heatmapSampleData;
            }
            let outputData = structuredClone(this.$store.state.singleBulkZNormData);
            outputData.forEach(item => item["-log10P"] = item.log10FDR);
            return outputData;
        },
        bulkData19K() {
            if (this.selectedDataset === 'sample'){
                return this.sampleData;
            }
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
                "x axis field": "log2FoldChange",
                "x axis label": "log2 Fold Change",
                "y axis field": "minusLog10P",
                "y axis label": "-log10 (P adj.)",
                "width": 600,
                "height": this.plotHeight,
                "x condition": { 
                    "combination": "or", 
                    "greater than": this.volcanoXConditionGreater, 
                    "lower than": -this.volcanoXConditionGreater },
                //combination for condition can be "greater than", "lower than", "or" and "and."
                "y condition": { 
                    "combination": "greater than", 
                    "greater than": -Math.log(parseFloat(this.volcanoYCondition)) },
                "dot label score": 2
                //number of conditions that the value of each dot to meet to have labeled
            };
            return config;
        },
        comparisons() {
            let items = Object.keys(this.$store.state.currentComparisons);
            return items;
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
                xLower: -this.volcanoXConditionGreater,
                yGreater: -Math.log(this.volcanoYCondition)
            }
        },
        samplesColumns(){
            if(this.zNormData.length === 0){
                return [];
            }
            let item = this.zNormData[0];
            let columns = Object.keys(item).filter(i => i !== 'gene');
            return columns;
        }
    },
    async mounted() {
        this.init();
        this.getDocumentation();
        let content = await getPankbaseContent(this.sampleDataId);
        this.sampleData = this.processData(content);
        this.heatmapSampleData = await getPankbaseContent(this.heatmapSampleDataId);
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
            //this.getParams();
            //await this.getBulkMetadata();
            if (!keyParams.comparison) {
                this.$store.dispatch("resetComparison");
                keyParams.set({ comparison: this.$store.state.selectedComparison });
            }
            //await this.$store.dispatch("queryBulkFile");
            //await this.$store.dispatch("queryBulk");
            this.dataReady = true;

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
            const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id=pankbase_differentialexpressionbrowser";

            let jsonContent = await fetch(CONTENT_URL).then(
                resp => resp.json());
            if (jsonContent.length === 0) {
                this.documentation = null;
            }
            this.documentation = jsonContent[0];
        },
        getTop20(data) {
            let processedData = data.sort((a, b) => b.minusLog10P - a.minusLog10P).slice(0, 20);
            return processedData;
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
        highlight(highlightedGene) {
            this.$store.state.selectedGene = highlightedGene;
        },
        processData(inputData){
            let data = inputData.filter(d => d.padj !== 'NA');
            for (let i = 0; i < data.length; i++){
                let padj = data[i]["padj"];
                if (Number.isNaN(-Math.log10(padj))){
                    console.log(data[i].gene, padj);
                }
                data[i]["minusLog10P"] = -Math.log10(data[i]["padj"]);
            }
            return data;
        }

    },
    watch: {
        async selectedDataset(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ dataset: newData });
                await this.$store.dispatch("queryBulkFile");
                await this.$store.dispatch("queryBulk");
                if (newData !== "") {
                    this.getBulkMetadata();
                }
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
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
