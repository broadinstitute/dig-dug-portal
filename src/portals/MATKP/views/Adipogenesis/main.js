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
            return allData;
        },
        paginatedData(){
            let pageData = this.filterByPage(this.processedData);
            return pageData;
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
                this.conditionsMap.timePoints.forEach(t => {
                    if (this.avgRep){
                        let newField = {
                            key: `day_${t}_rep_avg`,
                            label: `Day ${t} (avg.)`,
                            sortable: true
                        };
                        baseFields.push(newField);
                    } else {
                        this.conditionsMap.replicates.forEach(r => {
                            let newField = {
                                key: `day_${t}_rep_${r}`,
                                label: `Day ${t}, rep. ${r}`,
                                sortable: true
                            };
                            baseFields.push(newField);
                        });
                    }
                });
            
            
            return baseFields;
        }
    },
    async created() {
        this.metadata = await this.getTimeSeriesMetadata();
        let timeSeriesData = await this.getTimeSeries();
        this.conditionsMap = this.mapConditions(timeSeriesData);
        this.timeSeriesData = this.includeAverages(timeSeriesData);
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
        mapConditions(data){
            let conditions = Object.keys(data[0])
                .filter(t => t.startsWith("GSM"));
            let timeElapsed = new RegExp(/day (-?\d+)/);
            let rep = new RegExp(/replicate (\d+)/);
            let findPrefix = new RegExp(/([^,]*)/);
            let mapping = {
                conditions: {}
            };
            conditions.forEach(c => {
                let sourceName = this.metadata[c].source_name;
                let days = parseInt(sourceName.match(timeElapsed)[1]);
                let replicate = parseInt(sourceName.match(rep)[1]);
                let prefix = sourceName.match(findPrefix)[1];
                let entry = {
                    days: days,
                    replicate: replicate,
                    prefix: prefix,
                    label: `${prefix}`
                };
                mapping.conditions[c] = entry;
            });
            let replicates = Array.from(new Set(Object.values(mapping.conditions).map(v => v.replicate)));
            mapping.replicates = replicates;

            let timePoints = Array.from(new Set(Object.values(mapping.conditions).map(v => v.days)))
            mapping.timePoints = timePoints;
            return mapping;

        },
        filterByPage(data){
            if (!this.zoomedIn){
                return data;
            }
            let currentTranscripts = this.currentTable.map(t => t.transcript_id);
            return data.filter(d => currentTranscripts.includes(d.transcript_id));
        },
        includeAverages(data){
            let conditions = Object.keys(this.conditionsMap.conditions);
            data.forEach(d => {
                this.conditionsMap.timePoints.forEach(time => {
                    let repConditions = conditions.filter(c => 
                        this.conditionsMap.conditions[c].days === time);
                    let replicates = repConditions.map(rc => parseFloat(d[rc]));
                    let avg = replicates.reduce((sum, replicate) => sum + replicate, 0) / replicates.length;
                    let label = `day_${time}_rep_avg`;
                    d[label] = avg;
                });
                // Relabel replicates to conform
                conditions.forEach(c => {
                    let info = this.conditionsMap.conditions[c];
                    let label = `day_${info.days}_rep_${info.replicate}`;
                    d[label] = d[c];
                })
            });
            return data;
        },
        processDataForHeatmap(data){
            if (this.metadata === null || this.timeSeriesData === null){
                return null;
            }
            
            let output = [];
            
            let timePoints = this.conditionsMap.timePoints;
            let replicates = structuredClone(this.conditionsMap.replicates);
            replicates.push("avg");

            data.forEach(tsd => {
                timePoints.forEach(t => {
                    replicates.forEach(rep => {
                        let source = `day_${t}_rep_${rep}`;
                        let entry = {
                            source: source,
                            gene: tsd.gene,
                            transcript_id: tsd.transcript_id,
                            score: tsd[source],
                            days: t,
                            replicate: rep,
                            order: tsd.order,
                            gene_tx: `${tsd.gene}___${tsd.transcript_id}`,
                            identifier: `${tsd.transcript_id}_rep_${rep}`
                        }
                        output.push(entry);
                    });
                });
            });
            this.ready = true;
            return output;
        },
        async queryGenes(){
            let delimiters = /[\s;,]+/;
            let geneSearchArray = this.geneSearchQuery.split(delimiters);
            let results = await this.multiqueryGenes(geneSearchArray);
            this.geneSearchResults = this.includeAverages(results.data);
            console.log(JSON.stringify(this.geneSearchResults[0]));
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
            this.ready = false;
            if (this.minScore === null && this.maxScore === null){
                this.minScore = this.extremeVal(newData);
                this.maxScore = this.extremeVal(newData, false);
                this.ready = true;
            }
        }
    },
    render: (h) => h(Template),
}).$mount("#app");