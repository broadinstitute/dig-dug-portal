import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import ClumpedAssociationsTable from "@/components/ClumpedAssociationsTable.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue"
import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"

import Colors from "@/utils/colors";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        Documentation,
        ManhattanPlot,
        ClumpedAssociationsTable,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,
    },

    data() {
        return {
        };
    },

    created() {
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

        removePhenotype(index) {
            this.$store.commit('removePhenotype', index);
        },

        phenotypeColor(index) {
            return Colors[index];
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

        // don't allow selection of the lead phenotype in dropdowns
        phenotypes() {
            return this.$store.state.phenotypes.map(p => p.phenotype.name);
        },

        clumpedAssociations() {
            let n = this.$store.state.phenotypes.length;
            let clumps = {};

            this.$store.state.phenotypes.forEach(p => {
                p.associations.forEach(r => {
                    if (p.filter(r)) {
                        if (r.clump in clumps) {
                            clumps[r.clump].push(r);
                        } else {
                            clumps[r.clump] = [r];
                        }
                    }
                });
            });

            // drop all clumps that do not contain all phenotypes
            let clumped = Object.values(clumps).filter(rs => rs.length == n);
            let flattened = [].concat.apply([], clumped);

            return flattened;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    }
}).$mount("#app");
