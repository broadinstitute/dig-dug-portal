import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import StaticPageInfo from "@/components/StaticPageInfo.vue";
import uiUtils from "@/utils/uiUtils";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        StaticPageInfo,
        PortalDatasetsListTable,
    },
    mixins: [pageMixin],

    computed: {
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

        pageInfo() {
            let contents = this.$store.state.kp4cd.pageInfo;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },

        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getPageInfo", {
                page: "publications",
                portal: group.name,
            });
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    methods: {
        ...uiUtils,
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
