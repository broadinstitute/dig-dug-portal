import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/matkp-styles.css";
import { matkpMixin } from "../../mixins/matkpMixin.js";
import { getTextContent } from "@/portals/MATKP/utils/content";
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
import TimeSeriesHeatmap from "../../components/TimeSeriesHeatmap.vue";
import TimeSeriesLinePlot from "../../components/TimeSeriesLinePlot.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
const TIME_SERIES_RAW = "https://matkp.hugeampkpnbi.org/api/raw/file/single_cell_time_series/";

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
        TimeSeriesHeatmap,
        TimeSeriesLinePlot
    },
    mixins: [matkpMixin],
    data() {
        return {
            plotId: "time_series_heatmap",
            timeSeriesId: "GSE20696", // hardcoded for sample,
            timeSeriesData: null,
            metadata: null,
            minScore: null,
            maxScore: null,
            transcripts: ["1415687_a_at"],
            fullTxSuffix: "full_transcript_data.tsv.gz",
            top100Suffix: "heatmap_top100_transcript_data.tsv.gz",
            currentPage: 1,
            conditions: [],
            currentTable: [],
            zoomedIn: true,
            avgRep: true,
            clusterOn: false,
            activeTab: 0,
            geneSearchQuery: "Fabp4\nAdipoq\nEnpp2",
            geneSearchResults: [],
            ready: false
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
        processedData(){
            let allData = this.processDataForHeatmap(this.timeSeriesData, true);
            if (allData === null){
                return null;
            }
            return allData.filter(d => this.avgRep 
                ? d.replicate === "avg"
                : d.replicate !== "avg");
        },
        paginatedData(){
            return this.filterByPage(this.processedData);
        },
        processedGeneSearch(){
            return this.processDataForHeatmap(this.geneSearchResults);
        },
        heatmapConfig(){
            return {
                "type": "heat map",
                "label": "Time-Series Data",
                "main": {
                    "field": "score",
                    "label": "score",
                    "type": "scale",
                    "direction": "positive",
                    "low": this.minScore,
                    "middle": (this.minScore + this.maxScore) / 2,
                    "high": this.maxScore
                },
                "column field": "source",
                "column label": "source",
                "row field": "gene_tx",
                "row label": "Gene / transcript",
                "font size": 12,
            }
        },
        linePlotConfig(){
            return {
                xField: "days",
                xAxisLabel: "Time (days)",
                xMin: -2,
                xMax: 7,
                yField: "score",
                yAxisLabel: "",
                yMin: this.minScore,
                yMax: this.maxScore,
                dotKey: "identifier",
                hoverBoxPosition: "both",
                hoverFields: [
                    {key: "transcript_id", label: "Transcript"},
                    {key: "days", label: "Day"},
                ],
            }
        },
        tableFields(){
            let baseFields = [
                {
                    key: "order",
                    label: "Rank",
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
                },
                {
                    key: "gene",
                    label: "Gene",
                    sortable: true
                },
                {
                    key: "pattern",
                    label: "Pattern",
                    sortable: true
                }
                
            ];
            this.conditions.forEach(c => {
                let newField = {
                    key: c,
                    label: this.getSourceName(c),
                    sortable: true
                };
                baseFields.push(newField);
            });
            return baseFields;
        }
    },
    async created() {
        this.metadata = await this.getTimeSeriesMetadata();
        this.timeSeriesData = await this.getTimeSeries();
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        async getTimeSeriesMetadata(){
            let queryUrl = `https://matkp.hugeampkpnbi.org/api/raw/file/single_cell_time_series/${this.timeSeriesId}/sample_metadata.json.gz`;
            try {
                const response = await fetch(queryUrl);
                const data = await(response.text());
                let crudeParse = data.split("}").map(t => `${t}}`);
                crudeParse = crudeParse.slice(0, crudeParse.length - 1);
                crudeParse = crudeParse.map(t => JSON.parse(t));
                let directory = {};
                crudeParse.forEach(c => {
                    let sample = c.sample_id;
                    directory[sample] = c;
                });
                return directory;
            }
            catch(error) {
                console.error("Error: ", error);
                return {};
            }
        },
        async getTimeSeries(top100=true) {
            let suffix = top100 ? this.top100Suffix : this.fullTxSuffix;
            let datasetFile = `${TIME_SERIES_RAW}${this.timeSeriesId}/${suffix}`;
            const response = await fetch(datasetFile);
            const bulkDataText = await response.text();
            let bulkDataObject = dataConvert.tsv2Json(bulkDataText);
            bulkDataObject = bulkDataObject.slice(0,5000);
            return bulkDataObject;
        },
        getSourceName(label){
            let metadataEntry = this.metadata[label];
            return metadataEntry.source_name;
        },
        filterByPage(data){
            if (!this.zoomedIn){
                return data;
            }
            let currentTranscripts = this.currentTable.map(t => t.transcript_id);
            return data.filter(d => currentTranscripts.includes(d.transcript_id));
        },
        processDataForHeatmap(data){
            if (this.metadata === null || this.timeSeriesData === null){
                return null;
            }
            console.log(JSON.stringify(data[0]));

            if (this.conditions.length === 0){
                this.conditions = Object.keys(data[0])
                .filter(t => t.startsWith("GSM"));
            }
            
            let output = [];
            let sampleData = structuredClone(data);
            
			let timeElapsed = new RegExp(/day (-?\d+)/);
            let rep = new RegExp(/replicate (\d+)/);
		
            sampleData.forEach(tsd => {
                let tsdEntries = [];
                this.conditions.forEach(c => {
                    let sourceName = this.getSourceName(c)
                    let score = tsd[c];
                    let days = parseInt(sourceName.match(timeElapsed)[1]);
                    let replicate = parseInt(sourceName.match(rep)[1]);
                    let entry = {
                        gene: tsd.gene,
                        transcript_id: tsd.transcript_id,
                        source: sourceName,
                        score: score,
                        days: days,
                        replicate: replicate,
                        order: tsd.order,
                        gene_tx: `${tsd.gene}___${tsd.transcript_id}`,
                        identifier: `${tsd.transcript_id}_rep_${replicate}`
                    }
                    tsdEntries.push(entry);
                });
                // Calculate averages by timepoint across all replicates
                let timePoints = Array.from(new Set(tsdEntries.map(t => t.days)));
                let avgEntries = [];
                timePoints.forEach(timePoint => {
                    let replicates = tsdEntries.filter(e => e.days === timePoint);
                    let avg = replicates.reduce((sum, replicate) => sum + replicate.score, 0) / replicates.length;
                    let entry = structuredClone(replicates[0]);
                    entry.score = avg;
                    entry.replicate = "avg"
                    entry.identifier = `${entry.transcript_id}_rep_avg`;
                    entry.source = entry.source.replace(rep, "avg");
                    avgEntries.push(entry);
                })
                output = output.concat(tsdEntries).concat(avgEntries);
            });
            return output;
        },
        async queryGenes(){
            let delimiters = /[\s;,]+/;
            let geneSearchArray = this.geneSearchQuery.split(delimiters);
            let results = await this.multiqueryGenes(geneSearchArray);
            this.geneSearchResults = results.data;
            
        },
        async multiqueryGenes(geneArray){
            let url = "https://matkp.hugeampkpnbi.org/api/bio/multiquery";
            let index = "single-cell-time-series"
            let queryArray = [];
            geneArray.forEach(g => queryArray.push(`${this.timeSeriesId},${g}`));
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
        extremeVal(data, min=true){
            let extreme = data[0].score;
            data.forEach(d => extreme = 
                (min && d.score < extreme) || (!min && d.score > extreme)
                ? d.score
                : extreme);
            return extreme;
        }
    },
    watch: {
        processedData(newData){
            if (this.minScore === null && this.maxScore === null){
                this.minScore = this.extremeVal(newData);
                this.maxScore = this.extremeVal(newData, false);
                this.ready = true;
            }
        }
    },
    render: (h) => h(Template),
}).$mount("#app");