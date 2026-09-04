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
import VolcanoPlot from "@/components/eglt/VolcanoPlot";

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
        VolcanoPlot
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
            },
            connectivityPage: 1,
            connectivityDrugPage: 1,
            connectivityDrugFields: [
                { key: "tissue", sortable: true},
                { key: "cell_type", sortable: true},
                { key: "pathway", sortable: true},
                { key: "drug_chembl_id", label: "Drug CHEMBL ID", sortable: true},
                { key: "max_phase", sortable: true},
                { key: "candidate_score", sortable: true},
                { key: "target_name", label: "Target Info"},
                { key: "comparison", sortable: true},
                { key: "reversed_p_adj", formatter: Formatters.pValueFormatter, sortable: true},
                { key: "NES_difference", formatter: Formatters.tpmFormatter, sortable: true},
                { key: "log2FC_in_disease", formatter: Formatters.tpmFormatter, sortable: true},
                { key: "padj_in_disease", formatter: Formatters.pValueFormatter, sortable: true},
                { key: "disease_direction", sortable: true},
                { key: "mean_tpm", formatter: Formatters.tpmFormatter, sortable: true},
                { key: "median_tpm", formatter: Formatters.tpmFormatter, sortable: true},
                { key: "pct_expressed", formatter: Formatters.tpmFormatter, sortable: true},
                { key: "tpm_category", sortable: true},
                { key: "expressed", sortable: true},
            ],
            connectivityTargetFields: [
                { key: "target_name"},
                { key: "target_chembl_id", label: "Target CHEMBL ID"},
                { key: "action_type"},
                { key: "target_type"},
                
            ]
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
        },
        connectivityData(){
            return this.processConnectivityData(this.$store.state.connectivityData);
        },
        connectivityDrugData(){
            return this.processConnectivityData(this.$store.state.connectivityDrugData);
        },
        connectivityFields(){
            let cdFields = this.connectivityDrugFields;
            let cKeys = Object.keys(this.connectivityData[0]);
            if (!cKeys){
                return [];
            }
            return cdFields.filter(f => cKeys.includes(f.key));
        },
        volcanoConfig() {
            // TODO adapt this from matkp
            let config = {
                "type": "volcano plot",
                "label": "",
                "legend": "",
                "renderBy": "pathway",
                "xAxisField": "NES_difference",
                "xAxisLabel": "NES_difference",
                "yAxisField": "minusLogRevPAdj",
                "yAxisLabel": "-log10(reversed_p_adj)",
                "width": 600,
                "height": 400,
                "xCondition": { 
                    "combination": "or", 
                    "greater than": 0, 
                    "lower than": 0 },
                //combination for condition can be "greater than", "lower than", "or" and "and."
                "yCondition": { 
                    "combination": "greater than", 
                    "greater than": 0 },
                "dot label score": 2
                //number of conditions that the value of each dot to meet to have labeled
            };
            return config;
        },
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
        },
        processConnectivityData(data){
            let cData = structuredClone(data);
            for(let i = 0; i < cData.length; i++){
                let cDatum = cData[i];
                if(cDatum.GO_terms === null){
                    cDatum.GO_terms = "";
                }
                cDatum.cell_type = cDatum.cell_type.toUpperCase();
                cDatum.comparison = cDatum.comparison.toUpperCase();
                cDatum.minusLogRevPAdj = - Math.log10(cDatum.reversed_p_adj);
                cDatum.identifier = `${cDatum.cell_type}___${cDatum.pathway}`;
            }
            return cData;
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
