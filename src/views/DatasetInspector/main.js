import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import keyParams from "@/utils/keyParams";
import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import DatasetInfo from "@/components/DatasetInfo.vue";
import Documentation from "@/components/Documentation.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "@/components/DatasetSelectPicker.vue";
import AssociationsTable from "@/components/AssociationsTable.vue";
import RawImage from "@/components/RawImage.vue";
import UnauthorizeMessage from "@/components/UnauthorizedMessage";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue"

new Vue({
    store,

    components: {
        DatasetInfo,
        PageHeader,
        PageFooter,
        PortalDatasetsListTable,
        Alert,
        Documentation,
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        AssociationsTable,
        RawImage,
        UnauthorizeMessage,

        SearchHeaderWrapper
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDocumentations");
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
        intFormatter: Formatters.intFormatter
    },

    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        datasetInfo() {
            let contents = this.$store.state.kp4cd.datasetInfo;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },
        documentationMap() {
            let dataset = this.$store.state.selectedDataset;
            let phenotype = this.$store.state.selectedPhenotype;

            return {
                dataset: dataset && dataset.description,
                phenotype: phenotype && phenotype.description
            };
        },
        datasetPhenotypes() {
            let dataset = this.$store.state.selectedDataset;
            let map = this.$store.state.bioPortal.phenotypeMap;

            if (!dataset || !map) {
                return [];
            }

            return dataset.phenotypes.map(p => map[p]);
        },
        manhattanPlot() {
            let dataset = this.$store.state.selectedDataset;
            let phenotype = this.$store.state.selectedPhenotype;

            if (!!dataset && !!phenotype) {
                return `/api/raw/plot/dataset/${dataset.tech}/${dataset.name}/${phenotype.name}/manhattan.png`;
            }
        },
        qqPlot() {
            let dataset = this.$store.state.selectedDataset;
            let phenotype = this.$store.state.selectedPhenotype;

            if (!!dataset && !!phenotype) {
                return `/api/raw/plot/dataset/${dataset.tech}/${dataset.name}/${phenotype.name}/qq.png`;
            }
        },
        associations() {
            let phenotype = this.$store.state.selectedPhenotype;

            return {
                [phenotype.name]: []
            };
        }
    },

    watch: {
        "$store.state.bioPortal.datasetMap": function () {
            if (!!keyParams.dataset) {
                this.$store.commit("setSelectedDataset", keyParams.dataset);
                this.$store.dispatch("kp4cd/getDatasetInfo", keyParams.dataset);
                this.$store.dispatch("queryAssociations");
            }
        },
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            if (!!keyParams.phenotype) {
                this.$store.commit("setSelectedPhenotype", keyParams.phenotype);
                this.$store.dispatch("queryAssociations");
            }
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
