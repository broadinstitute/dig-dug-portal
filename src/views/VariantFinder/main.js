import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker";
import AssociationsTable from "@/components/AssociationsTable";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        AssociationsTable
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
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        "$store.state.associations.data": function(data) {
            this.$store.commit("setAssociation", data);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
