import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import NewsFeedSection from "@/components/frontPage/NewsFeedSection.vue";
import AboutPortalSection from "@/components/frontPage/AboutPortalSection.vue";
import AboutProjectSection from "@/components/frontPage/AboutProjectSection.vue";
import DatasetsSection from "@/components/frontPage/DatasetsSection.vue";
import DiseaseGroupSelect from "@/components/DiseaseGroupSelect.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import Documentation from "@/components/Documentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";

import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

new Vue({
    store,

    data: {
        selected: '',
        searches: [
            { id: 'gene', name: 'gene' },
            { id: 'variantOrRegion', name: 'variantOrRegion' },
        ],
    },

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        NewsFeedSection,
        AboutPortalSection,
        AboutProjectSection,
        DatasetsSection,
        DiseaseGroupSelect,
        TooltipDocumentation,
        Documentation,
        Autocomplete,
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert
    },

    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        userInput() {
            return this.$store.state.userInput;
        },
        matchingGenes() {
            return ["pcs", "pcsk9"];;
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        geneOrRegionOrVariant() {
            return this.$store.state.geneOrRegionOrVariant;
        },

        datasetsInfo() {
            let datasets = this.$store.state.kp4cd.datasetsInfo;

            if (datasets.length === 0) {
                return {};
            }
            return datasets[0];
        },
    },

    watch: {
        geneOrRegionOrVariant() {
            this.$store.commit("setInvalidGeneOrRegionOrVariant", false);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getNewsFeed", group.name);
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
        },
        userInput(input) {
            console.log("i am here");
            this.$store.dispatch("lookupGenes", input);
        }
    }
}).$mount("#app");
