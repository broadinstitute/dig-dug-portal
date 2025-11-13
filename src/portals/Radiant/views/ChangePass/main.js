import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "@/components/DatasetSelectPicker.vue";
import NewsFeedSection from "@/components/frontPage/NewsFeedSection.vue";
import AboutPortalSection from "@/components/frontPage/AboutPortalSection.vue";
import AboutProjectSection from "@/components/frontPage/AboutProjectSection.vue";
import UnderDatasetsSection from "@/components/frontPage/UnderDatasetsSection.vue";
import DatasetsSection from "@/components/frontPage/DatasetsSection.vue";
import DiseaseGroupSelect from "@/components/DiseaseGroupSelect.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import Documentation from "@/components/Documentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";

import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import {ChangePass} from "@/portals/Radiant/components/LoginComponent.js";

new Vue({
    store,

    data(){
        return{
            input:{
                username: "",
                password: "",
                npassword: "",
                npassword2: "",
                errormessage: ""
            }
        }
      },
    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        NewsFeedSection,
        AboutPortalSection,
        AboutProjectSection,
        DatasetsSection,
        UnderDatasetsSection,
        DiseaseGroupSelect,
        TooltipDocumentation,
        Documentation,
        Autocomplete,
    },

    created() {
        console.log("created");
        //this.CheckSignInStatus();
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
        ChangePass
    },

    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        matchingGenes() {
            return this.$store.state.matchingGenes;
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        geneOrRegionOrVariant() {
            return this.$store.state.geneOrRegionOrVariant;
        },

        datasetsInfo() {
            let datasets = this.$store.state.kp4cd.datasetsInfo;

            if (datasets.length === 0) {
                return {};
            }
            return datasets[0];
        },
    },

    watch: {
        geneOrRegionOrVariant() {
            this.$store.commit("setInvalidGeneOrRegionOrVariant", false);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getNewsFeed", group.name);
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
        },
    }
}).$mount("#app");
