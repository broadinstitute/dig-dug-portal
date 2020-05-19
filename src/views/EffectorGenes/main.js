import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import $ from "jquery";
import _ from "lodash";
import PortalVue from "portal-vue";
import egInfo from "@/utils/effectorGenes.js";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
Vue.use(PortalVue);

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert
    },
    data() {
        return {
            listPheno: egInfo.phenotypes,
            listChrom: egInfo.chromosomes,
            listCol: egInfo.dataColumns,
            selectedPhenotype: "t2d",
            isHidden: true,

            searchProb: "",
            searchChrom: "",
            searchRegStart: "",
            searchRegEnd: ""
        };
    },

    render(createElement, context) {
        return createElement(Template);
    },
    created() {
        this.$store.dispatch("effectorGenes/getGeneData", "t2d");
        this.$store.dispatch("effectorGenes/getTop20Data", "t2d");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        //this.selectedPhenotype = "t2d";
        this.$store.commit("setSelectedPhenotype", "t2d");
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
        }
    },
    methods: {
        toggleCol(column) {
            return !column.checked;
        },
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert
    },
    watch: {
        selectedPhenotype(value) {
            this.$store.dispatch("onPhenotypeChange", value);
        }
    }
}).$mount("#app");
