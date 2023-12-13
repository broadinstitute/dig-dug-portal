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
import GeneFinderTable from "@/portals/Neph/components/GeneFinderTable.vue";
import EnrichmentTable from "@/components/EnrichmentTable.vue";
import DatasetsTable from "@/components/DatasetsTable.vue";
import Documentation from "@/components/Documentation.vue";
import RawImage from "@/components/RawImage.vue";
import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";

import Formatters from "@/utils/formatters";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import CriterionListGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue"

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue"

import {SignIn,CheckSignInStatus} from "@/portals/Neph/components/LoginComponent.js";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        GeneFinderTable,
        AssociationsTable,
        EnrichmentTable,
        DatasetsTable,
        Documentation,
        RawImage,

        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterGreaterThan,
        FilterEnumeration,
        FilterEffectDirection,

        SearchHeaderWrapper
    },

    created() {
        this.CheckSignInStatus();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
        }
    },
    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        CheckSignInStatus,
        intFormatter: Formatters.intFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
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

        manhattanPlot() {
            let phenotype = this.$store.state.phenotype;

            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype.name}/manhattan.png`;
            }
        },

        qqPlot() {
            let phenotype = this.$store.state.phenotype;

            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype.name}/qq.png`;
            }
        }
    },

    watch: {
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let name = keyParams.phenotype;
            let phenotype = phenotypeMap[name];

            if (!!phenotype) {
                this.$store.commit("setPhenotype", phenotype);
                keyParams.set({ phenotype: phenotype.name });
            }
        },

        "$store.state.phenotype": function (phenotype) {
            this.$store.dispatch("queryPhenotype");
            uiUtils.hideElement("phenotypeSearchHolder");
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
