import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import keyParams from "@/utils/keyParams";
import TissueHeritabilityTable from "@/components/TissueHeritabilityTable.vue";
import TissueExpressionDisplay from "@/components/TissueExpressionDisplay.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import TissueSelectPicker from "@/components/TissueSelectPicker.vue";

import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import { pageMixin } from "@/mixins/pageMixin";
new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Documentation,
        TissueHeritabilityTable,
        TissueExpressionDisplay,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        SearchHeaderWrapper,
        TissueSelectPicker,
        ResearchSingleSearch,
    },
    mixins: [pageMixin],
    data() {
        return {
            tissue: keyParams.tissue || "",
            selectTissue: "",
        };
    },
    methods: {
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
