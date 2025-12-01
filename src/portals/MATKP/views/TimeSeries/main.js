import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
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
    store,
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
    },
    mixins: [matkpMixin],
    data() {
        return {
            plotId: "time_series_heatmap",
            timeSeriesId: "GSE20696", // hardcoded for sample,
            timeSeriesData: null,
            metadata: null,
            heatmapConfig: {
                "type": "heat map",
                "label": "Time-Series Data",
                "main": {
                    "field": "score",
                    "label": "Time Series",
                    "type": "scale",
                    "direction": "positive"
                },
                "column field": "source",
                "column label": "source",
                "row field": "gene",
                "row label": "gene",
                "font size": 12
            },
            
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
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        diseaseSystem() {
            return this.$store.getters["bioPortal/diseaseSystem"];
        },
        tissueData() {
            return this.$store.getters["tissueData"];
        },
        cs2ctData() {
            let data = this.$store.state.cs2ct.data;
            data.forEach((d) => {
                // Makes biosamples show up alphabetically in the dropdown menu.
                d.originalBiosample = d.biosample;
                d.biosample = Formatters.tissueFormatter(d.biosample);
            });
            return data.filter(d => d.source !== 'bottom-line_analysis_rare');
        },
        processedData(){
            if (this.metadata === null || this.timeSeriesData === null){
                return null;
            }
            let conditions = Object.keys(this.timeSeriesData[0]).filter(t => t !== "gene");
            let output = [];
            this.timeSeriesData.forEach(tsd => {
                conditions.forEach(c => {
                    let conditionMetadata = this.metadata[c];
                    let entry = {
                        gene: tsd.gene,
                        source: conditionMetadata.source_name,
                        score: tsd[c]
                    }
                    output.push(entry);
                });
            });
            return output;
        }
    },
    async created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("getTissue");
        this.$store.dispatch("getAnnotations");
        this.$store.dispatch("getAncestries");
        this.metadata = await this.getTimeSeriesMetadata();
        console.log(JSON.stringify(this.metadata));
        this.timeSeriesData = await this.getTimeSeries();
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        getTopPhenotype(phenotype) {
            if (this.$store.state.selectedPhenotype === null){
                this.$store.dispatch("onPhenotypeChange", phenotype);
            }
        },
        onAnnotationSelected(){
            this.$store.commit("setSelectedAnnotation", this.annotation);
            this.$store.dispatch("getCs2ct");
        },
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
            let datasetFile = `${TIME_SERIES_RAW}${this.timeSeriesId}/transcripts_by_sample.tsv`;
            const response = await fetch(datasetFile);
            const bulkDataText = await response.text();
            let bulkDataObject = dataConvert.tsv2Json(bulkDataText);
            console.log(JSON.stringify(bulkDataObject[0]));
            return bulkDataObject;
        },
    },
    watch: {
        "$store.state.annotationOptions"(data) {
            this.annotation = data[0];
        },
        "$store.state.selectedAncestry"(){
            this.$store.dispatch("getCs2ct");
        },
    },
    render: (h) => h(Template),
}).$mount("#app");