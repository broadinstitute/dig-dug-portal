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
import uiUtils from "@/utils/uiUtils";

new Vue({
    store,

    data: {
        searchExamples: {
            "md": { "gene": "SLC30A8", "variant": "rs13266634", "region": "9:21,940,000-22,190,000" },
            "t2d": { "gene": "SLC30A8", "variant": "rs13266634", "region": "9:21,940,000-22,190,000" },
            "cvd": { "gene": "LPA", "variant": "rs10965215", "region": "9:20,940,000-21,800,000" },
            "cd": { "gene": "HDAC9", "variant": "rs2984613", "region": "7:18,100,000-18,300,000" },
            "sleep": { "gene": "PAX8", "variant": "rs62158211", "region": "2:113,873,524-114,136,577" }

        }
    },

    methods: {
        ...uiUtils,
    },

    components: {
        PageHeader,
        PageFooter,
        PhenotypeSelectPicker,
        NewsFeedSection,
        AboutPortalSection,
        AboutProjectSection,
        DatasetsSection,
        DiseaseGroupSelect
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        diseaseGroup() {
            return this.$store.getters['bioPortal/diseaseGroup'];
        },
        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
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
            this.$store.commit('setInvalidGeneOrRegionOrVariant', false);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getNewsFeed", group.name);
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
        },

    }
}).$mount("#app");
