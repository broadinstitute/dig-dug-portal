import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/matkp-styles.css";
import { matkpMixin } from "../../mixins/matkpMixin.js";
import { getTimeSeries, mapConditions, includeAverages, processDataForHeatmap} from "@/portals/MATKP/utils/adipogenesis.js";
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
            minScore: null,
            maxScore: null,
            transcripts: ["1415687_a_at"],
            fullTxSuffix: "full_transcript_data.tsv.gz",
            top100Suffix: "heatmap_top100_transcript_data.tsv.gz",
            currentPage: 1,
            conditionsMap: null,
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
            if (this.conditionsMap === null){
                return null;
            }
            let allData = processDataForHeatmap(this.timeSeriesData, this.conditionsMap);
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
            return processDataForHeatmap(this.geneSearchResults);
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
            
            
            return baseFields;
        }
    },
    async created() {
        let timeSeriesData = await getTimeSeries(this.timeSeriesId);
        this.conditionsMap = await mapConditions(timeSeriesData, this.timeSeriesId);
        this.timeSeriesData = includeAverages(timeSeriesData, this.conditionsMap);
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        filterByPage(data){
            if (!this.zoomedIn){
                return data;
            }
            let currentTranscripts = this.currentTable.map(t => t.transcript_id);
            return data.filter(d => currentTranscripts.includes(d.transcript_id));
        },
        async queryGenes(){
            let delimiters = /[\s;,]+/;
            let geneSearchArray = this.geneSearchQuery.split(delimiters);
            let results = await this.multiqueryGenes(geneSearchArray);
            this.geneSearchResults = includeAverages(results.data, this.conditionsMap);
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