import { mountPage } from "@/utils/pageSetup";

//import BootstrapVue from "bootstrap-vue";
//import { BootstrapVueIcons } from "bootstrap-vue";

import Template from "./Template.vue";
import store from "./store.js";


import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import uiUtils from "@/utils/uiUtils";

//import kpDataViewerPkg from "@/components/kpDataViewer/kpDataViewerPkg.vue";
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
        PageHeader,
        PageFooter,
        Alert,
        kpDataViewerPkg
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        async getResearchData(TYPE) {

            let fetchUrl = "";
            if (TYPE == "start") {
                fetchUrl = "https://bioindex.hugeamp.org/api/bio/query/associations?q=T2D,9:21940000-22190000";
            } else if (TYPE == "continue") {
                fetchUrl = "https://bioindex.hugeamp.org/api/bio/cont?token=" + this.$store.state.assoDataContinuation;
            }
            let researchData = await fetch(fetchUrl).then(resp => resp.json());

            if (researchData.error == null) {
                if (TYPE == "start") {
                    this.$store.dispatch("associationData", researchData);
                } else if (TYPE == "continue") {
                    this.$store.dispatch("moreAssociationData", researchData);
                }

                if (researchData.continuation != null) {
                    this.getResearchData("continue");
                }
            }
        },
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

    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.getResearchData("start")
        },

    }
});
