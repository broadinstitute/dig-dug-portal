import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import UnauthorizedMessage from "@/components/UnauthorizedMessage";
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
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";
import sessionUtils from "@/utils/sessionUtils";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        PhenotypeSelectPicker,
        AncestrySelectPicker,
        ManhattanPlot,
        ClumpedAssociationsTable,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        CriterionListGroup,
        CriterionPills,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,
    },
    mixins: [pageMixin],
    data() {
        return {
            filterList: [],
            displayedFilterList: {},
        };
    },

    computed: {
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        // don't allow selection of the lead phenotype in dropdowns
        phenotypes() {
            return this.$store.state.phenotypes.map((p) => p.phenotype.name);
        },

        //return only the phenotypes that haven't been selected yet, guard against duplicate selections
        phenotypeList() {
            let all = this.$store.state.bioPortal.phenotypes;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                all = sessionUtils.getInSession(
                    all,
                    this.phenotypesInSession,
                    "name"
                );
            }

            const selected = this.$store.state.phenotypes;
            if (selected.length) {
                return all.filter((array) =>
                    selected.every(
                        (filter) => filter.phenotype.name !== array.name
                    )
                );
            } else {
                return all;
            }
        },

        clumpedAssociations() {
            let n = this.$store.state.phenotypes.length;
            let clumps = {};

            this.$store.state.phenotypes.forEach((p) => {
                p.associations.forEach((r) => {
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
            let clumped = Object.values(clumps).filter((rs) => rs.length == n);
            let flattened = [].concat.apply([], clumped);

            return flattened;
        },
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
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
            deep: true,
        },
        async "$store.state.ancestry"(ancestry) {
            let selectedPhenotypes = this.$store.state.phenotypes;
            this.$store.commit("removePhenotype", 0);
            if (selectedPhenotypes.length) {
                await this.$store.dispatch(
                    "fetchLeadPhenotypeAssociations",
                    selectedPhenotypes[0].phenotype
                );
                selectedPhenotypes
                    .slice(1)
                    .forEach((p) =>
                        this.$store.dispatch(
                            "fetchAssociationsMatrix",
                            p.phenotype
                        )
                    );
            }
        },
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
    },

    methods: {
        ...uiUtils,
        ancestryFormatter: Formatters.ancestryFormatter,
        ...sessionUtils,

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
                (el) =>
                    !(
                        el.field === filter.field &&
                        el.threshold === filter.threshold
                    )
            );
            return _filterList;
        },
        alignedBeta(row) {
            return row.beta * (row.alignment || 1);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
