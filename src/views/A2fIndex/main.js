import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "@/components/DatasetSelectPicker.vue";
import NewsFeedSection from "@/components/frontPage/NewsFeedSection.vue";
import AboutPortalSection from "@/components/frontPage/AboutPortalSection.vue";
import AboutProjectSection from "@/components/frontPage/AboutProjectSection.vue";
import UnderDatasetsSection from "@/components/frontPage/UnderDatasetsSection.vue";
import DatasetsSection from "@/components/frontPage/DatasetsSection.vue";
import DiseaseGroupSelect from "@/components/DiseaseGroupSelect.vue";
import DiseaseSystems from "@/components/DiseaseSystems.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import Documentation from "@/components/Documentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import ResearchPageDescription from "@/components/researchPortal/ResearchPageDescription.vue";

import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { concat } from "lodash";

new Vue({
    store,

    data: {
        selected: '',
        searches: [
            { id: 'gene', name: 'gene' },
            { id: 'variantOrRegion', name: 'variantOrRegion' },
        ],
    },

    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        NewsFeedSection,
        AboutPortalSection,
        AboutProjectSection,
        DatasetsSection,
        UnderDatasetsSection,
        DiseaseGroupSelect,
        TooltipDocumentation,
        Documentation,
        Autocomplete,
        ResearchSingleSearch,
        ResearchPageDescription,
        DiseaseSystems
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
        showHideElement(ID) {
            uiUtils.showHideElement(ID);
        }
    },

    computed: {

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        diseaseGroups() {
            return this.$store.state.bioPortal.diseaseGroups;
        },
        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
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
        matchingGenes() {
            return this.$store.state.matchingGenes;
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        geneOrRegionOrVariant() {
            return this.$store.state.geneOrRegionOrVariant;
        },

        datasetsInfo() {
            let datasets = this.$store.state.kp4cd.datasetsInfo;

            if (datasets.length === 0) {
                return {};
            }
            return datasets[0];
        },
        kPortals() {
            let portals = this.$store.state.kp4cd.portals;

            if (portals.length === 0) {
                return null;
            }
            return portals;
        },
        phenotypesByName() {
            if (!this.phenotypes) {
                return null
            }

            let content = {}

            this.phenotypes.map(p => {
                content[p.name] = p;
            })

            return content;

        },
        datasetsDescription() {
            let datasets = this.$store.state.bioPortal.datasets;
            let diseases = this.$store.state.bioPortal
                .diseaseSystems

            //first get datasets by phenotype groups
            if (datasets.length > 0 && !!this.phenotypesByName && diseases.length > 0) {

                let pGroups = {}

                this.$store.state.bioPortal.phenotypes.map(p => {
                    if (!pGroups[p.group]) {
                        pGroups[p.group] = { phenotypes: [], datasets: [] };
                    }
                    pGroups[p.group].phenotypes.push(p.name)
                })

                datasets.map(d => {

                    d.phenotypes.map(dp => {
                        for (const [key, data] of Object.entries(pGroups)) {
                            if (!!data.phenotypes.includes(dp)) {
                                data.datasets.push(d.name)
                            }
                        }
                    })
                })

                let diseaseSystems = [
                    ...new Set(diseases.map((d) => d.system)),
                ].sort();

                let dGroups = {}

                diseaseSystems.map(ds => {
                    dGroups[ds] = { phenotypes: [], datasets: [] };
                })

                diseases.map(d => {
                    if (!dGroups[d.system].phenotypes.includes(d.group)) {
                        dGroups[d.system].phenotypes.push(d.group);
                    }
                })



                //then get dataset numbers by disease systems X phenotype groups

                Object.keys(dGroups).map(dg => {
                    dGroups[dg].phenotypes.map(p => {

                        if (!!pGroups[p]) {
                            let tempDatasetsArr = [].concat(dGroups[dg].datasets, pGroups[p].datasets);
                            dGroups[dg].datasets = [... new Set(tempDatasetsArr)];
                        }

                    })
                })


                let filteredDGroups = {};

                Object.keys(dGroups).map(dg => {
                    if (dGroups[dg].datasets.length > 0) {
                        filteredDGroups[dg] = dGroups[dg];
                    }
                })

                //then create diagram content by disease groups

                let dataContent = "";


                let dGroupKeys = Object.keys(filteredDGroups).sort();
                let dcountLength = dGroupKeys.length - 1;

                let kIndex = 0;

                dGroupKeys.map(k => {
                    dataContent += '"' + k.replaceAll(" system", "").replaceAll(" & ", " / ") + '":' + filteredDGroups[k].datasets.length;
                    dataContent += (kIndex < dcountLength) ? ',' : '';

                    kIndex++;
                })

                let content = '<div class="plot">{"type":"bar","data": { ' + dataContent + ' },"width": 400,"height": 150,"color": "multi","x label angle":65,"label space":100}</div>';

                return content;

            } else {
                return null;
            }
        },
        phenotypesDescription() {
            let phenotypes = this.$store.state.bioPortal.phenotypes;

            if (phenotypes.length > 0) {

                ///create phenotypes plot content

                let groupLabel = [...new Set(phenotypes.map(p => p.group))].sort();
                let group = phenotypes.map(g => g.group);
                let groupCount = {}



                groupLabel.map(l => {
                    let tempCount = group.filter(t => t == l);
                    groupCount[l] = tempCount.length;

                })

                let groupContent = "";
                let gCountLength = Object.keys(groupCount).length - 1;

                let gIndex = 0;
                Object.keys(groupCount).map(g => {
                    groupContent += '"' + g + '":' + groupCount[g];

                    groupContent += (gIndex < gCountLength) ? ',' : '';
                    gIndex++;
                })


                let content = '<div class="plot">{"type":"bar","data": { ' + groupContent + ' },"width": 400,"height": 150,"color": "multi","x label angle":65,"label space":175}</div>';

                return content;
            } else {
                return null;
            }
        },

        pageDescription() {
            if (this.phenotypesDescription != null && this.datasetsDescription != null) {

                let datasets = this.$store.state.bioPortal.datasets;
                let phenotypes = this.$store.state.bioPortal.phenotypes;

                let content = "<h5>Datasets by organ system</h5>";
                content += "<span>Total: " + datasets.length + " datasets</span>";
                content += this.datasetsDescription;
                content += "<h5>Phenotypes by group</h5>";
                content += "<span>Total: " + phenotypes.length + " phenotypes</span>";
                content += this.phenotypesDescription;

                return content;

            } else {
                return null;
            }

        }
    },

    watch: {
        geneOrRegionOrVariant() {
            this.$store.commit("setInvalidGeneOrRegionOrVariant", false);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getNewsFeed", group.name);
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
            this.$store.dispatch("kp4cd/getPortals");
        },
    }
}).$mount("#app");
