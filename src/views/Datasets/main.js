import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import uiUtils from "@/utils/uiUtils";
import formatters from "@/utils/formatters";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        PortalDatasetsListTable,
        Alert,
        Documentation,
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
        this.$store.dispatch("bioPortal/getDiseaseSystems");
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
        closeAlert,
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
        phenotypeGroups: function () {
            let content = [
                ...new Set(
                    this.$store.state.bioPortal.phenotypes.map((p) => p.group)
                ),
            ].sort();

            return content;
        },
        phenotypesByGroups: function () {
            let content = {};

            this.phenotypeGroups.map((x) => {
                let tempArray = [];

                this.$store.state.bioPortal.phenotypes.map((p) => {
                    if (p.group == x) {
                        tempArray.push(p.name);
                    }
                });

                content[x] = tempArray;
            });

            return content;
        },

        datasetsInSession() {
            let allDatasets = this.$store.state.bioPortal.datasets;

            let datasetsInSession = [];

            allDatasets.map((d) => {
                let inSession = 0;
                this.phenotypesInSession.map((p) => {
                    if (!!d.phenotypes.includes(p.name) && inSession == 0) {
                        datasetsInSession.push(d);
                        inSession = 1;
                    }
                });
            });

            return datasetsInSession;
        },

        datasetsList() {
            let contents = this.datasetsInSession;

            if (contents.length === 0) {
                return null;
            } else {
                contents.map((x) => {
                    let datasetPGroup = [];

                    this.phenotypeGroups.map((g) => {
                        let groupPhenotypes = this.phenotypesByGroups[g];

                        let intersectings = x.phenotypes.filter((p) =>
                            groupPhenotypes.includes(p)
                        );

                        if (intersectings.length > 0) {
                            datasetPGroup.push(g);
                        }
                    });

                    x["phenotype_group"] = datasetPGroup;
                    x["ancestry_name"] = formatters.ancestryFormatter(
                        x.ancestry
                    );
                    x["data_type"] = formatters.dataTypeFormatter(x.tech);
                });

                if (this.datasetsSearchCriterion.length > 0) {
                    let filtered = [];
                    contents.map((d) => {
                        this.datasetsSearchCriterion.map((s) => {
                            if (d[s.field].includes(s.threshold) == true) {
                                filtered.push(d);
                            }
                        });
                    });

                    return filtered;
                } else {
                    return contents;
                }
            }
        },

        datasetsPhenotypeOptions() {
            //let uniqueOptions = [...new Set(this.$store.state.bioPortal.phenotypes.map(p => p.name).sort())]

            let uniqueOptions = [
                ...new Set(this.phenotypesInSession.map((p) => p.name).sort()),
            ];

            return uniqueOptions;
        },
        phenotypeGroupOptions() {
            let pGroups = [];

            this.datasetsList.map((d) => {
                d.phenotype_group.map((g) => {
                    pGroups.push(g);
                });
            });

            let uniqueOptions = [...new Set(pGroups)].sort();

            return uniqueOptions;
        },
        techOptions() {
            let uniqueOptions = [
                ...new Set(this.datasetsList.map((d) => d["data_type"])),
            ].sort();

            return uniqueOptions;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            // this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
        },
    },
}).$mount("#app");
