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

new Vue({
    store,

    data: {
        selected: '',
        searches: [
            { id: 'gene', name: 'gene' },
            { id: 'variantOrRegion', name: 'variantOrRegion' },
        ],
        diseaseSystems: ["Cardiovascular", "Digestive", "Endocrine", "Growth & Development", "Immune", "Musculoskeletal", "Nervous", "Renal", "Reproductive", "Respiratory", "Sensory"]
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
        ResearchPageDescription
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
        feedDiseaseOptions(ID) {
            let kp4ID = this.kpDiseasePair(ID);
            let diseaseSystems = [...new Set(this.$store.state.bioPortal.diseaseSystems.filter(d => d.system == ID + ' system').map(d => d.disease))];
            //let diseaseSystems = this.$store.state.bioPortal.diseaseSystems;

            console.log("ID", ID);



            console.log("diseaseSystems", diseaseSystems);

            console.log("kp4ID", kp4ID);

            let content = '';
            content += "<strong>Select a disease</strong><br />"
            diseaseSystems.map(d => {
                content += '<div>' + d + '</div>';
            })

            let host = window.location.host.split(".");
            if (!!window.location.host.includes("localhost")) {
                host = (host.length == 2) ? host[1] : host[0];
            } else {
                host = (host.length == 3) ? host[1] + "." + host[2] : host[0] + "." + host[1];
            }

            content += "<strong>Community portals</strong><br />"
            kp4ID.map(kp => {
                content += '<div class="community-portal"><a href="https://' + kp.name + '.' + host + '">';
                content += '<img src="https://kp4cd.org/sites/default/files/images/disease_systems/' + kp.name + 'kp.svg" /></a></div>';
            })

            return content;
        },
        emptyDiseaseOptions(ID) {
            console.log("ID", ID);
            document.getElementById(ID.split(" ")[0] + "_options").innerHTML = '';
        },
        kpDiseasePair(SYSTEM, DISEASE) {
            let rawList = [
                {
                    "kp id": "autoimmune",
                    "disease": "Allergic disease",
                    "system": "Immune"
                },
                {
                    "kp id": "autoimmune",
                    "disease": "Celiac disease",
                    "system": "Immune"
                },
                {
                    "kp id": "autoimmune",
                    "disease": "Inflammatory bowel disease",
                    "system": "Immune"
                },
                {
                    "kp id": "autoimmune",
                    "disease": "Multiple sclerosis",
                    "system": "Immune"
                },
                {
                    "kp id": "autoimmune",
                    "disease": "Nephrotic syndrome",
                    "system": "Immune"
                },
                {
                    "kp id": "autoimmune",
                    "disease": "Rheumatoid arthritis",
                    "system": "Immune"
                },
                {
                    "kp id": "autoimmune",
                    "disease": "Systemic lupus erythematosus",
                    "system": "Immune"
                },
                {
                    "kp id": "autoimmune",
                    "disease": "Type 1 diabetes",
                    "system": "Immune"
                },
                {
                    "kp id": "cd",
                    "disease": "Cerebrovascular disease",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "cvd",
                    "disease": "Atrial fibrillation",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "cvd",
                    "disease": "Coronary artery disease",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "cvd",
                    "disease": "Heart failure",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "cvd",
                    "disease": "Mitral valve prolapse",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "cvd",
                    "disease": "Nonischemic cardiomyopathy",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "cvd",
                    "disease": "Vascular disease",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "lung",
                    "disease": "Asthma",
                    "system": "Respiratory"
                },
                {
                    "kp id": "lung",
                    "disease": "Chronic obstructive pulmonary disease",
                    "system": "Respiratory"
                },
                {
                    "kp id": "lung",
                    "disease": "COVID-19",
                    "system": "Respiratory"
                },
                {
                    "kp id": "lung",
                    "disease": "Idiopathic pulmonary fibrosis",
                    "system": "Respiratory"
                },
                {
                    "kp id": "msk",
                    "disease": "Musculoskeletal disorders",
                    "system": "Musculoskeletal"
                },
                {
                    "kp id": "ndkp",
                    "disease": "ALS",
                    "system": "Nervous"
                },
                {
                    "kp id": "ndkp",
                    "disease": "Alzheimer's disease",
                    "system": "Nervous"
                },
                {
                    "kp id": "ndkp",
                    "disease": "Lewy body dementia",
                    "system": "Nervous"
                },
                {
                    "kp id": "ndkp",
                    "disease": "Parkinson's disease",
                    "system": "Nervous"
                },
                {
                    "kp id": "ocular",
                    "disease": "Age-related macular degeneration",
                    "system": "Sensory"
                },
                {
                    "kp id": "ocular",
                    "disease": "Glaucoma",
                    "system": "Sensory"
                },
                {
                    "kp id": "reproductive",
                    "disease": "Gestational diabetes",
                    "system": "Reproductive"
                },
                {
                    "kp id": "sleep",
                    "disease": "Sleep disorders",
                    "system": "Nervous"
                },
                {
                    "kp id": "t1d",
                    "disease": "Type 1 diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "t1d",
                    "disease": "Type 1 diabetes",
                    "system": "Immune"
                },
                {
                    "kp id": "t2d",
                    "disease": "Cirrhosis",
                    "system": "Endocrine"
                },
                {
                    "kp id": "t2d",
                    "disease": "Gestational diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "t2d",
                    "disease": "Kidney disease",
                    "system": "Endocrine"
                },
                {
                    "kp id": "t2d",
                    "disease": "NAFLD",
                    "system": "Endocrine"
                },
                {
                    "kp id": "t2d",
                    "disease": "Obesity",
                    "system": "Growth & Development"
                },
                {
                    "kp id": "t2d",
                    "disease": "Type 1 diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "t2d",
                    "disease": "Type 2 diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "t2d",
                    "disease": "Vascular disease",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Cerebrovascular disease",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Atrial fibrillation",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Coronary artery disease",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Heart failure",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Mitral valve prolapse",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Nonischemic cardiomyopathy",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Vascular disease",
                    "system": "Cardiovascular"
                },
                {
                    "kp id": "md",
                    "disease": "Sleep disorders",
                    "system": "Nervous"
                },
                {
                    "kp id": "md",
                    "disease": "Type 1 diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "md",
                    "disease": "Type 1 diabetes",
                    "system": "Immune"
                },
                {
                    "kp id": "md",
                    "disease": "Cirrhosis",
                    "system": "Endocrine"
                },
                {
                    "kp id": "md",
                    "disease": "Gestational diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "md",
                    "disease": "Kidney disease",
                    "system": "Endocrine"
                },
                {
                    "kp id": "md",
                    "disease": "NAFLD",
                    "system": "Endocrine"
                },
                {
                    "kp id": "md",
                    "disease": "Obesity",
                    "system": "Growth & Development"
                },
                {
                    "kp id": "md",
                    "disease": "Type 1 diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "md",
                    "disease": "Type 2 diabetes",
                    "system": "Endocrine"
                },
                {
                    "kp id": "md",
                    "disease": "Vascular disease",
                    "system": "Cardiovascular"
                }
            ];
            let content = [];

            rawList.map(r => {
                if (r["system"].toLowerCase() == SYSTEM.toLowerCase()) {
                    if (DISEASE != null && r["disease"] == DISEASE) {
                        content.push(r["kp id"]);
                    } else if (DISEASE == null) {
                        content.push(r["kp id"]);
                    }
                }
            })

            content = [...new Set(content)];

            let kps = [];

            content.map(c => {
                let tempArr = this.$store.state.bioPortal.diseaseGroups.filter(dg => dg.name == c);

                kps.push(tempArr[0]);

            })

            return kps;
        },
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
        datasetsDescription() {
            let datasets = this.$store.state.bioPortal.datasets;

            if (datasets.length > 0) {

                /// create datasets plot content
                let techLabel = [...new Set(datasets.map(d => d.tech))]
                let tech = datasets.map(d => d.tech);
                let techCount = {}

                techLabel.map(l => {
                    let tempCount = tech.filter(t => t == l);
                    techCount[l] = tempCount.length;

                })

                let dataContent = "";
                let tcountLength = Object.keys(techCount).length - 1;

                let kIndex = 0;
                Object.keys(techCount).map(k => {
                    dataContent += '"' + k + '":' + techCount[k];

                    dataContent += (kIndex < tcountLength) ? ',' : '';
                    kIndex++;
                })


                let content = '<plot>{"type":"bar","data": { ' + dataContent + ' },"width": 400,"height": 150,"color": "multi"}<plot-end>';

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


                let content = '<plot>{"type":"bar","data": { ' + groupContent + ' },"width": 400,"height": 150,"color": "multi","x label angle":65,"label space":140}<plot-end>';

                return content;
            } else {
                return null;
            }
        },

        pageDescription() {
            if (this.phenotypesDescription != null && this.datasetsDescription != null) {

                let datasets = this.$store.state.bioPortal.datasets;
                let phenotypes = this.$store.state.bioPortal.phenotypes;

                let content = "<h5>Datasets by technology</h5>";
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
