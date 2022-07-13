import Vue from "vue";
//import VueCodeMirror from "vue-codemirror";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import VueCodemirror from "vue-codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";

Vue.use(BootstrapVue);
Vue.use(VueCodemirror);
Vue.config.productionTip = false;

import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import StaticPageInfo from "@/components/StaticPageInfo.vue";
import ResearchSummaryPlot from "@/components/researchPortal/ResearchSummaryPlot.vue";
import uiUtils from "@/utils/uiUtils";
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
        PageHeader,
        PageFooter,
        PortalDatasetsListTable,
        Alert,
        ResearchSummaryPlot
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    mounted() {
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {},

    data() {
        return {};
    },

    computed: {
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getPageInfo", {
                page: "about",
                portal: group.name
            });
        }
    }
}).$mount("#app");
