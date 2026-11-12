// Adapted from Endrina's LLM generated html files.
import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import uiUtils from "@/utils/uiUtils";
import Alert from "@/components/Alert";
import InteractiveKP from "./components/InteractiveKP.vue";
import TissueExplorer from "./components/TissueExplorer.vue";

new Vue({
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

    render(createElement, context) {
        return createElement(Template);
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
}).$mount("#app");
