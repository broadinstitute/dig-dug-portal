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
//import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import GeneFinderTable from "@/portals/Neph/components/GeneFinderTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue"
import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { query } from "@/utils/bioIndexUtils";
import { difference } from "lodash"

import {SignIn,CheckSignInStatus} from "@/portals/Neph/components/LoginComponent.js";

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
        //PhenotypeSelectPicker,
        Documentation,
        GeneFinderTable,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
    },

    data() {
        return {
            counter: 0,
            phenotypelist: [],
            geneFinderSearchCriterion: [],
            geneFinderAssociationsMap: {},
        };
    },

    created() {
        this.CheckSignInStatus();

        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        //this.$store.dispatch("phenotypes/query", query,{query_private:true});
        //console.log(this.$store.phenotype);
        //console.log(this.$store.phenotypes);
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
        CheckSignInStatus,
        updateAssociations(updatedPhenotypes, pValue, flush) {
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let promises = updatedPhenotypes.map(phenotype => {
                if (!!!this.geneFinderAssociationsMap[phenotype] || flush) {
                    let alertId = postAlertNotice(`Loading ${phenotypeMap[phenotype].description} gene associations...`);
                    return query(`gene-finder`, phenotype, {limitWhile: record => record.pValue < pValue }, true)
                        .then(bioIndexData => {
                            closeAlert(alertId);
                            Vue.set(this.geneFinderAssociationsMap, phenotype, bioIndexData);
                        })
                } else {
                    return Promise.resolve();
                }
            });

            // may await on this in the future if needed...
            Promise.all(promises);
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
            let selectedPhenotypesList = []
            selectedPhenotypesList = this.geneFinderSearchCriterion.filter(criterion => criterion.field === 'phenotype').map(criterion => criterion.threshold);
            return selectedPhenotypesList;
        },

        secondaryPhenotypeOptions() {
            //console.log(this.$store.state.bioPortal.phenotypes);
            //console.log(this.$store.state.phenotypes_hg38);
            return this.$store.state.bioPortal.phenotypes.filter(x => x.group == 'NEPHBCH' && this.$store.state.phenotypes_hg38.indexOf(x.name) > 0 && x.name != this.$store.state.phenotype);
            //return this.$store.state.bioPortal.phenotypes.filter(x => x.group == 'NEPHBCH' && x.name != this.$store.state.phenotype);
        },

        geneFinderPhenotypes() {
            return this.geneFinderSearchCriterion.filter(criterion => criterion.field === 'phenotype').map(criterion => criterion.threshold);
        },
        geneFinderPhenotype() {
            return this.geneFinderPhenotypes[0]
        },
        combined() {
            return Object.entries(this.geneFinderAssociationsMap).flatMap(geneFinderItem => geneFinderItem[1]);
        },
        geneFinderPValue() {
            let pval = 0.05
            for (let i in this.geneFinderSearchCriterion) {
                if (this.geneFinderSearchCriterion[i].field == 'pValue') {
                    pval = Number(this.geneFinderSearchCriterion[i].threshold)
                }
            }
            return pval;
        },
        criterion() {
            return {
                pValue: this.geneFinderPValue,
                phenotypes: this.geneFinderPhenotypes,
            }
        },
        phenotypeList2() {
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
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        criterion(newCriterion, oldCriterion) {
            if (newCriterion.pValue !== oldCriterion.pValue) {
                // if the pValue updates, all phenotype associations must be updated to reflect the new bound
                // this will override all data in the geneFinderAssociationsMap
                this.updateAssociations(this.geneFinderPhenotypes, this.geneFinderPValue, true);
            } else {
                // if the phenotypes update, we only need to get new data based on latest phenotype
                // NOTE: this will maintain some data in the the geneFinderAssociationsMap
                const updatingPhenotypes = difference(newCriterion.phenotypes, oldCriterion.phenotypes);
                if (updatingPhenotypes.length > 0) {
                    this.updateAssociations(updatingPhenotypes, this.geneFinderPValue);
                }
            }
        }
    }
}).$mount("#app");
