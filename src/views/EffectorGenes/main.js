import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import $ from "jquery";
import _ from "lodash";
import PortalVue from "portal-vue";
import egInfo from "@/utils/effectorGenes.js";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

Vue.use(PortalVue);

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter
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
        //this.selectedPhenotype = "t2d";
        this.$store.commit("setSelectedPhenotype", "t2d");
    },
    computed: {},
    methods: {
        toggleCol(column) {
            return !column.checked;
        }
    },
    watch: {
        selectedPhenotype(value) {
            this.$store.dispatch("onPhenotypeChange", value);
        }
    }
}).$mount("#app");
