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
import keyParams from "@/utils/keyParams";

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

        // topVariants() {
        //     return this.$store.state.associations.data.slice(0, 200);
        // },

        // selectedPhenotype() {
        //     let name = this.$store.state.phenotypeName;

        //     // lookup the phenotype object from the bio portal once downloaded
        //     return this.$store.state.bioPortal.phenotypeMap[name];
        // },

        selectedVariant() {
            let variantID = this.$store.state.variantID;
        },
        transcriptConsequence() {
            let variantData = this.$store.state.variant.data
            let transcriptConsequence = variantData.transcriptConsequence
            //this is incomplete since you might have to transform the data - create a map for desired tabular format
            return transcriptConsequence
        }

    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        // selectedPhenotype(phenotype) {
        //     this.$store.dispatch("associations/query", { q: phenotype.name, limit: 2000 });
        // },
        selectedVariant(variantID) {
            //this should dispatch this function whenever there is change in variant ID
            this.$store.dispatch("api/bio/query/variant", { q: variantID, limit: 2000 });
        },
    },

}).$mount("#app");
