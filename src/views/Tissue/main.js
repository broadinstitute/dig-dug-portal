import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import TissueHeritabilityTable from "@/components/TissueHeritabilityTable.vue";
import TissueExpressionTable from "@/components/TissueExpressionTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "@/components/criterion/FilterLessThan.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import TissueSelectPicker from "@/components/TissueSelectPicker.vue";
import Scatterplot from "@/components/Scatterplot.vue";
import MouseSummaryTable from "@/components/MouseSummaryTable.vue";
import C2ctTable from "@/components/C2ctTable.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker.vue";
import ResearchSingleCellBrowser from "../../components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import { pageMixin } from "@/mixins/pageMixin";
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
        TissueSelectPicker,
        ResearchSingleSearch,
        Scatterplot,
        MouseSummaryTable,
        C2ctTable,
        PhenotypeSelectPicker,
        AncestrySelectPicker,
        ResearchSingleCellBrowser,
    },
    mixins: [pageMixin],
    data() {
        return {
            tissue: keyParams.tissue || "",
            selectTissue: "",
            logScale: false,
            cs2ctAncestry: "",
            plotConfig: {
                xField: "H",
                xAxisLabel: "Entropy (genericity)",
                yField: "meanTpm",
                yAxisLabel: "TPM (mean)",
                dotKey: "gene",
                hoverBoxPosition: "both",
                plotHeight: 300,
                hoverFields: [
                    {
                        key: "gene",
                        label: "Gene",
                    },
                    {
                        key: "H",
                        label: "Genericity",
                        formatter: Formatters.pValueFormatter,
                    },
                    {
                        key: "Q",
                        label: "Combined score",
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "meanTpm",
                        label: "TPM (mean)",
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "nSamples",
                        label: "Samples",
                    },
                ],
            },
            annotation: "",
            scTissueDataset: null,
            scbConfig: {
                type: "cell browser",
                label: "Single Cell Browser",
                parameters:{
                    datasetId: "datasetId",
                    gene: "gene"
                },
                presets:{
                    datasetId: null,
                    layout: 3
                },

                bioIndex: "https://bioindex.hugeamp.org",
                bioIndexDev: "https://bioindex-dev.hugeamp.org"
            }
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
        docDetails() {
            return {
                tissue: this.tissue
                    ? this.tissue.toUpperCase().replaceAll("_", " ")
                    : "",
            };
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
        showDiffExp(){
            return this.deployment !== 'production' &&
                this.$store.state.mouseSummary.data.length > 0;
        },
        hasMatchingSingleCellTissue(){
            console.log('!!', this.$store.state.singleCellDatasets);
            if(!this.$store.state.singleCellDatasets) return false;
            if(!Array.isArray(this.$store.state.singleCellDatasets)) return false;
            if(!this.tissue) return false;
            const scTissue = this.$store.state.singleCellDatasets.find(x => x.tissue_a2fkp === this.tissue);
            if(scTissue){
                this.scTissueDataset = scTissue;
                this.scbConfig.presets.datasetId = scTissue.datasetId;
                return true;
            }else{
                return false;
            }
        }
    },
    created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        if (this.tissue) {
            this.$store.dispatch("getTissue");
        }
        this.$store.dispatch("getAnnotations");
        this.$store.dispatch("getAncestries");
        this.$store.dispatch("getSingleCellDatasets");
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        newTissue(tissue) {
            this.selectTissue = tissue;
        },
        updateTissueData() {
            this.tissue = this.selectTissue;
            this.$store.commit("setTissueName", this.tissue);
            this.$store.dispatch("getTissue");
        },
        getTopPhenotype(phenotype) {
            if (this.$store.state.selectedPhenotype === null){
                this.$store.dispatch("onPhenotypeChange", phenotype);
            }
        },
        onAnnotationSelected(){
            this.$store.commit("setSelectedAnnotation", this.annotation);
            this.$store.dispatch("getCs2ct");
        }
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
