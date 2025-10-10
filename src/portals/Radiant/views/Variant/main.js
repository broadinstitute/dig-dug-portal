import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import TranscriptConsequenceTable from "@/portals/Radiant/components/TranscriptConsequenceTable.vue";
import VariantPhenotypeTable from "@/portals/Radiant/components/VariantPhenotypeTable.vue";
import GnomInfoCard from "@/portals/Radiant/components/GnomInfoCard.vue";

import IGVComponent from "@/portals/Radiant/components/IGVComponent.vue";

import GenotypeQualityMetricsTabs from "@/portals/Radiant/components/GenotypeQualityMetricsTabs.vue";
import AllGenoQualityMetricsTabs from "@/portals/Radiant/components/AllGenoQualityMetricsTabs.vue";
import SiteQualityMetricsTabs from "@/portals/Radiant/components/SiteQualityMetricsTabs.vue";

import TranscriptionFactorsTable from "@/components/TranscriptionFactorsTable.vue";
import PheWASTable from "@/components/PheWASTable.vue";
import RegionsTable from "@/components/RegionsTable.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";
import ForestPlotHtml from "@/components/ForestPlotHtml.vue";
import DatasetAssociations from "@/components/DatasetAssociations";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import PheWASDatasets from "@/components/PheWASDatasets";
import keyParams from "@/utils/keyParams";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";

import {SignIn,CheckSignInStatus} from "@/portals/Radiant/components/LoginComponent.js";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        TranscriptConsequenceTable,
        VariantPhenotypeTable,
        GnomInfoCard,
        TranscriptionFactorsTable,
        PheWASTable,
        PheWASDatasets,
        RegionsTable,
        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomPhewasPanel,
        ForestPlotHtml,
        DatasetAssociations,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,

        SearchHeaderWrapper,
        GenotypeQualityMetricsTabs,
        AllGenoQualityMetricsTabs,
        SiteQualityMetricsTabs,

        IGVComponent,
    },

    computed: {
        variantData() {
            return this.$store.state.variantData.data;
        },

        varId() {
            return this.$store.state.pageVariant &&
                this.$store.state.pageVariant.varId
                ? this.$store.state.pageVariant.varId
                : "";
        },

        dbSNP() {
            return this.$store.state.pageVariant &&
                this.$store.state.pageVariant.dbSNP
                ? this.$store.state.pageVariant.dbSNP
                : "";
        },

        variantName() {
            return this.dbSNP || this.varId || "";
        },

        chromPos() {
            let variant = this.$store.state.variant;

            if (!!variant) {
                let chrom = variant.varId.split(":")[0];
                let pos = variant.varId.split(":")[1];

                return {
                    chromosome: chrom,
                    position: parseInt(pos),
                };
            } else {
                return {};
            }
        },

        documentationMap() {
            let varId = this.varId;
            let dbSNP = this.dbSNP;

            if (dbSNP) {
                return { variant: `${varId} / ${dbSNP}` };
            }

            return { variant: varId || "" };
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
            let portalAssociations = associations.filter((a) => {
                return !!phenotypes[a.phenotype];
            });

            // transform from bio index to locuszoom
            let phewas = portalAssociations.map((a) => {
                let phenotype = phenotypes[a.phenotype];

                return {
                    id: phenotype.name,
                    log_pvalue: -Math.log10(a.pValue),
                    trait_group: phenotype.group,
                    trait_label: phenotype.description,
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

        // variantData(data) {
        //     //! data is an array
        //     if (data.length > 0) {
        //         this.$store.commit("setVariant", data[0]); // only ever 1 result
        //     }
        // },

        // "$store.state.variant"(variant) {
        //     if (variant) {
        //         let p = this.chromPos;

        //         this.$store.dispatch("phewas/query", { q: variant.varId });
        //         this.$store.dispatch("transcriptConsequences/query", {
        //             q: variant.varId,
        //         });
        //         this.$store.dispatch("transcriptionFactors/query", {
        //             q: variant.varId,
        //         });
        //         this.$store.dispatch("regions/query", {
        //             q: `${p.chromosome}:${p.position}`,
        //         });
        //         this.$store.dispatch("datasetAssociations/query", {
        //             q: variant.varId,
        //         });
        //     }
        // },
    },

    created() {
        this.CheckSignInStatus();
        if (keyParams.variant) {
            this.$store.dispatch("bioPortal/getDiseaseGroups");
            this.$store.dispatch("bioPortal/getPhenotypes");
            this.$store.dispatch("queryVariant", keyParams.variant);
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
        CheckSignInStatus,

        exploreRegion(expanded = 50000) {
            let pos = this.chromPos;

            if (!!pos) {
                window.location.href = `./region.html?chr=${
                    pos.chromosome
                }&start=${pos.position - expanded}&end=${
                    pos.position + expanded
                }&variant=${this.$store.state.variant.varId}`;
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
