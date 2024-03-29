import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;


import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PaperPageHeader from "@/components/PaperPageHeader.vue";
import PaperPageFooter from "@/components/PaperPageFooter.vue";
import ResearchMethod from "@/components/eglt/ResearchMethod.vue";
import uiUtils from "@/utils/uiUtils";
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
        PaperPageHeader,
        PaperPageFooter,
        PortalDatasetsListTable,
        Alert,
        ResearchMethod,
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("kp4cd/getResearchMethod", keyParams.paper);
        this.$store.dispatch("kp4cd/getPaperMenu", keyParams.paper);
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

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        researchMethod() {
            let contents = this.$store.state.kp4cd.researchMethod;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },
        paperMenu() {
            let contents = this.$store.state.kp4cd.paperMenu;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

    }
}).$mount("#app");
