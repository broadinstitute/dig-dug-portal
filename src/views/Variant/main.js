import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import TranscriptConsequenceTable from "@/components/TranscriptConsequenceTable.vue";
import TranscriptionFactorsTable from "@/components/TranscriptionFactorsTable.vue";
import PheWASTable from "@/components/PheWASTable.vue";
//import RegionsTable from "@/components/RegionsTable.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";
import ForestPlotHtml from "@/components/ForestPlotHtml.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
//import DatasetAssociations from "@/components/DatasetAssociations";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import PheWASDatasets from "@/components/PheWASDatasets";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

import sessionUtils from "@/utils/sessionUtils";

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
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        AncestrySelectPicker,
        TranscriptConsequenceTable,
        TranscriptionFactorsTable,
        PheWASTable,
        PheWASDatasets,
        //RegionsTable,
        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomPhewasPanel,
        ForestPlotHtml,
        ResearchPheWAS,
        //DatasetAssociations,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,

        SearchHeaderWrapper,
        ResearchSingleSearch,
    },

    computed: {
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
                regionUtils: regionUtils,
            };
            return utils;
        },
        /// for disease systems
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

        pheWasData() {
            let data = !this.$store.state.ancestry
                ? this.$store.state.phewas.data
                : this.$store.state.ancestryPhewas.data;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            return data;
        },
        variantData() {
            return this.$store.state.variantData?.data?.length
                ? this.$store.state.variantData.data[0]
                : {};
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
            let variant = this.$store.state.pageVariant;

            if (variant) {
                let chrom = variant.varId.split(":")[0];
                let pos = variant.varId.split(":")[1];

                return {
                    chromosome: chrom,
                    position: parseInt(pos),
                };
            } else {
                return {
                    chromosome: "",
                    position: null,
                };
            }
        },

        docDetails() {
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

        /*regions() {
            return this.$store.state.regions.data;
        }*/
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
    },

    created() {
        if (keyParams.variant) {
            /// disease systems
            this.$store.dispatch("bioPortal/getDiseaseSystems");
            this.$store.dispatch("bioPortal/getDiseaseGroups");
            this.$store.dispatch("bioPortal/getPhenotypes");
            this.$store.dispatch("bioPortal/getDatasets");
            this.$store.dispatch("queryVariant", keyParams.variant);
        }
    },

    methods: {
        ...uiUtils,
        ...sessionUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        ancestryFormatter: Formatters.ancestryFormatter,
        consequenceFormatter: Formatters.consequenceFormatter,
        consequenceMeaning: Formatters.consequenceMeaning,

        exploreRegion(expanded = 50000) {
            let pos = this.chromPos;

            if (pos) {
                window.location.href = `./region.html?chr=${
                    pos.chromosome
                }&start=${pos.position - expanded}&end=${
                    pos.position + expanded
                }&variant=${this.$store.state.pageVariant.varId}`;
            }
        },
        clearBadSearch() {
            this.$store.state.badSearch = false;
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
