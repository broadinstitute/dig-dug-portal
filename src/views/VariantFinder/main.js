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
import PhenotypePicker from "@/components/PhenotypePicker.vue";
import ClumpedAssociationsTable from "@/components/ClumpedAssociationsTable.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue"
import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import { difference } from "lodash"

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
        PhenotypePicker,
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
            variantFinderSearchCriterion: [],
            variantFinderFilter: function (id) { return true; },
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

        updateAssociations(phenotypes, phenotypesToAdd) {
            let existing = difference(phenotypes, phenotypesToAdd);

            // this will delete old associations no longer being referenced
            this.$store.commit('setPhenotypes', existing);

            // fetch all the data as needed
            for (let i in phenotypesToAdd) {
                this.$store.dispatch('fetchAssociationsMatrix', phenotypesToAdd[i]);
            }
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
        phenotypes() {
            return this.variantFinderSearchCriterion.slice(1);
        },

        // don't allow selection of the lead phenotype in dropdowns
        leadPhenotypeOptions() {
            return this.$store.state.bioPortal.phenotypes.filter(x => x.name != this.$store.state.leadPhenotype);
        },
        secondaryPhenotypeOptions() {
            return this.$store.state.bioPortal.phenotypes.filter(x => x.name != this.$store.state.leadPhenotype);
        },

        filteredAssociations() {
            let data = this.$store.state.associations;
            let phenotypes = this.$store.state.phenotypes;
            let clumps = {};

            if (!!this.variantFinderFilter) {
                data = data.filter(this.variantFinderFilter);
            }

            data.forEach(r => {
                if (!clumps[r.clump]) {
                    clumps[r.clump] = [];
                }
                clumps[r.clump].push(r.phenotype);
            })

            // remove rows that don't have all phenotypes across the clump
            return data.filter(r => clumps[r.clump].length == phenotypes.length);
        },

        criterion() {
            let phenotypes = this.variantFinderSearchCriterion
                .filter(criterion => criterion.field === 'phenotype')
                .map(criterion => criterion.threshold);

            return { phenotypes };
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        criterion(newCriterion, oldCriterion) {
            let phenotypes = newCriterion.phenotypes;
            let lead = phenotypes[0];

            // if the lead phenotype changed, start over
            if (lead !== this.$store.getters.leadPhenotype) {
                this.$store.dispatch('fetchLeadPhenotypeAssociations', lead);
            } else {
                const phenotypesToAdd = difference(phenotypes, oldCriterion.phenotypes);
                this.updateAssociations(phenotypes, phenotypesToAdd);
            }
        }
    }
}).$mount("#app");
