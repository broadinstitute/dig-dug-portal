import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import MplotVariantsTable from "@/components/MplotVariantsTable.vue";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        ManhattanPlot,
        MplotVariantsTable
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");

        // load all the initial phenotype associations
        this.$store.dispatch("loadAssociations");
    },

    render(createElement, context) {
        return createElement(Template);
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
            return this.$store.getters['bioPortal/diseaseGroup'];
        },

        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },

        topVariants() {
            let data = this.$store.getters.associations;
            let variants = [];

            for (let phenotype in data) {
                variants = variants.concat(data[phenotype]);
            }

            // sort all the variants by pValue
            variants.sort((a, b) => a.pValue - b.pValue);

            // return the top 100
            return variants.slice(0, 100);
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

}).$mount("#app");
