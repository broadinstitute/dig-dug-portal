import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import store from "./store.js";


import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import StaticPageInfo from "@/components/StaticPageInfo.vue";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

// @vue/component
mountPage(Template, {
    store,

    components: {
        StaticPageInfo,
        PageHeader,
        PageFooter,
        PortalDatasetsListTable,
        Alert,
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
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

        pageInfo() {
            let contents = this.$store.state.kp4cd.pageInfo;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },




    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getPageInfo", { "page": "contacts", "portal": group.name });
        },

    }
});
