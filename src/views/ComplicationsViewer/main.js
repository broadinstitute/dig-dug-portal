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
import GeneFinderTable from "@/components/GeneFinderTable.vue";
import FilterGroup from "@/components/Filter/FilterGroup.vue"
import FilterListGroup from "@/components/Filter/FilterListGroup.vue"
import FilterControl from "@/components/Filter/FilterControl.vue"
import FilterPValue from "@/components/Filter/FilterPValue.vue"
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue"
import RawImage from "@/components/RawImage.vue";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { query } from "@/utils/bioIndexUtils";
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
        GeneFinderTable,
        UnauthorizedMessage,
        FilterGroup,
        FilterListGroup,
        FilterControl,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        RawImage,
    },

    data() {
        return {
            counter: 0,
            phenotypelist: [],
            complicationsViewerSearchCriterion: [],
            geneFinderAssociationsMap: {},
        };
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getComplications");
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

        updateAssociations(updatedPhenotypes, pValue, flush) {
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let promises = updatedPhenotypes.map(phenotype => {
                if (!!!this.geneFinderAssociationsMap[phenotype] || flush) {
                    let alertId = postAlertNotice(`Loading ${phenotypeMap[phenotype].description} gene associations...`);
                    return query(`gene-finder`, phenotype, { limitWhile: record => record.pValue < pValue })
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
            selectedPhenotypesList = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'complication').map(criterion => criterion.threshold);
            return selectedPhenotypesList;
        },

        manhattanPlot() {
            let search = this.complicationViewerPhenotypes;
            let phenotype = search[0];
            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype}/manhattan.png`;
            }
        },

        manhattanPlot2() {
            let search = this.complicationViewerPhenotypes;
            let phenotype = search[1];
            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype}/manhattan.png`;
            }
        },
        qqPlot() {
            // let search = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'secondaryPhenotype').map(criterion => criterion.threshold);
            let search = this.complicationViewerPhenotypes;
            let phenotype = search[0];

            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype}/qq.png`;
            }
        },
        qqPlot2() {
            let search = this.complicationViewerPhenotypes;
            let phenotype = search[1];

            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype}/qq.png`;
            }
        },

        complicationPhenotypeOptions() {
            let x = this.$store.state.bioPortal.complications.filter(x => x.name != this.$store.state.phenotype);
            return x;
        },

        //find the selected comlication based on selected criterion
        //then get the phenotypes for the selected complication.
        //display all the keys
        complicationSecondaryPhenotypeOptions() {
            let selectedComplication = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'complication').map(criterion => criterion.threshold)[0];
            if (!!selectedComplication) {
                let phenotypes = Object.keys(this.$store.state.bioPortal.complicationsMap[selectedComplication].phenotypes);
                return phenotypes
            }

        },

        complicationViewerPhenotypes() {
            let complicationPhenotype = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'complication').map(criterion => criterion.threshold);
            let secondaryPhenotype = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'secondaryPhenotype').map(criterion => criterion.threshold);
            let realSecondaryPhenotype = []
            if (secondaryPhenotype.length > 0) {
                let complication = this.$store.state.bioPortal.complicationsMap[complicationPhenotype].phenotypes[secondaryPhenotype]
                let x = secondaryPhenotype.concat(complication)
                return x;
            }
            if (secondaryPhenotype.length == 0) {
                return []
            }

        },
        complicationsViewerPhenotype() {
            return this.complicationViewerPhenotypes[0]
        },
        combined() {
            return Object.entries(this.geneFinderAssociationsMap).flatMap(geneFinderItem => geneFinderItem[1]);
        },
        geneFinderPValue() {
            let pval = 0.05
            for (let i in this.complicationsViewerSearchCriterion) {
                if (this.complicationsViewerSearchCriterion[i].field == 'pValue') {
                    pval = Number(this.complicationsViewerSearchCriterion[i].threshold)
                }
            }
            return pval;
        },
        criterion() {
            return {
                pValue: this.geneFinderPValue,
                phenotypes: this.complicationViewerPhenotypes,
            }
        },

        documentationMap() {
            let complication = this.complicationViewerPhenotypes[0];
            let phenotype = this.complicationViewerPhenotypes[1];
            return {
                phenotype: phenotype,
                complication: complication
            };
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
                this.updateAssociations(this.complicationViewerPhenotypes, this.geneFinderPValue, true);
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
