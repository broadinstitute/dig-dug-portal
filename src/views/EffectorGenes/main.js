import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ResearchMethod from "@/components/ResearchMethod.vue";
import EffectorGenesRichards from "@/components/EffectorGenesRichards.vue";
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
        EffectorGenesManning,
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
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
                'richards': EffectorGenesRichards,
                "manning": EffectorGenesManning,
                "mccarthy": EffectorGenesMccarthy,
            };

            //let datasetName = 'EffectorGenes' + keyParams.dataset[0].toUpperCase() + keyParams.dataset.substr(1);
            //contents = eval(datasetName);

            //return contents;
            return contents[keyParams.dataset];
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getResearchMethod", keyParams.dataset);
            this.$store.dispatch("effectorGenes/getDatasets", keyParams.trait);
            this.$store.dispatch("effectorGenes/getEffectorGenes", { "trait": keyParams.trait, "dataset": keyParams.dataset });
        },

    }
}).$mount("#app");
