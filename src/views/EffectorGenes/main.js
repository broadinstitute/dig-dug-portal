import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ResearchMethod from "@/components/ResearchMethod.vue";
import EffectorGenesRichards from "@/components/EffectorGenesRichards.vue";
import EffectorGenesGraphRichards from "@/components/EffectorGenesGraphRichards.vue";
import EffectorGenesManning from "@/components/EffectorGenesManning.vue";
import EffectorGenesMccarthy from "@/components/EffectorGenesMccarthy.vue";
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
        PageHeader,
        PageFooter,
        Alert,
        ResearchMethod,
        EffectorGenesRichards,
        EffectorGenesGraphRichards,
        EffectorGenesManning
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("kp4cd/getResearchMethod", keyParams.dataset);
        this.$store.dispatch("kp4cd/getEglConfig", { dataset: keyParams.dataset, trait: keyParams.trait });
        this.$store.dispatch("kp4cd/getEglData", { dataset: keyParams.dataset, trait: keyParams.trait });
        this.$store.dispatch("effectorGenes/getDatasets", keyParams.trait);
        this.$store.dispatch("effectorGenes/getEffectorGenes", {
            trait: keyParams.trait,
            dataset: keyParams.dataset
        });
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
        showElement(ELEMENT) {
            uiUtils.showElement(ELEMENT);
        }
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
        eglData() {
            let contents = this.$store.state.kp4cd.eglData;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },


        eglConfig() {
            let contents = this.$store.state.kp4cd.eglConfig;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },

        datasets() {
            let contents = this.$store.state.effectorGenes.datasets;
            if (contents.length === 0) {
                return null;
            }
            return contents;
        },

        effectorGenesData() {
            let contents = this.$store.state.effectorGenes.effectorGenes;
            if (contents.length === 0) {
                return null;
            }
            return contents;
        },
        effectorGenesTable() {
            let contents = {
                richards: EffectorGenesRichards,
                manning: EffectorGenesMccarthy,
                mccarthy: EffectorGenesMccarthy
            };

            //return contents;
            return contents[keyParams.dataset];
        },
        effectorGenesGraph() {
            let contents = {
                richards: EffectorGenesGraphRichards
            };

            //return contents;
            return contents[keyParams.dataset];
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
