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
        this.$store.dispatch("metadataModule/getMetadata");
        this.$store.dispatch("graphPhenotype/list");
        this.$store.dispatch("kp4cd/getNewsFeed", this.$store.state.diseaseGroup.id);
        this.$store.dispatch("kp4cd/getFrontContents", this.$store.state.diseaseGroup.id);
        this.$store.dispatch("kp4cd/getDatasetsInfo", this.$store.state.diseaseGroup.id);
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        phenotypes() {
            return this.$store.getters["graphPhenotype/phenotypes"];
        },
    },

    methods: {
    }
}).$mount("#app");
