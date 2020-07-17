import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import TranscriptConsequenceTable from "@/components/TranscriptConsequenceTable.vue";
import TranscriptionFactorsTable from "@/components/TranscriptionFactorsTable.vue";
import PheWASTable from "@/components/PheWASTable.vue";
import RegionsTable from "@/components/RegionsTable.vue";

import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";

import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        TranscriptConsequenceTable,
        TranscriptionFactorsTable,
        PheWASTable,
        RegionsTable,

        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomPhewasPanel,
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
    },

    computed: {
        documentationMap() {
            let map = {};

            if (this.variantData) {
                let varId = this.variantData.varId;
                let dbSNP = this.variantData.dbSNP;

                if (dbSNP) {
                    map['variant'] = `${varId} / ${dbSNP}`
                } else {
                    map['variant'] = varId;
                }
            }

            return map;
        },
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

        variantData() {
            let data = this.$store.state.variant.data;

            // there should only be one variant returned
            if (data.length > 0) {
                this.hideElement('variantSearchHolder');

                return data[0];
            }
        },

        variantName() {
            let data = this.variantData;

            if (!!data && data.dbSNP) {
                return data.dbSNP;
            }

            return this.$store.state.variantID;
        },

        lzAssociations() {
            let phenotypes = this.$store.state.bioPortal.phenotypeMap;
            let associations = this.variantData.associations;

            // filter associations w/ no phenotype data (not in portal!)
            let portalAssociations = associations.filter(a => {
                return !!phenotypes[a.phenotype];
            });

            // transform from bio index to locuszoom
            let phewas = portalAssociations.map(a => {
                let phenotype = phenotypes[a.phenotype];

                return {
                    id: phenotype.name,
                    log_pvalue: -Math.log10(a.pValue),
                    trait_group: phenotype.group,
                    trait_label: phenotype.description
                };
            });

            return phewas;
        },

        consequence() {
            if (!!this.variantData) {
                return Formatters.consequenceFormatter(
                    this.variantData.consequence
                );
            }
        },

        consequenceMeaning() {
            if (!!this.variantData) {
                return Formatters.consequenceMeaning(
                    this.variantData.consequence
                );
            }
        },

        regions() {
            return this.$store.state.regions.data;
        }
    },


    watch: {
        "$store.state.bioPortal.phenotypes": function (phenotypes) {
            this.$store.dispatch("queryVariant");
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        variantData(data) {
            if (!!data) {
                this.$store.dispatch('queryRegions', data);
            }
        }
    }
}).$mount("#app");
