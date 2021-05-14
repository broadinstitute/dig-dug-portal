import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import regionUtils from "@/utils/regionUtils";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import { isEqual } from "lodash";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: { regionUtils },
    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        Documentation,
        GeneSelectPicker,
    },

    data() {
        return {
            region: null,
            chr: null,
            start: null,
            end: null,
            phenotype: null,
        };
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
        async onGeneChange(gene) {
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                this.chr = locus.chr;
                this.start = locus.start;
                this.end = locus.end;
            }
        },
        onPhenotypeChange(phenotype) {
            console.log(phenotype)
        }

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
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },

    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        phenotypes: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.setPhenotypeParams(newData);
                }
            },
            deep: true
        },
        region() {
            if (this.region.includes(":") && this.region.includes("-")) {
                this.chr = this.region.split(":")[0];
                this.start = this.region.split(":")[1].split("-")[0];
                this.end = this.region.split(":")[1].split("-")[1];
            }
        }
    }
}).$mount("#app");
