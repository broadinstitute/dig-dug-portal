import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import CriterionFunctionGroup from "../../../../components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "../../../../components/criterion/FilterPValue.vue";
import FilterEnumeration from "../../../../components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "../../../../components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "../../../../components/criterion/FilterLessThan.vue";
import SearchHeaderWrapper from "../../../../components/SearchHeaderWrapper.vue";
import TissueSelectPicker from "../../../../components/TissueSelectPicker.vue";
import Scatterplot from "../../../../components/Scatterplot.vue";
import MouseSummaryTable from "../../../../components/MouseSummaryTable.vue";
import MouseTissueSelect from "../../../../components/MouseTissueSelect.vue";
import MouseGeneSelect from "../../../../components/MouseGeneSelect.vue";
import MouseDiffExpTable from "../../../../components/MouseDiffExpTable.vue";
import MouseWhiskerPlot from "../../../../components/MouseWhiskerPlot.vue";
import ResearchPheWAS from "../../../../components/researchPortal/ResearchPheWAS.vue";
import HugeScoresTable from "../../../../components/HugeScoresTable.vue";
import UnauthorizedMessage from "../../../../components/UnauthorizedMessage";
import GeneAssociationsTable from "../../../../components/GeneAssociationsTable";
import GeneAssociationsMasks from "../../../../components/GeneAssociationsMasks";

import uiUtils from "../../../../utils/uiUtils.js";
import plotUtils from "../../../../utils/plotUtils.js";
import sortUtils from "../../../../utils/sortUtils.js";
import alertUtils from "../../../../utils/alertUtils.js";
import Formatters from "../../../../utils/formatters.js";
import dataConvert from "../../../../utils/dataConvert.js";
import keyParams from "../../../../utils/keyParams.js";
import regionUtils from "../../../../utils/regionUtils.js";

import "../../assets/layout.css";
import "../../assets/mouseportal.css";
import "../../assets/mdkp_copy.css";
import MouseSingleSearch from "../../components/MouseSingleSearch.vue";
import { pageMixin } from "../../../../mixins/pageMixin.js";

new Vue({
    store,
    components: {
        MouseGeneSelect,
        MouseTissueSelect,
        MouseSingleSearch
    },
    mixins: [pageMixin],
    data() {
        return {
            searchConfig: {
                "search instruction": "Search by gene or tissue",
                "search parameters": [
                    { parameter: "gene", values: []}, 
                    { parameter: "tissue", values: []}]
            }
        };
    },
    methods: {
        goToGene(gene){
            location.href = `/gene.html?gene=${gene}`;
        },
        goToTissue(tissue){
            location.href = `/tissue.html?tissue=${tissue}`;
        }
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
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
