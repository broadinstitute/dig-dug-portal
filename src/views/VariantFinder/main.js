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
        // For the manhattan plot, the associations need to be in a map like
        // so: { [phenotype]: [associations] }.
        associationsByPhenotype() {
            let assocs = {};

            if (this.colors !== undefined) {
                Object.keys(this.colors).forEach(key => {
                    //console.log(key + "_beta");
                    //console.log("data", this.$store.state.tableData);

                    this.$store.state.tableData.forEach(item => {
                        let check = key + "_pValue";

                        if (item.hasOwnProperty(check)) {
                            //assocs[key].push(item);
                            let line = {
                                pValue: item[check],
                                chromosome: item.chromosome,
                                position: item.position
                            };
                            if (!assocs[key]) {
                                assocs[key] = [line];
                            } else {
                                assocs[key].push(line);
                            }

                            //console.log("yes");
                        } else {
                            console.log("no");
                        }
                        //console.log(typeof item);
                    });
                });
            }

            return assocs;
        },
        colors() {
            let colors = {};
            let phenotypes = this.$store.state.selectedPhenotypes;

            for (let i in phenotypes) {
                colors[phenotypes[i].name] = colorIndex[i];
            }

            return colors;
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

        associationsByPhenotype: function(data) {
            this.$store.dispatch("mplotData", data);
            //uiUtils.hideElement("phenotypeSearchHolder");
        },

        "$store.state.associations.data": function(data) {
            this.$store.commit("setAssociation", data);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
