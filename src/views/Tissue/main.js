import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import TissueHeritabilityTable from "@/components/TissueHeritabilityTable.vue";
import TissueExpressionTable from "@/components/TissueExpressionTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import TissueSelectPicker from "@/components/TissueSelectPicker.vue";
import Scatterplot from "@/components/Scatterplot.vue";

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
        PageHeader,
        PageFooter,
        Documentation,
        TissueHeritabilityTable,
        TissueExpressionTable,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        SearchHeaderWrapper,
        TissueSelectPicker,
        ResearchSingleSearch,
        Scatterplot
    },
    mixins: [pageMixin],
    data() {
        return {
            tissue: keyParams.tissue || "",
            selectTissue: "",
            plotConfig: {
                xField: "H",
                xAxisLabel: "Entropy (genericity)",
                yField: "meanTpm",
                yAxisLabel: "TPM (mean)",
                dotKey: "gene",
                hoverBoxPosition: "both",
                hoverFields: [
                    { 
                        key: "gene",
                        label: "Gene",
                    },
                    {
                        key: "H",
                        label: "Genericity",
                    },
                    {
                        key: "Q",
                        label: "Combined score"
                    },
                    {
                        key: "meanTpm",
                        label: "TPM (mean)",
                        formatter: Formatters.tpmFormatter
                    },
                    { 
                        key: "nSamples",
                        label: "Samples"
                    }
                ]
            }
        };
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        newTissue(tissue) {
            this.selectTissue = tissue;
        },
        updateTissueData() {
            this.tissue = this.selectTissue;
            this.$store.commit("setTissueName", this.tissue);
            this.$store.dispatch("getTissue");
        },
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

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        diseaseSystem() {
            return this.$store.getters["bioPortal/diseaseSystem"];
        },
        tissueData() {
            return this.$store.getters["tissueData"];
        },
        documentationMap() {
            return {
                tissue: this.tissue
                    ? this.tissue.toUpperCase().replaceAll("_", " ")
                    : "",
            };
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
    },

    render: (h) => h(Template),
}).$mount("#app");
