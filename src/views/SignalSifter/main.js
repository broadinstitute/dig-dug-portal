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
import AncestrySelectPicker from "@/components/AncestrySelectPicker.vue";
import ClumpedAssociationsTable from "@/components/ClumpedAssociationsTable.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import CriterionPills from "@/components/criterion/template/CriterionPills";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import { isEqual } from "lodash";
import Colors from "@/utils/colors";
import keyParams from "@/utils/keyParams";

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
        AncestrySelectPicker,
        Documentation,
        ManhattanPlot,
        ClumpedAssociationsTable,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        CriterionListGroup,
        CriterionPills,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan
    },

    data() {
        return {
            filterList: [],
            displayedFilterList: {}
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
            this.$store.commit("removePhenotype", index);
        },

        phenotypeColor(index) {
            return Colors[index];
        },
        setPhenotypeParams(phenotypes) {
            // keyParams.set({
            //     phenotypes: phenotypes.length ? phenotypes.join(",") : []
            // });
            //console.log(Object.entries(this.displayedFilterList));
            //console.log("set", phenotypes);
        },
        unsetFilter(filterList, filter) {
            if (!filterList) return {};

            const _filterList = filterList.filter(
                el =>
                    !(
                        el.field === filter.field &&
                        el.threshold === filter.threshold
                    )
            );
            return _filterList;
        },
        alignedBeta(row) {
            return row.beta * (row.alignment || 1);
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
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        // don't allow selection of the lead phenotype in dropdowns
        phenotypes() {
            return this.$store.state.phenotypes.map(p => p.phenotype.name);
        },

        //return only the phenotypes that haven't been selected yet, guard against duplicate selections
        phenotypeList() {
            const all = this.$store.state.bioPortal.phenotypes;
            const selected = this.$store.state.phenotypes;
            if (selected.length) {
                return all.filter(array =>
                    selected.every(
                        filter => filter.phenotype.name !== array.name
                    )
                );
            } else {
                return all;
            }
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
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        phenotypes: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.setPhenotypeParams(newData);
                }
            },
            deep: true
        },
        async "$store.state.ancestry"(ancestry) {
            let selectedPhenotypes = this.$store.state.phenotypes;
            this.$store.commit("removePhenotype", 0);
            if (selectedPhenotypes.length){
                await this.$store.dispatch("fetchLeadPhenotypeAssociations", selectedPhenotypes[0].phenotype);
                selectedPhenotypes.slice(1).forEach(p => 
                    this.$store.dispatch("fetchAssociationsMatrix", p.phenotype)
                );
            }
        }
    }
}).$mount("#app");
