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

new Vue({
    store,

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
        console.log('Running in dev mode, console logs enabled.');

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
        geneOrRegion() {
            return this.$store.state.geneOrRegion;
        },
        datasetsInfo() {
            let datasets = this.$store.state.kp4cd.datasetsInfo;

            if (datasets.length === 0) {
                return {};
            }

            return datasets[0];
        }
    },

    watch: {
        geneOrRegion() {
            this.$store.commit('setInvalidGeneOrRegion', false);
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getNewsFeed", group.name);
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
        },
    }
}).$mount("#app");
