import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
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
        PortalDatasetsListTable,
        Alert,
        CriterionListGroup,
        FilterEnumeration,
    },
    data() {
        return {
            counter: 0,
            phenotypelist: [],
            datasetsSearchCriterion: [],
            geneFinderAssociationsMap: {},
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
        closeAlert
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

        datasetsList() {
            let contents = [];
            //console.log("this.$store.state.bioPortal.datasets", this.$store.state.bioPortal.datasets);
            //console.log("this.$store.state.kp4cd.datasetsInfo", this.$store.state.kp4cd.datasetsInfo);
            if (this.datasetsSearchCriterion.length > 0) {

                this.$store.state.kp4cd.datasetsInfo.map(d => {
                    this.datasetsSearchCriterion.map(s => {
                        if (d[s.field].includes(s.threshold) == true) {
                            contents.push(d);
                        }
                    })
                })

            } else {
                contents = this.$store.state.kp4cd.datasetsInfo;
            }


            // TODO: use this.$store.state.bioPortal.datasets instead!

            if (contents.length === 0) {
                return {};
            }

            //datasetsSearchCriterion

            return contents;
        },

        datasetsNameOptions() {
            let options = []
            this.$store.state.kp4cd.datasetsInfo.map(x => {
                if (x.field_portals.includes(this.diseaseGroup.name)) {
                    options.push(x);
                }
            });
            return options;
        },
        datasetsPhenotypeOptions() {
            let options = []
            this.$store.state.kp4cd.datasetsInfo.map(x => {
                if (x.field_portals.includes(this.diseaseGroup.name)) {
                    let phenotypes = x.field_phenotypes.split("\r\n");

                    phenotypes.map(p => {
                        if (p != "") {
                            options.push(p);
                        }
                    })

                }
            });

            let uniqueOptions = [...new Set(options)]
            return uniqueOptions;
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
        },

    }
}).$mount("#app");
