import Vue, { h } from "vue";
import Template from "./Template.vue";
import "../../assets/matkp-styles.css";
import { matkpMixin } from "../../mixins/matkpMixin.js";
import { getTimeSeries, mapConditions, includeAverages, processDataForHeatmap, extremeVal } from "@/portals/MATKP/utils/adipogenesis.js";
import { getTextContent } from "../../utils/content.js";
import TissueHeritabilityTable from "@/components/TissueHeritabilityTable.vue";
import TissueExpressionTable from "@/components/TissueExpressionTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "@/components/criterion/FilterLessThan.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import Scatterplot from "@/components/Scatterplot.vue";
import MouseSummaryTable from "@/components/MouseSummaryTable.vue";
import C2ctTable from "@/components/C2ctTable.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker.vue";
import Documentation from "@/components/Documentation.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
import PatternSelector from "../../components/PatternSelector.vue";
import TimeSeriesHeatmap from "../../components/TimeSeriesHeatmap.vue";
import TimeSeriesLinePlot from "../../components/TimeSeriesLinePlot.vue";
import TimeSeriesDisplay from "../../components/TimeSeriesDisplay.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"

const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";

new Vue({
    components: {
        TissueHeritabilityTable,
        TissueExpressionTable,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterLessThan,
        SearchHeaderWrapper,
        Scatterplot,
        MouseSummaryTable,
        C2ctTable,
        PhenotypeSelectPicker,
        AncestrySelectPicker,
        Documentation,
        TooltipDocumentation,
        PatternSelector,
        TimeSeriesHeatmap,
        TimeSeriesLinePlot,
        TimeSeriesDisplay,
        ResearchSingleCellInfo,
    },
    mixins: [matkpMixin],
    data() {
        return {
            byorPage: "matkp_adipogenesis",
            headerContent: {},
            plotId: "time_series_heatmap",
            defaultDataset: "Time_Series_Mikkelsen2010_Adipogenesis_Mouse", // hardcoded for sample,
            timeSeriesData: null,
            fullTimeSeriesData: null,
            minScore: null,
            maxScore: null,
            datasetMetadata: null,
            currentPage: 1,
            currentPatternPage: 1,
            conditionsMap: null,
            currentTable: [],
            currentPatternTable: [],
            zoomedIn: false,
            avgRep: true,
            rowNorm: true,
            geneSearchQuery: "Fabp4\nAdipoq\nEnpp2",
            geneSearchResults: [],
            ready: false,
            activeTab: 0,
            patternView: true,
            selectedPattern: null,
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
                regionUtils: regionUtils,
            };
            return utils;
        },
        processedData() {
            if (this.conditionsMap === null) {
                return null;
            }
            let allData = processDataForHeatmap(this.timeSeriesData, this.conditionsMap);
            if (allData === null) {
                return null;
            }
            return allData;
        },
        processedFullData() {
            if (this.conditionsMap === null) {
                return null;
            }
            let allData = processDataForHeatmap(this.fullTimeSeriesData, this.conditionsMap);
            return allData;
        },
        patternHeatmapData(){
            return this.collateHeatmapData(true);
        },
        pageHeatmapData(){
            return this.zoomedIn ? this.collateHeatmapData(false) : this.processedData;
        },
        processedGeneSearch() {
            return processDataForHeatmap(this.geneSearchResults, this.conditionsMap);
        },
        tableFields() {
            let baseFields = [
                {
                    key: "order",
                    label: "Rank",
                    sortable: true
                },
                {
                    key: "gene",
                    label: "Gene",
                    sortable: true
                },
                {
                    key: "transcript_id",
                    label: "Transcript",
                    sortable: true
                },
                {
                    key: "max_diff",
                    label: "Max diff.",
                    sortable: true
                }
            ];
            this.conditionsMap.timePoints.forEach(t => {
                if (this.avgRep) {
                    let newField = {
                        key: `day_${t}_rep_avg`,
                        label: `Day ${t} (avg.)`,
                        sortable: true,
                        formatter: Formatters.tpmFormatter
                    };
                    baseFields.push(newField);
                } else {
                    this.conditionsMap.replicates.forEach(r => {
                        let newField = {
                            key: `day_${t}_rep_${r}`,
                            label: `Day ${t}, rep. ${r}`,
                            sortable: true,
                            formatter: Formatters.tpmFormatter
                        };
                        baseFields.push(newField);
                    });
                }
            });
            baseFields.push(
                {
                    key: "pattern",
                    label: "Pattern",
                    sortable: true
                });
            return baseFields;
        },
        patterns(){
            if(this.fullTimeSeriesData === null){
                return [];
            }
            let patternSet = new Set(this.fullTimeSeriesData.map(m => m.pattern));
            let patternArray = Array.from(patternSet);
            // null values are provided if we don't do this
            return patternArray.filter(p => typeof p === "string");
        },
        singlePatternTableData(){
            return this.fullTimeSeriesData.filter(d => d.pattern === this.selectedPattern);
        }
    },
    async created() {
        let header = await getTextContent(this.byorPage);
        this.headerContent = header;
        console.log(this.headerContent);

        if (!keyParams.datasetid) {
            keyParams.set({ datasetid: this.defaultDataset });
        }
        // Get the full data
        let fullTimeSeriesData = await getTimeSeries(keyParams.datasetid, false);
        this.conditionsMap = await mapConditions(fullTimeSeriesData, keyParams.datasetid);
        this.fullTimeSeriesData = includeAverages(fullTimeSeriesData, this.conditionsMap);

        // Get the data for just the top 100
        let timeSeriesData = await getTimeSeries(keyParams.datasetid);
        //this.conditionsMap = await mapConditions(timeSeriesData, keyParams.datasetid);
        this.timeSeriesData = includeAverages(timeSeriesData, this.conditionsMap);
        

        const metadata = await this.getMetadata();
        this.datasetMetadata = metadata;
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        async queryGenes() {
            let delimiters = /[\s;,]+/;
            let geneSearchArray = this.geneSearchQuery.split(delimiters);
            let results = await this.multiqueryGenes(geneSearchArray);
            this.geneSearchResults = includeAverages(results.data, this.conditionsMap);
        },
        async multiqueryGenes(geneArray) {
            let url = "https://matkp.hugeampkpnbi.org/api/bio/multiquery";
            let index = "single-cell-time-series"
            let queryArray = [];
            geneArray.forEach(g => queryArray.push(`${keyParams.datasetid},${g}`));
            let queryObject = {
                "index": index,
                "queries": queryArray
            };
            try {
                return await fetch(url, {
                    method: "POST",
                    body: JSON.stringify(queryObject),
                })
                    .then((response) => response.json());
            } catch (error) {
                throw error;
            }
        },
        async getMetadata() {
            let metadataUrl = `${BIO_INDEX_HOST}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`;
            let myMetadata = await scUtils.fetchMetadata(metadataUrl);
            return myMetadata.find(x => x.datasetId === keyParams.datasetid);
        },
        viewPattern(pattern){
            this.selectedPattern = null; // clearing out old data
            this.selectedPattern = pattern;
            this.activeTab = 0;
        },
        getHeaderContent(item){
            let entry = this.headerContent.find(d => d["key"] == item);
            return entry === undefined ? "" : entry.content;
        },
        collateHeatmapData(isPattern=true){
            let trackTable = isPattern ? this.currentPatternTable : this.currentTable;
            let currentTranscripts = trackTable.map(t => t.transcript_id);

            let allData = isPattern 
                ? this.processedFullData.filter(d => d.pattern === this.selectedPattern)
                : this.processedData;
            let results = [];
            currentTranscripts.forEach(t => {
                results = results.concat(allData.filter(d => d.transcript_id === t));
            })
            return results;
        },
    },
    watch: {
        processedFullData(newData) {
            this.ready = false;
            // TODO MAKE THESE TRULY GLOBAL as in not from top 100
            // also consider whether the ready boolean is even necessary
            if (this.minScore === null && this.maxScore === null) {
                this.minScore = extremeVal(newData);
                this.maxScore = extremeVal(newData, false);
                this.ready = true;
            }
        },
        selectedPattern(newValue){
            this.currentPatternPage = 1;
        },
        
    },
    render: (h) => h(Template),
}).$mount("#app");