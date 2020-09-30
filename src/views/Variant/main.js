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
import ForestPlotHtml from "@/components/ForestPlotHtml.vue";
import keyParams from "@/utils/keyParams";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import FilterGroup from "@/components/Filter/FilterGroup.vue"
import FilterControl from "@/components/Filter/FilterControl.vue"
import FilterPValue from "@/components/Filter/FilterPValue.vue"
import FilterEffectDirection from "@/components/Filter/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue"

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

        ForestPlotHtml,

        FilterGroup,
        FilterControl,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,

    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("queryVariant", keyParams.variant);
    },

    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            phewasFilter: id => true,
            regionFilter: id => true,
        }
    },
    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        consequenceFormatter: Formatters.consequenceFormatter,
        consequenceMeaning: Formatters.consequenceMeaning,

        exploreRegion(expanded = 50000) {
            let pos = this.chromPos;

            if (!!pos) {
                window.location.href = `./region.html?chr=${pos.chromosome}&start=${pos.position - expanded}&end=${pos.position + expanded}&variant=${this.$store.state.variant.varId}`;
            }
        }
    },

    computed: {
        variantData() {
            return this.$store.state.variantData.data;
        },

        varId() {
            return this.$store.state.variant && this.$store.state.variant.varId;
        },

        dbSNP() {
            return this.$store.state.variant && this.$store.state.variant.dbSNP;
        },

        variantName() {
            return this.dbSNP || this.varId || '';
        },

        chromPos() {
            let variant = this.$store.state.variant;

            if (!!variant) {
                let chrom = variant.varId.split(':')[0];
                let pos = variant.varId.split(':')[1];

                return {
                    chromosome: chrom,
                    position: parseInt(pos),
                }
            }
        },

        documentationMap() {
            let varId = this.varId;
            let dbSNP = this.dbSNP;

            if (dbSNP) {
                return { variant: `${varId} / ${dbSNP}` };
            }

            return { variant: varId || '' };
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

        lzAssociations() {
            let phenotypes = this.$store.state.bioPortal.phenotypeMap;
            let associations = this.$store.state.phewas.data;

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

        regions() {
            return this.$store.state.regions.data;
        },
    },


    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        variantData(data) {
            if (!!data) {
                this.$store.commit('setVariant', data[0]);  // only ever 1 result
            }
        },

        "$store.state.variant"(variant) {
            if (variant) {
                let p = this.chromPos;

                this.$store.dispatch('phewas/query', { q: variant.varId });
                this.$store.dispatch('transcriptConsequences/query', { q: variant.varId });
                this.$store.dispatch('transcriptionFactors/query', { q: variant.varId });
                this.$store.dispatch('regions/query', { q: `${p.chromosome}:${p.position}` });
            }
        }
    }
}).$mount("#app");
