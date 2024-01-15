import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import Documentation from "@/components/Documentation.vue";
import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import StaticPageInfo from "@/components/StaticPageInfo.vue";
import ResearchPageFilters from "@/components/researchPortal/ResearchPageFilters.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

new Vue({
    store,

    components: {
        StaticPageInfo,
        Documentation,
        PageHeader,
        PageFooter,
        PortalDatasetsListTable,
        Alert,
        ResearchPageFilters
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
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
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
            }
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

        pageInfo() {
            let contents = this.$store.state.kp4cd.pageInfo;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },

        eglSummaries() {
            let contents = this.$store.state.kp4cd.eglSummaries;

            if (contents.length === 0) {
                return {};
            }
            this.$store.dispatch("filteredData", contents);
            this.$store.dispatch("unfilteredData", contents);

            return contents;
        },
        summaryData() {
            if (Object.keys(this.eglSummaries).length == 0) {
                return null;
            } else {
                let content = { data: this.eglSummaries };
                return content;
            }
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
            this.$store.dispatch("kp4cd/getPageInfo", { "page": "eglmethodscollection", "portal": group.name });
            this.$store.dispatch("kp4cd/getEglSummaries", group.name);
        },
    }
}).$mount("#app");
