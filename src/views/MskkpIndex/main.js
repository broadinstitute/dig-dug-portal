import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import MskkpLandingHeroBanner from "@/components/mskkpLanding/HeroBanner.vue";
import MskkpLandingMetrics from "@/components/mskkpLanding/Metrics.vue";
import MskkpLandingMain from "@/components/mskkpLanding/Main.vue";
import MskkpLandingFeatures from "@/components/mskkpLanding/Features.vue";
import MskkpLandingCommunity from "@/components/mskkpLanding/Community.vue";
import MskkpLandingSupport from "@/components/mskkpLanding/Support.vue";
import MskkpLandingFooter from "@/components/mskkpLanding/Footer.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

new Vue({
    store,

    components: {
        Alert,
        PageHeader,
        MskkpLandingHeroBanner,
        MskkpLandingMetrics,
        MskkpLandingMain,
        MskkpLandingFeatures,
        MskkpLandingCommunity,
        MskkpLandingSupport,
        MskkpLandingFooter,
    },

    data: {
        stats: [],
        statsKeys: [
            {
                icon: "phenotypes",
                label: "Phenotypes",
                href: "/r/kp_phenotypes",
            },
            {
                icon: "genetic_datasets",
                label: "Genetic datasets",
                href: "/datasets.html",
            },
            {
                icon: "genomic_datasets",
                label: "Genomic datasets",
                href: "/r/cmdga_205",
            },
            {
                icon: "bioinfomatics_methods",
                label: "Bioinformatic methods",
                href: "/method.html",
            },
            {
                icon: "curated_datasets",
                label: "Curated datasets",
                href: "/downloads.html",
            },
        ],
    },

    computed: {
        utilsBox() {
            return {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
                regionUtils: regionUtils,
            };
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        pageStats() {
            return (
                this.stats.find((s) => s["Portal ID"] == "msk") || {}
            );
        },
        statsArray() {
            return this.statsKeys.map((stat) => ({
                ...stat,
                value: this.pageStats[stat.label],
                display: this.capitalize(stat.label),
            }));
        },
    },

    watch: {
        diseaseGroup() {
            this.$store.dispatch("kp4cd/getNewsFeed", "msk");
            this.$store.dispatch("kp4cd/getFrontContents", "msk");
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDocumentations");
        this.$store.dispatch("kp4cd/getNewsFeed", "msk");
        this.$store.dispatch("kp4cd/getFrontContents", "msk");
        this.getStats();
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        async getStats() {
            let dataPoint =
                "https://hugeampkpncms.org/rest/directcsv?id=Portal_stats_501";

            let contJson = await fetch(dataPoint).then((resp) => resp.json());

            if (contJson.error == null) {
                let data = dataConvert.csv2Json(
                    contJson[0]["field_data_points"]
                );
                this.stats = data;
            }
        },
        capitalize(str) {
            return str.replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
