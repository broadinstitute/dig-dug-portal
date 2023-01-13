import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PateintDiagnosisCard from "@/portals/Neph/components/PatientDiagnosis.vue";
import PateintAdminMedicineCard from "@/portals/Neph/components/PatientAdminMedicine.vue";
import PateintHomeMedicineCard from "@/portals/Neph/components/PatientHomeMedicine.vue";
import PateintLaboratoryCard from "@/portals/Neph/components/PatientLaboratory.vue";
import PateintVitalCard from "@/portals/Neph/components/PatientVital.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";
import ForestPlotHtml from "@/components/ForestPlotHtml.vue";
import DatasetAssociations from "@/components/DatasetAssociations";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import keyParams from "@/utils/keyParams";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue"
import {SignIn,CheckSignInStatus} from "@/portals/Neph/components/LoginComponent.js";
new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
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
        PateintDiagnosisCard,
        PateintAdminMedicineCard,
        PateintHomeMedicineCard,
        PateintLaboratoryCard,
        PateintVitalCard,
        SearchHeaderWrapper,

    },

    created() {
        this.CheckSignInStatus();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        /*if(keyParams.patient){
            this.$store.dispatch("queryPatient", keyParams.patient);
        } */
        
        //alert(store.state.variant.nearest);
        //alert("5");
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
        consequenceFormatter: Formatters.consequenceFormatter,
        consequenceMeaning: Formatters.consequenceMeaning,

        exploreRegion(expanded = 50000) {
            let pos = this.chromPos;

            if (!!pos) {
                window.location.href = `./region.html?chr=${pos.chromosome
                    }&start=${pos.position - expanded}&end=${pos.position +
                    expanded}&variant=${this.$store.state.variant.varId}`;
            }
        }
    },

    computed: {
        variantData() {
            return this.$store.state.variantData.data;
        },

        varId() {
            /*if (this.$store.state.variant){
                console.log(JSON.stringify(this.$store.state.variant));
            }*/
            if (this.$store.state.patient){
                return this.$store.state.patient;
            } else {
                this.$store.state.patient = keyParams.patient;
                return keyParams.patient;
            }
            
        },

        dbSNP() {
            return this.$store.state.variant && this.$store.state.variant.dbSNP;
        },

        variantName() {
            return this.varId || this.dbSNP || "";
        },

        chromPos() {
            let variant = this.$store.state.variant;

            if (!!variant) {
                let chrom = variant.varId.split(":")[0];
                let pos = variant.varId.split(":")[1];

                return {
                    chromosome: chrom,
                    position: parseInt(pos)
                };
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
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        patientData(data) {
            //! data is an array
            if (data.length > 0) {
                this.$store.commit("setPatient", data[0]); // only ever 1 result
            }
        },

        /*"$store.state.patient"(patient) {
            //alert("watch:"+patient);
            if (patient) {
                //console.log(variant);
                let p = this.chromPos;

                this.$store.dispatch("patientDiagnosis/query", { q: patient });
                
            }
        } */
    }
}).$mount("#app");
