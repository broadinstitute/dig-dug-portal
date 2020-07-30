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
import ResearchMethod from "@/components/eglt/ResearchMethod.vue";
import EffectorGenesPlotsLine from "@/components/eglt/EffectorGenesPlotsLine.vue";
import EffectorGenesTable from "@/components/eglt/EffectorGenesTable.vue";
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
        EffectorGenesPlotsLine,
        EffectorGenesTable
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("kp4cd/getResearchMethod", keyParams.dataset);
        //this.$store.dispatch("effectorGenes/getDatasets", keyParams.trait); //for now, data from kp4cd
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
        dataset() {
            return keyParams.dataset;
        },
        trait() {
            return keyParams.trait;
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

        researchMethod() {
            let contents = this.$store.state.kp4cd.researchMethod;

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
        effectorGenesGraph() {
            let contents = {
                line: EffectorGenesPlotsLine
            };

            return contents[this.$store.state.plotsConfig["type"]];
        },
        pageTitle() {
            return this.$store.state.pageTitle;
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
