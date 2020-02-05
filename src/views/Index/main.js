import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import NewsFeedSection from "@/components/NewsFeedSection.vue";
import AboutPortalSection from "@/components/AboutPortalSection.vue";
import AboutProjectSection from "@/components/AboutProjectSection.vue";
import datasetsSection from "@/components/DatasetsSection.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        PhenotypeSelectPicker,
        NewsFeedSection,
        AboutPortalSection,
        AboutProjectSection,
        datasetsSection
    },

    created() {
        this.$store.dispatch("metadataModule/getMetadata");
        this.$store.dispatch("graphPhenotype/list");
        this.$store.dispatch("kp4cd/getNewsFeed", this.$store.state.diseaseGroup);
        this.$store.dispatch("kp4cd/getFrontContents", this.$store.state.diseaseGroup);
        this.$store.dispatch("kp4cd/getDatasetsInfo", this.$store.state.diseaseGroup);
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
