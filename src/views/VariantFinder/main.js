import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker";
import AssociationsTable from "@/components/AssociationsTable";
import ManhattanPlot from "@/components/ManhattanPlot";
import VariantFinder from "@/components/VariantFinder";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import uiUtils from "@/utils/uiUtils";
import colorIndex from "@/utils/colors";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        AssociationsTable,
        ManhattanPlot,
        VariantFinder
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            select_pValue: "",
            select_pValue_text: "",
            select_consequence: [],
            select_gene: [],
            select_gene_text: "",
            select_beta: "",
            select_beta_options: [
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" }
            ]
        };
    },
    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        removePhenotype(p, i) {
            // console.log("p", p);
            // console.log("i", i);
            this.$store.dispatch("onPhenotypeRemove", {
                phenotype: p,
                index: i
            });
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

        colors() {
            let colors = {};
            let phenotypes = this.$store.state.selectedPhenotypes;

            for (let i in phenotypes) {
                colors[phenotypes[i].name] = colorIndex[i];
            }

            return colors;
        },
        filteredData() {
            let dataRows = this.$store.state.phenotypeAssociations;

            let consequenceFiltered =
                this.select_consequence.length > 0
                    ? Filters.filterFormatted(
                          dataRows,
                          this.select_consequence,
                          "consequence"
                      )
                    : dataRows;

            let geneFiltered =
                this.select_gene.length > 0
                    ? Filters.filterTable(
                          consequenceFiltered,
                          this.select_gene,
                          "gene"
                      )
                    : consequenceFiltered;

            let pValueFiltered =
                this.select_pValue != ""
                    ? Filters.filterPValue(
                          geneFiltered,
                          this.select_pValue,
                          "minP"
                      )
                    : geneFiltered;

            let betaFiltered = this.select_beta
                ? Filters.filterBeta(
                      pValueFiltered,
                      this.select_beta,
                      `${this.phenotypes[0].name}_beta`
                  )
                : pValueFiltered;

            return betaFiltered;
        }
    },
    watch: {
        // "$store.state.bioPortal.phenotypeMap": function(phenotypeMap) {
        //     let name = keyParams.phenotype;
        //     let phenotype = phenotypeMap[name];

        //     if (!!phenotype) {
        //         this.$store.commit("setPhenotype", phenotype);
        //         keyParams.set({ phenotype: phenotype.name });
        //     }
        // },

        "$store.state.newPhenotype": function(phenotype) {
            this.$store.dispatch("queryAssociation", phenotype);
            //uiUtils.hideElement("phenotypeSearchHolder");
        },

        // associationsByPhenotype: function(data) {
        //     this.$store.dispatch("mplotData", data);
        // },

        "$store.state.associations.data": function(data) {
            this.$store.commit("setAssociation", data);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
