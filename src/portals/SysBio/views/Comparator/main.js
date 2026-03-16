import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";
import { sysbioStore } from "../../mixins/sysbioStore.js";
import { ACCESSIBLE_PURPLE, ACCESSIBLE_DARK_GRAY, getEnrichr, getTextContent } from "../../utils/content.js";
import { createColorScale } from "../../utils/visuals.js";
import Scatterplot from "../../../../components/Scatterplot.vue";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import BulkTable from "../../components/BulkTable.vue";
import GeneSelectPicker from "../../../../components/GeneSelectPicker.vue";
import EnrichrPlot from "../../components/EnrichrPlot.vue";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
import * as d3 from 'd3';
import keyParams from "@/utils/keyParams";

const BIO_INDEX_HOST = "https://sysbio.hugeampkpnbi.org";


new Vue({
    store,
    mixins: [sysbioMixin],
    components: {
        Scatterplot,
        BulkVolcanoPlot,
        BulkTable,
        GeneSelectPicker,
        EnrichrPlot,
        //ResearchSingleCellInfo,
        
    },
    data() {
        return {
            loading: true,
            foundGene: true,
            dataReady: false,
            enrichrReady: false,
            tableHidden: false,
            bulkDataSortField: "absoluteFoldChange",
            allMetadata: null,
            bulkMetadata: null,
            plotId: "bulk_heatmap",
            plotHeight: 450,
            chart: null,
            chartWidth: 0,
            datasets: [],
            truncateEnrichr: 10,
            enrichrUp: [],
            enrichrDown: [],
            enrichrLibraries: [],
            enrichrByor: "matkp_enrichrlibraries", // Using MATKP list until further notice
            docs: "",
            enrichrLibrary: "KEGG_2015", //hardcoding default
            libraryPage: 1,
            selectedLibraryType: "",
            endpoint: "dataset-associations",
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
                        key: "logFoldChange_1",
                        label: `log2 Fold Change in Comp. 1`,
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "logFoldChange_2",
                        label: `log2 Fold Change in Comp. 2`,
                        sortable: true,
                        formatter: Formatters.tpmFormatter
                    },
                    {
                        key: "minusLog10P_1",
                        label: `-log10(FDR adj. p) in Comp. 1`,
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "minusLog10P_2",
                        label: `-log10(FDR adj. p) in Comp. 2`,
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
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
            if (allEnrichr.length === 0){
                return[null, null];
            }
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
        selectedGene() {
            return this.$store.state.selectedGene;
        },
        bulkData19K() {
            // TODO join on gene
            let resultsUnsorted = this.$store.state.bulkData19K.filter(
                item => item.gene !== undefined
                    && item.comparison_id === this.$store.state.selectedComp1
                    || item.comparison_id === this.$store.state.selectedComp2);
            let resultsSorted = resultsUnsorted.sort((a,b) => b.gene.localeCompare(a.gene));
            let results = [];
            while (resultsSorted.length > 1){
                let currentItem = resultsSorted.pop();
                let nextItem = resultsSorted.pop();
                if (currentItem.gene === nextItem.gene){
                    if (currentItem.comparison_id === this.$store.state.selectedComp1){
                        results.push(this.combineItems(currentItem, nextItem))
                    } else {
                        results.push(this.combineItems(nextItem, currentItem))
                    }
                    // test for a third item
                    if (resultsSorted.length > 0){
                        let thirdItem = resultsSorted[resultsSorted.length - 1];
                        if (thirdItem.gene === currentItem.gene){
                            console.error("Triplicate detected");
                            return [];
                        }
                    }
                } else {
                    resultsSorted.push(nextItem);
                }
            }
            return results;
        },
        comparisons() {
            let allComps = this.$store.state.currentComparisons;
            if (!allComps){
                return null;
            }
            let items = Object.keys(allComps);
            return items;
        },
        kpDataset() {
            return keyParams.dataset;
        },
        kpComp1() {
            return keyParams.comp1;
        },
        kpComp2() {
            return keyParams.comp2;
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
        enrichrLibraryTypes(){
            let libraryTypes = new Set(this.enrichrLibraries.map(l => l["Type"]));
            return Array.from(libraryTypes);
        },
        librariesForType(){
            if (this.selectedLibraryType === ""){
                return [];
            }
            return this.enrichrLibraries.filter(l => l["Type"] === this.selectedLibraryType);
        },
        upGenes(){
            return this.getTopGenes(true);
        },
        downGenes(){
            return this.getTopGenes(false);
        }
    },
    async mounted() {
        this.init();
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
            await this.$store.dispatch("queryBulkFile");
            await this.populateEnrichr();
            this.dataReady = true;
        },
        async populateEnrichr(){
            this.enrichrReady = false;
            this.enrichrUp = [];
            this.enrichrDown = [];
            this.enrichrUp = await getEnrichr(this.upGenes, this.enrichrLibrary, this.truncateEnrichr);
            this.enrichrDown = await getEnrichr(this.downGenes, this.enrichrLibrary, this.truncateEnrichr);
            this.enrichrColorScale = createColorScale(this.colorScaleEndpoints, [ACCESSIBLE_DARK_GRAY, ACCESSIBLE_PURPLE]);
            this.enrichrReady = true;
        },
        async getBulkMetadata() {
            if (!this.allMetadata) {
                let metadataUrl = `${BIO_INDEX_HOST}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`;
                let myMetadata = await scUtils.fetchMetadata(metadataUrl);
                this.allMetadata = myMetadata;
            }

            this.bulkMetadata = this.allMetadata.find(x => x.datasetId === this.selectedDataset);
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
        getVolcanoConfig(index){
            let config = {
                "type": "volcano plot",
                "label": "This is a Test",
                "legend": "This is a Test",
                "render by": "gene",
                "x axis field": `logFoldChange_${index}`,
                "x axis label": "log2 Fold Change",
                "y axis field": `minusLog10P_${index}`,
                "y axis label": "-log10(FDR adj. p)",
                "width": 500,
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
        selectLibrary(library){
            this.enrichrLibrary = library.item["Gene-set Library"];
            this.libraryPage = 1;
        },
        getTopGenes(up=true){
            let data = structuredClone(this.bulkData19K);
            data = data.filter(d => 
                up ? d.logFoldChange >= this.volcanoXConditionGreater
                : d.logFoldChange <= this.volcanoXConditionLower );
            data = data.filter(d=> d["-log10P"] >= this.volcanoYCondition)
                .map(d => d.gene);
            return data;
        },
        highlight(highlightedGene) {
            this.$store.state.selectedGene = highlightedGene;
        },
        async setVolcano(newYVal){
            if (newYVal === this.volcanoYCondition) {
                return;
            }
            // If any change, refire Enrichr
            this.volcanoYCondition = newYVal;
            await this.populateEnrichr();
        },
        hideTable(){
            this.tableHidden = true;
        },
        getClass(library){
            let libraryName = library["Gene-set Library"];
            return this.enrichrLibrary === libraryName ? "selected-library" : "";
        },
        geneFound(found){
            this.foundGene = found;
        },
        combineItems(item1, item2){
            let item = {
                gene: item1.gene,
                minusLog10P_1: item1["-log10P"],
                logFoldChange_1: item1.logFoldChange,
                minusLog10P_2: item2["-log10P"],
                logFoldChange_2: item2.logFoldChange
            };
            return item;
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
                if (newData !== "") {
                    this.getBulkMetadata();
                }
                await this.populateEnrichr();
                this.dataReady = true;
            }
        },
        async enrichrLibrary(newData, oldData){
            if(newData != oldData && newData != 'placeholder'){
                await this.populateEnrichr();
            }
        },
        "$store.state.selectedComp1"(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ comp1: newData });
            }
        },
        "$store.state.selectedComp2"(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ comp2: newData });
            }
        },
        selectedGene(newData, oldData) {
            if (newData !== oldData) {
                keyParams.set({ gene: newData });
            }
        },
        kpDataset(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedDataset = newData;
            }
        },
        kpComp1(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedComp1 = newData;
            }
        },
        kpComp2(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedComp2 = newData;
            }
        },
        kpGene(newData, oldData) {
            if (newData !== oldData) {
                this.$store.state.selectedGene = newData;
            }
        },
        selectedLibraryType(newData, oldData){
            if (!!newData){
                this.tableHidden = false;
            }
        },
        async bulkData19K(newData){
            if (newData.length > 0){
                await this.populateEnrichr();
            }
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
