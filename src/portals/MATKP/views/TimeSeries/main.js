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
            conditions: []
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
            if (this.metadata === null || this.timeSeriesData === null){
                return null;
            }
            let conditions = Object.keys(this.timeSeriesData[0])
                .filter(t => t.startsWith("GSM"));
            this.conditions = conditions;
            
            let output = [];
            let sampleData = this.timeSeriesData.slice(0,1000);

            // Calculate min and max scores at the same time
            let minScore = null;
            let maxScore = null;
            
			let timeElapsed = new RegExp(/day (-?\d+)/);
            let rep = new RegExp(/replicate (\d+)/);
		
            sampleData.forEach(tsd => {
                conditions.forEach(c => {
                    let sourceName = this.getSourceName(c)
                    let score = tsd[c];
                    if (minScore === null || score < minScore){
                        minScore = score;
                    }
                    if (maxScore === null || score > maxScore){
                        maxScore = score;
                    }
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
                    output.push(entry);
                });
            });
            this.minScore = minScore;
            this.maxScore = maxScore;
            return output;
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
                "font size": 12
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
        async getTimeSeries() {
            let datasetFile = `${TIME_SERIES_RAW}${this.timeSeriesId}/${this.top100Suffix}`;
            const response = await fetch(datasetFile);
            const bulkDataText = await response.text();
            let bulkDataObject = dataConvert.tsv2Json(bulkDataText);
            console.log(JSON.stringify(bulkDataObject[0]));
            return bulkDataObject;
        },
        getSourceName(label){
            let metadataEntry = this.metadata[label];
            return metadataEntry.source_name;
        }
    },
    render: (h) => h(Template),
}).$mount("#app");