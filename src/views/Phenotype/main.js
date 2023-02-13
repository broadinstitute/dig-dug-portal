import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

//import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import AssociationsTable from "@/components/AssociationsTable.vue";
import GeneFinderTable from "@/components/GeneFinderTable.vue";
import EnrichmentTable from "@/components/EnrichmentTable.vue";
import DatasetsTable from "@/components/DatasetsTable.vue";
import CorrelationTable from "@/components/CorrelationTable.vue";
import PathwayTable from "@/components/PathwayTable.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import EffectorGenesSection from "@/components/EffectorGenesSection.vue";
import Documentation from "@/components/Documentation.vue";
import RawImage from "@/components/RawImage.vue";
import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";
import sessionUtils from "@/utils/sessionUtils";

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
new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        //PhenotypeSelectPicker,
        AncestrySelectPicker,
        GeneFinderTable,
        AssociationsTable,
        EnrichmentTable,
        DatasetsTable,
        CorrelationTable,
        PathwayTable,
        Documentation,
        RawImage,
        EffectorGenesSection,

        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterGreaterThan,
        FilterEnumeration,
        FilterEffectDirection,

        SearchHeaderWrapper
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            phenotypeSearchKey: null,
            newPhenotypeSearchKey: null
        }
    },
    methods: {
        ...uiUtils,
        ...sessionUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        intFormatter: Formatters.intFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        setSelectedPhenotype(PHENOTYPE) {
            this.newPhenotypeSearchKey = PHENOTYPE.description;
            this.phenotypeSearchKey = null;
            this.$store.dispatch("selectedPhenotype", PHENOTYPE);
        },
    },

    computed: {

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
        ///
        ancestryDatasets() {
            if (!this.$store.state.ancestry) {
                return this.$store.state.bioPortal.datasets;
            }
            return this.$store.state.bioPortal.datasets.filter(dataset => dataset.ancestry == this.$store.state.ancestry);
        },
        ancestryAnnotations() {
            if (!this.$store.state.ancestry) {
                return this.$store.state.annotations.data;
            }
            return this.$store.state.annotations.data.filter(annotation => annotation.ancestry == this.$store.state.ancestry);
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

        manhattanPlot() {
            let phenotype = this.$store.state.phenotype;
            let ancestry = this.$store.state.ancestry;

            if (!!phenotype) {
                if (!ancestry) {
                    return `/api/raw/plot/phenotype/${phenotype.name}/manhattan.png`;
                } else {
                    return `api/raw/plot/phenotype/${phenotype.name}/${ancestry}/manhattan.png`;
                }
            }
        },

        qqPlot() {
            let phenotype = this.$store.state.phenotype;
            let ancestry = this.$store.state.ancestry;

            if (!!phenotype) {
                if (!ancestry) {
                    return `/api/raw/plot/phenotype/${phenotype.name}/qq.png`;
                } else {
                    return `/api/raw/plot/phenotype/${phenotype.name}/${ancestry}/qq.png`;
                }
            }
        },
        geneticCorrelationData() {

            let data = this.$store.state.geneticCorrelation.data;
            let focusedData;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                focusedData = sessionUtils.getInSession(data, this.phenotypesInSession, 'other_phenotype');
            } else {
                focusedData = data;
            }

            return focusedData;
        }
    },

    watch: {
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let name = keyParams.phenotype;
            let phenotype = phenotypeMap[name];

            if (!!phenotype) {
                this.$store.state.selectedPhenotype = phenotype;
                keyParams.set({ phenotype: phenotype.name });
            }
            //Initial query. Should only happen once.
            this.$store.dispatch("queryPhenotype");
        },

        "$store.state.phenotype": function (phenotype) {
            keyParams.set({ phenotype: phenotype.name });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        "$store.state.ancestry": function (ancestry) {
            keyParams.set({ ancestry: ancestry });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
