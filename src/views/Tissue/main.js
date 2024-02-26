import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import keyParams from "@/utils/keyParams";
import TissueTable from "@/components/TissueTable.vue";
import TissueHeritabilityTable from "@/components/TissueHeritabilityTable.vue";
import TissueExpressionDisplay from "@/components/TissueExpressionDisplay.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Documentation,
        TissueTable,
        TissueHeritabilityTable,
        TissueExpressionDisplay,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
    },
    data() {
        return {
            tissue: keyParams.tissue || "",
        };
    },
    computed: {
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
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
