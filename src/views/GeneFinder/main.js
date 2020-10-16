import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import UniprotReferencesTable from "@/components/UniprotReferencesTable.vue";
import GeneAssociationsTable from "@/components/GeneAssociationsTable";
import GeneAssociationsMasks from "@/components/GeneAssociationsMasks";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import PhenotypePicker from "@/components/PhenotypePicker.vue";
import GeneFinderTable from "@/components/GeneFinderTable.vue";
import FilterGroup from "@/components/Filter/FilterGroup.vue"
import FilterControl from "@/components/Filter/FilterControl.vue"
import FilterPValue from "@/components/Filter/FilterPValue.vue"
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue"

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { ConcatSource } from "webpack-sources";

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
        GeneFinderTable,
        UnauthorizedMessage,
        FilterGroup,
        FilterControl,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
    },

    data() {
        return {
            counter: 0,
            geneFinderFilter: null,
            phenotypelist: [],
            geneFinderAssociations: {}
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

        getPhenotypeAssociatedGeneFinderData(event) {
            this.$store.commit("setPhenotype", event.name)
            this.$store.dispatch("queryGeneFinder");
        },
        updateGeneFinderData(event) {
            this.$store.commit("setSecondaryPhenotype", event.name)
            this.$store.dispatch("secondaryGeneFinder");
            this.$store.commit("setFilterBadges", true);
        },

        updatePhenotypeList(event) {
            console.log("he")
            let plist = this.$store.state.phenotypelist;
            plist = plist.filter(item => item != event.name)
            this.$store.commit("setPhenotypelist", plist)

        },
        removeFilter(index, obj) {
            this[obj].splice(index, 1);
        },



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

        combined() {
            let combined = []
            let phenotypes = this.$store.state.phenotypelist;
            let genes = this.$store.state.geneFinderAssociations;

            for (let i in phenotypes) {
                let phenotype = phenotypes[i]
                let data = genes[phenotype];
                combined = combined.concat(data);
            }
            return combined;

        },



        phenotypes() {
            let selectedPhenotypesList = []
            selectedPhenotypesList.push(this.$store.state.phenotype)
            if (!!this.$store.state.secondaryPhenotype) {
                selectedPhenotypesList.push(this.$store.state.secondaryPhenotype)
            }
            return selectedPhenotypesList;
        },

        secondaryPhenotypeOptions() {
            return this.$store.state.bioPortal.phenotypes.filter(x => x.name != this.$store.state.phenotype);
        },



    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }

    }
}).$mount("#app");
