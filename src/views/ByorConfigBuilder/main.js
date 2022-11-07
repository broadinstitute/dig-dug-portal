import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import TranscriptionFactorsTable from "@/components/TranscriptionFactorsTable.vue";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import DataPasteBox from "@/components/researchPortal/configBuilder/DataPasteBox.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        UnauthorizedMessage,
        DataPasteBox,
        // why does it behave badly if we remove TranscriptionFactorsTable?
        TranscriptionFactorsTable
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
    },

    computed: {
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
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    }
}).$mount("#app");
