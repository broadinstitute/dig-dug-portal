import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "@/components/DatasetSelectPicker.vue";
import NewsFeedSection from "@/components/frontPage/NewsFeedSection.vue";
import DiseaseGroupSelect from "@/components/DiseaseGroupSelect.vue";
import DiseaseSystems from "@/components/DiseaseSystems.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import Documentation from "@/components/Documentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import ResearchPageDescription from "@/components/researchPortal/ResearchPageDescription.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

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
        Alert,
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        NewsFeedSection,
        DiseaseGroupSelect,
        TooltipDocumentation,
        Documentation,
        Autocomplete,
        ResearchSingleSearch,
        ResearchPageDescription,
        DiseaseSystems,
    },

    data: {
        selected: "",
        searches: [
            { id: "gene", name: "gene" },
            { id: "variantOrRegion", name: "variantOrRegion" },
        ],
        stats: [],
        statsKeys: [
            { icon: "phenotypes", label: "Phenotypes" },
            { icon: "genetic_datasets", label: "Genetic datasets" },
            { icon: "genomic_datasets", label: "Genomic datasets" },
            { icon: "bioinfomatics_methods", label: "Bioinformatic methods" },
            { icon: "curated_datasets", label: "Curated datasets" },
        ],
        oldStats: keyParams.oldstats,
    },

    computed: {
        ssConfig() {
            let ssConfig = {
                "search enabled": true,
                "search instruction": "Search gene or disease",
                "search examples": [
                    {
                        "parameter": "gene",
                        "value": "PCSK9"
                    },
                    {
                        "parameter": "gene",
                        "value": "MLX"
                    }
                ],
                "search parameters": [
                    {
                        "parameter": "gene",
                        "values": "kp genes",
                        "options": [
                            {
                                "type": "summary",
                                "summary id": "variant_sifter",
                                "summary label": "View most associated phenotypes & open Variant Sifter",
                                "sections": [
                                    {
                                        "id": "most_asso_phenotypes",
                                        "header": "Most associated phenotypes",
                                        "data point": {
                                            "type": "bioindex",
                                            "url": "https://bioindex-dev.hugeamp.org/api/bio/query/gene-associations?q=$gene",
                                            "continue url": "https://bioindex-dev.hugeamp.org/api/bio/cont?limit=20000&token=",
                                            "parameters": [
                                                "gene"
                                            ],
                                            "parameters type": "replace",
                                            "data type": "bioindex"
                                        },
                                        "summary text": "Top 10 most associated phenotypes with $gene.(KP)",
                                        "summary columns": [
                                            {
                                                "field": "phenotype",
                                                "header": "Phenotype",
                                                "format": {
                                                    "type": "link",
                                                    "link": "/research.html?pageid=kp_variant_sifter&phenotype=$phenotype&region=$chromosome:$start-$end"
                                                }
                                            },
                                            {
                                                "field": "ancestry",
                                                "header": "Ancestry",
                                                "format": {
                                                    "type": "ancestry"
                                                }
                                            },
                                            {
                                                "field": "subjects",
                                                "header": "Subjects"
                                            },
                                            {
                                                "field": "pValue",
                                                "header": "P-value",
                                                "format": {
                                                    "type": "scientific notation"
                                                }
                                            }
                                        ],
                                        "summary rows": 10
                                    }
                                ]
                            },
                            {
                                "type": "summary",
                                "summary id": "gene_tissue_association",
                                "url label": "Go to gene-tissue association viewer",
                                "url": "/research.html?entity=gene&pageid=kc_entity_dev&gene=",
                                "summary label": "View most associated tissues",
                                "sections": [
                                    {
                                        "id": "gtex_tissue",
                                        "header": "GTEx Tissue Specificity",
                                        "data point": {
                                            "type": "bioindex",
                                            "url": "https://cfde.hugeampkpnbi.org/api/bio/query/gtex-tstat?q=$gene",
                                            "continue url": "https://cfde.hugeampkpnbi.org/api/bio/cont?limit=20000&token=",
                                            "parameters": [
                                                "gene"
                                            ],
                                            "parameters type": "replace",
                                            "data type": "bioindex"
                                        },
                                        "summary text": "Top 3 tissues (biosamples) $gene serves as a marker gene.(GTEx)",
                                        "summary columns": [
                                            {
                                                "field": "tissue",
                                                "header": "Tissue"
                                            },
                                            {
                                                "field": "biosample",
                                                "header": "Biosample"
                                            },
                                            {
                                                "field": "tstat",
                                                "header": "T-Stat"
                                            }
                                        ],
                                        "summary rows": 3
                                    },
                                    {
                                        "id": "gtex_tissue",
                                        "header": "GTEx Tissue Specificity",
                                        "data point": {
                                            "type": "bioindex",
                                            "url": "https://bioindex-dev.hugeamp.org/api/bio/query/gene-expression?q=$gene",
                                            "parameters": [
                                                "gene"
                                            ],
                                            "parameters type": "replace",
                                            "data type": "bioindex"
                                        },
                                        "summary text": "Top 3 tissues $gene is most expressed.(CMDGA)",
                                        "summary columns": [
                                            {
                                                "field": "tissue",
                                                "header": "Tissue"
                                            },
                                            {
                                                "field": "biosample",
                                                "header": "Biosample"
                                            },
                                            {
                                                "field": "meanTpm",
                                                "header": "Mean TPM"
                                            },
                                            {
                                                "field": "nSamples",
                                                "header": "Samples"
                                            }
                                        ],
                                        "summary rows": 3
                                    }
                                ]
                            },
                            {
                                "type": "summary",
                                "summary id": "lincs_corr_summary",
                                "url label": "Search gene on Entity page",
                                "url": "/research.html?entity=gene&pageid=kc_entity_dev&gene=",
                                "summary label": "View correlated genes",
                                "sections": [
                                    {
                                        "id": "lincs_coor",
                                        "header": "Gene correlation",
                                        "data point": {
                                            "type": "bioindex",
                                            "url": "https://cfde.hugeampkpnbi.org/api/bio/query/lincs-corr?q=$gene",
                                            "continue url": "https://cfde.hugeampkpnbi.org/api/bio/cont?limit=20000&token=",
                                            "parameters": [
                                                "gene"
                                            ],
                                            "parameters type": "replace",
                                            "data type": "bioindex"
                                        },
                                        "summary text": "Top 10 most correlated items with $gene (LINCS)",
                                        "summary columns": [
                                            {
                                                "field": "other_name",
                                                "header": "Name"
                                            },
                                            {
                                                "field": "other_source",
                                                "header": "Source"
                                            },
                                            {
                                                "field": "correlation",
                                                "header": "Correlation"
                                            }
                                        ],
                                        "summary rows": 10
                                    }
                                ]
                            },
                            {
                                "type": "target page",
                                "url label": "Gene page",
                                "url": "/research.html?pageid=kc_entity_dev&entity=gene&gene="
                            }
                        ]
                    },
                    {
                        "parameter": "phenotype",
                        "values": "kp phenotypes",
                        "options": [
                            {
                                "type": "summary",
                                "summary id": "variant_sifter",
                                "summary label": "View most associated genes & open Variant Sifter",
                                "sections": [
                                    {
                                        "id": "most_asso_genes",
                                        "header": "Most associated genes",
                                        "data point": {
                                            "type": "bioindex",
                                            "url": "https://bioindex-dev.hugeamp.org/api/bio/query/gene-finder?q=$phenotype",
                                            "continue url": "https://bioindex-dev.hugeamp.org/api/bio/cont?limit=20000&token=",
                                            "parameters": [
                                                "phenotype"
                                            ],
                                            "parameters type": "replace",
                                            "data type": "bioindex"
                                        },
                                        "summary text": "Top 10 most associated genes with $phenotype.(KP)",
                                        "summary columns": [
                                            {
                                                "field": "gene",
                                                "header": "Gene",
                                                "format": {
                                                    "type": "link",
                                                    "link": "/research.html?pageid=kp_variant_sifter&phenotype=$phenotype&region=$chromosome:$start-$end"
                                                }
                                            },
                                            {
                                                "field": "ancestry",
                                                "header": "Ancestry"
                                            },
                                            {
                                                "field": "subjects",
                                                "header": "Subjects"
                                            },
                                            {
                                                "field": "pValue",
                                                "header": "P-value"
                                            },
                                            {
                                                "field": "type",
                                                "header": "Type"
                                            }
                                        ],
                                        "summary rows": 10
                                    }
                                ]
                            },
                            {
                                "type": "summary",
                                "url label": "Go to phenotype page",
                                "url": "/research.html?pageid=kc_entity_dev&entity=gene&gene="
                            },
                            {
                                "type": "summary",
                                "url label": "Open Signal Sifter",
                                "url": "/research.html?pageid=kc_entity_dev&entity=gene&gene=",
                                "summary id": "signal_sifter",
                                "summary label": "View most associated variants & open Signal Sifter",
                                "sections": [
                                    {
                                        "id": "most_asso_variants",
                                        "header": "Most associated variants",
                                        "data point": {
                                            "type": "bioindex",
                                            "url": "https://bioindex-dev.hugeamp.org/api/bio/query/global-associations?q=$phenotype",
                                            "continue url": "https://bioindex-dev.hugeamp.org/api/bio/cont?limit=20000&token=",
                                            "parameters": [
                                                "phenotype"
                                            ],
                                            "parameters type": "replace",
                                            "data type": "bioindex"
                                        },
                                        "summary text": "Top 10 most associated variants with $phenotype.(KP)",
                                        "summary columns": [
                                            {
                                                "field": "varId",
                                                "header": "Variant ID"
                                            },
                                            {
                                                "field": "clump",
                                                "header": "Clump",
                                                "format": {
                                                    "type": "link",
                                                    "link": "/research.html?pageid=kp_signal_sifter&phenotype=$phenotype&region=$chromosome:$clumpStart-$clumpEnd"
                                                }
                                            },
                                            {
                                                "field": "n",
                                                "header": "Samples"
                                            },
                                            {
                                                "field": "pValue",
                                                "header": "P-value"
                                            },
                                            {
                                                "field": "posteriorProbability",
                                                "header": "Posterior Probability"
                                            }
                                        ],
                                        "summary rows": 10
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "parameter": "disease",
                        "data point": {
                            "type": "api",
                            "url": "https://hugeampkpncms.org/rest/directcsv?id=mondo_disease_list",
                            "data type": "json",
                            "data wrapper": [
                                0,
                                "field_data_points"
                            ]
                        },
                        "target page": {
                            "label": "Search disease",
                            "page id": "kc_entity",
                            "entity parameter": "entity",
                            "entity": "disease"
                        }
                    }
                ]
            }

            return ssConfig;
        },
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
                return null;
            }

            let content = {};

            this.phenotypes.map((p) => {
                content[p.name] = p;
            });

            return content;
        },
        datasetsDescription() {
            let datasets = this.$store.state.bioPortal.datasets;
            let diseases = this.$store.state.bioPortal.diseaseSystems;

            //first get datasets by phenotype groups
            if (
                datasets.length > 0 &&
                !!this.phenotypesByName &&
                diseases.length > 0
            ) {
                let pGroups = {};

                this.$store.state.bioPortal.phenotypes.map((p) => {
                    if (!pGroups[p.group]) {
                        pGroups[p.group] = { phenotypes: [], datasets: [] };
                    }
                    pGroups[p.group].phenotypes.push(p.name);
                });

                datasets.map((d) => {
                    d.phenotypes.map((dp) => {
                        for (const [key, data] of Object.entries(pGroups)) {
                            if (!!data.phenotypes.includes(dp)) {
                                data.datasets.push(d.name);
                            }
                        }
                    });
                });

                let diseaseSystems = [
                    ...new Set(diseases.map((d) => d.system)),
                ].sort();

                let dGroups = {};

                diseaseSystems.map((ds) => {
                    dGroups[ds] = { phenotypes: [], datasets: [] };
                });

                diseases.map((d) => {
                    if (!dGroups[d.system].phenotypes.includes(d.group)) {
                        dGroups[d.system].phenotypes.push(d.group);
                    }
                });

                //then get dataset numbers by disease systems X phenotype groups

                Object.keys(dGroups).map((dg) => {
                    dGroups[dg].phenotypes.map((p) => {
                        if (!!pGroups[p]) {
                            let tempDatasetsArr = [].concat(
                                dGroups[dg].datasets,
                                pGroups[p].datasets
                            );
                            dGroups[dg].datasets = [
                                ...new Set(tempDatasetsArr),
                            ];
                        }
                    });
                });

                let filteredDGroups = {};

                Object.keys(dGroups).map((dg) => {
                    if (dGroups[dg].datasets.length > 0) {
                        filteredDGroups[dg] = dGroups[dg];
                    }
                });

                //then create diagram content by disease groups

                let dataContent = "";

                let dGroupKeys = Object.keys(filteredDGroups).sort();
                let dcountLength = dGroupKeys.length - 1;

                let kIndex = 0;

                dGroupKeys.map((k) => {
                    dataContent +=
                        '"' +
                        k.replaceAll(" system", "").replaceAll(" & ", " / ") +
                        '":' +
                        filteredDGroups[k].datasets.length;
                    dataContent += kIndex < dcountLength ? "," : "";

                    kIndex++;
                });

                let content =
                    '<div class="plot">{"type":"bar","data": { ' +
                    dataContent +
                    ' },"width": 400,"height": 150,"color": "multi","x label angle":65,"label space":100}</div>';

                return content;
            } else {
                return null;
            }
        },
        phenotypesDescription() {
            let phenotypes = this.$store.state.bioPortal.phenotypes;

            if (phenotypes.length > 0) {
                ///create phenotypes plot content

                let groupLabel = [
                    ...new Set(phenotypes.map((p) => p.group)),
                ].sort();
                let group = phenotypes.map((g) => g.group);
                let groupCount = {};

                groupLabel.map((l) => {
                    let tempCount = group.filter((t) => t == l);
                    groupCount[l] = tempCount.length;
                });

                let groupContent = "";
                let gCountLength = Object.keys(groupCount).length - 1;

                let gIndex = 0;
                Object.keys(groupCount).map((g) => {
                    groupContent += '"' + g + '":' + groupCount[g];

                    groupContent += gIndex < gCountLength ? "," : "";
                    gIndex++;
                });

                let content =
                    '<div class="plot">{"type":"bar","data": { ' +
                    groupContent +
                    ' },"width": 400,"height": 150,"color": "multi","x label angle":65,"label space":175}</div>';

                return content;
            } else {
                return null;
            }
        },

        pageDescription() {
            if (
                this.phenotypesDescription != null &&
                this.datasetsDescription != null
            ) {
                let datasets = this.$store.state.bioPortal.datasets;
                let phenotypes = this.$store.state.bioPortal.phenotypes;

                let content = "<h5>Datasets by organ system</h5>";
                content +=
                    "<span>Total: " + datasets.length + " datasets</span>";
                content += this.datasetsDescription;
                content += "<h5>Phenotypes by group</h5>";
                content +=
                    "<span>Total: " + phenotypes.length + " phenotypes</span>";
                content += this.phenotypesDescription;

                return content;
            } else {
                return null;
            }
        },
        pageStats() {
            if (this.diseaseGroup) {
                return this.stats.find(
                    (s) => s["Portal ID"] == this.diseaseGroup.name
                );
            } else {
                return {};
            }
        },
        statsArray() {
            return this.statsKeys.map((stat) => ({
                ...stat,
                value: this.pageStats[stat.label],
                display: this.capitalize(stat.label),
            }));
        },
    },

    watch: {
        geneOrRegionOrVariant() {
            this.$store.commit("setInvalidGeneOrRegionOrVariant", false);
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getNewsFeed", group.name);
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            // this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
            this.$store.dispatch("kp4cd/getPortals");
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.getStats();
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        showHideElement(ID) {
            uiUtils.showHideElement(ID);
        },
        async getStats() {
            let dataPoint =
                "https://hugeampkpncms.org/rest/directcsv?id=Portal_stats_501";

            let contJson = await fetch(dataPoint).then((resp) => resp.json());

            if (contJson.error == null) {
                let data = dataConvert.csv2Json(
                    contJson[0]["field_data_points"]
                );
                console.log(data);
                this.stats = data;
                console.log(this.stats);
            }
        },
        capitalize(str) {
            return str.replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
