// Adapted from Endrina's LLM generated html files.
import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import uiUtils from "@/utils/uiUtils";
import Alert from "@/components/Alert";
import InteractiveKP from "./components/InteractiveKP.vue";
import TissueExplorer from "./components/TissueExplorer.vue";

// @vue/component
mountPage(Template, {
    store,
    components: {
        PageHeader,
        PageFooter,
        Alert,
        InteractiveKP,
        TissueExplorer
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    methods: {
        ...uiUtils,
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
            this.$store.dispatch("kp4cd/getPageInfo", { "page": "contacts", "portal": group.name });
        },

    }
});
