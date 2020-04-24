import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import AssociationsTable from "@/components/AssociationsTable.vue";
import EnrichmentTable from "@/components/EnrichmentTable.vue";
import DatasetsTable from "@/components/DatasetsTable.vue";
import keyParams from "@/utils/keyParams";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        AssociationsTable,
        EnrichmentTable,
        DatasetsTable,
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

        manhattanPlot() {
            let phenotype = this.$store.state.phenotype;

            if (!!phenotype) {
                return `https://dig-analysis-data.s3.amazonaws.com/out/metaanalysis/plots/${phenotype.name}/manhattan.png`;
            }
        },

        qqPlot() {
            let phenotype = this.$store.state.phenotype;

            if (!!phenotype) {
                return `https://dig-analysis-data.s3.amazonaws.com/out/metaanalysis/plots/${phenotype.name}/qq.png`;
            }
        }
    },

    watch: {
        '$store.state.bioPortal.phenotypeMap': function (phenotypeMap) {
            let name = keyParams.phenotype;
            let phenotype = phenotypeMap[name];

            if (!!phenotype) {
                this.$store.commit('setPhenotype', phenotype);
                keyParams.set({ phenotype: phenotype.name });
            }
        },

        '$store.state.phenotype': function (phenotype) {
            this.$store.dispatch('queryPhenotype');
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

}).$mount("#app");
