import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/matkp-styles.css";
import { matkpMixin } from "../../mixins/matkpMixin.js";
import { getTimeSeries, mapConditions, includeAverages, processDataForHeatmap, extremeVal } from "@/portals/MATKP/utils/adipogenesis.js";
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
        TimeSeriesHeatmap,
        TimeSeriesLinePlot,
        TimeSeriesDisplay,
        ResearchSingleCellInfo
    },
    mixins: [matkpMixin],
    data() {
        return {
            plotId: "time_series_heatmap",
            defaultDataset: "Time_Series_Mikkelsen2010_Adipogenesis_Mouse", // hardcoded for sample,
            timeSeriesData: null,
            minScore: null,
            maxScore: null,
            fullTxSuffix: "full_transcript_data.tsv.gz",
            top100Suffix: "heatmap_top100_transcript_data.tsv.gz",
            datasetMetadata: null,
            currentPage: 1,
            conditionsMap: null,
            currentTable: [],
            zoomedIn: false,
            avgRep: true,
            rowNorm: true,
            clusterOn: false,
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
        paginatedData() {
            let pageData = this.filterByPage(this.processedData);
            return pageData;
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
                },
                {
                    key: "pattern",
                    label: "Pattern",
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


            return baseFields;
        },
    },
    async created() {
        if (!keyParams.datasetid) {
            keyParams.set({ datasetid: this.defaultDataset });
        }
        let timeSeriesData = await getTimeSeries(keyParams.datasetid);
        this.conditionsMap = await mapConditions(timeSeriesData, keyParams.datasetid);
        this.timeSeriesData = includeAverages(timeSeriesData, this.conditionsMap);
        const metadata = await this.getMetadata();
        this.datasetMetadata = metadata;
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        filterByPage(data) {
            if (!this.zoomedIn) {
                return data;
            }
            let currentTranscripts = this.currentTable.map(t => t.transcript_id);
            return data.filter(d => currentTranscripts.includes(d.transcript_id));
        },
        async queryGenes() {
            let delimiters = /[\s;,]+/;
            let geneSearchArray = this.geneSearchQuery.split(delimiters);
            let results = await this.multiqueryGenes(geneSearchArray);
            this.geneSearchResults = includeAverages(results.data, this.conditionsMap);
            console.log(JSON.stringify(this.geneSearchResults[0]));
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
    },
    watch: {
        processedData(newData) {
            this.ready = false;
            if (this.minScore === null && this.maxScore === null) {
                this.minScore = extremeVal(newData);
                this.maxScore = extremeVal(newData, false);
                this.ready = true;
            }
        }
    },
    render: (h) => h(Template),
}).$mount("#app");