import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import "../../assets/phewas.css";
import "../../assets/filtering.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import UniprotReferencesTable from "@/components/UniprotReferencesTable.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import GeneAssociationsTable from "@/components/GeneAssociationsTable";
import GeneAssociationsMasks from "@/components/GeneAssociationsMasks";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker";
import HugeScoresTable from "@/components/HugeScoresTable.vue";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue";
import ResearchBarPlot from "@/components/researchPortal/ResearchBarPlot.vue";
import ResearchBoxPlot from "@/components/researchPortal/ResearchBoxPlot.vue";
import { SCB_CONFIG } from "../../utils/scbConfig.js";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
import filterUtils from "@/utils/filterUtils";
new Vue({
    // Based on HuGeAMP Gene page.
    store,
    components: {
        UniprotReferencesTable,
        ResearchSingleSearch,
        TooltipDocumentation,
        NCATSPredicateTable,
        FilterPValue,
        UnauthorizedMessage,
        GeneAssociationsTable,
        GeneAssociationsMasks,
        ResearchPheWAS,
        FilterGreaterThan,
        AncestrySelectPicker,
        HugeScoresTable,
        ResearchSingleCellBrowser,
        ResearchBarPlot,
        ResearchBoxPlot
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            scbData: [],
            activeTab: "hugeScorePheWASPlot",
            searchConfig: {
                "search instruction": "Search for a gene",
                "search examples": [
                    {
                        parameter: "gene",
                        value: "CFTR",
                    }
                ],
                "search parameters": [
                    {
                        parameter: "gene",
                        values: "kp genes",
                        "target page": {
                            label: "Search Gene",
                            url: "/gene.html?",
                        },
                    }
                ],
            },
            phenotypeFilterList: [],
            plotColors: [
                "#007bff",
                "#048845",
                "#8490C8",
                "#BF61A5",
                "#EE3124",
                "#FCD700",
                "#5555FF",
                "#7aaa1c",
                "#9F78AC",
                "#F88084",
                "#F5A4C7",
                "#CEE6C1",
                "#cccc00",
                "#6FC7B6",
                "#D5A768",
                "#d4d4d4",
            ],
            phewasPlotMargin: {
                leftMargin: 150,
                rightMargin: 40,
                topMargin: 20,
                bottomMargin: 100,
                bump: 11,
            },
            hugeScoreRenderConfig: {
                type: "phewas plot",
                "render by": "phenotype",
                "group by": "group",
                "phenotype map": "kp phenotype map",
                "y axis field": "renderScore",
                "convert y -log10": "false",
                "y axis label": "Log(HuGE score)",
                "x axis label": "",
                "beta field": "null",
                "hover content": ["bf_common", "bf_rare", "huge"],
                thresholds: [Math.log(3), Math.log(30)],
                "label in black": "greater than",
                height: "600",
                "plot margin": {
                    left: 150,
                    right: 150,
                    top: 250,
                    bottom: 300,
                },
            },
            commonVariantRenderConfig: {
                type: "phewas plot",
                "render by": "phenotype",
                "group by": "phenotype group",
                "phenotype map": "kp phenotype map",
                "y axis field": "pValue",
                "convert y -log10": "true",
                "y axis label": "-Log10(p-value)",
                "x axis label": "beta",
                "beta field": "null",
                "hover content": ["pValue"],
                thresholds: ["2.5e-6"],
                height: "600",
                "plot margin": {
                    left: 150,
                    right: 150,
                    top: 250,
                    bottom: 300,
                },
            },
            rareVariantRenderConfig: {
                type: "phewas plot",
                "group by": "phenotype group",
                "render by": "phenotype",
                "phenotype map": "kp phenotype map",
                "y axis field": "pValue",
                "convert y -log10": "true",
                "y axis label": "-Log10(p-value)",
                "x axis label": "beta",
                "beta field": "beta",
                "hover content": ["pValue", "beta"],
                thresholds: ["2.5e-6", "0.05"],
                height: "600",
                "plot margin": {
                    left: 150,
                    right: 150,
                    top: 250,
                    bottom: 300,
                },
            },
             GTExData: null,
            GTExDataFields: [
                {
                    key: 'tissue',
                    sortable: true
                }, {
                    key: 'biosample',
                    sortable: true
                }, {
                    key: 'tstat',
                    sortable: true,
                    formatter: (value) => value ? value.toExponential(2) : ""
                }

            ],
            GTExRenderConfig: {
                type: "bar plot",
                label: "P-Value",
                "group by": "tissue",
                "y axis field": "tstat",
                "convert y -log10": null,
                "y ticks decimal point": "2",
                "render by": "biosample",
                "y axis label": "Tstat",
                "x axis label": "Tissue / Biosample",
                "beta field": null,
                "hover content": [
                    "tissue",
                    "tstat"
                ],
                thresholds: "calculate",
                "thresholds calculate": [
                    [
                        0.05,  
                        "/", 
                        "data length"
                    ]
                ],
                height: 300,
                "plot margin": {
                    top: 200,
                    bottom: 200,
                    left: 150,
                    right: 175
                }
            },
            GTExPage: 1,

            GTExData2: null,
            GTExData2Fields: [
                {
                    key: 'tissue',
                    sortable: true
                }, {
                    key: 'tissueId'
                }, {
                    key: 'biosample',
                    sortable: true
                }, {
                    key: 'biosampleId'
                }, {
                    key: 'minTpm',
                    label: 'Min TPM',
                    sortable: true
                }, {
                    key: 'firstQuTpm',
                    label: 'Q1 TPM',
                    sortable: true
                }, {
                    key: 'medianTpm',
                    label: 'Median TPM',
                    sortable: true
                }, {
                    key: 'thirdQuTpm',
                    label: 'Q3 TPM',
                    sortable: true
                }, {
                    key: 'maxTpm',
                    label: 'Max TPM',
                    sortable: true
                }, {
                    key: 'nSamples',
                    label: 'Total Samples',
                    sortable: true
                }, {
                    key: 'dataset'
                },

            ],
            GTExRenderConfig2: {
                type: "box plot",
                label: "Absolute gene expression",
                "group by": "tissue",
                "y axis field": {
                    min: "minTpm",
                    max: "maxTpm",
                    median: "medianTPM",
                    q1: "firstQuTpm",
                    q3: "thirdQuTpm"
                },
                "convert y -log10": null,
                "y ticks decimal point": "2",
                "render by": "biosample",
                "y axis label": "TPM",
                "x axis label": "Tissue / Biosample",
                "hover content": [
                    "tissue",
                    "nSamples"
                ],
                "thresholds": "calculate",
                "thresholds calculate": [
                [
                    0.05,
                    "/",
                    "data length"
                ]
                ],
                height: 300,
                "plot margin": {
                    top: 200,
                    bottom: 200,
                    left: 150,
                    right: 175
                }
            },
            GTExPage2: 1,
        };
    },
    watch: {
        region(region) {
            if (region) {
                //uiUtils.hideElement("pageSearchHeaderContent");
                this.$store.dispatch("queryGeneRegion", region);
            }
        },
        symbolName(symbol) {
            this.$store.dispatch("queryUniprot", symbol);
            this.$store.dispatch("queryAssociations");
            this.$store.dispatch("getHugeScoresData");
        },
    },
    async created() {
        keyParams.set({ gene: this.geneName });
        /// disease systems
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        ////
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.checkGeneName(this.$store.state.geneName);
        this.getGTExdata();
        this.getGTExdata2();
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
        scbConfig(){
            return SCB_CONFIG;
        },
        geneName(){
            return this.$store.state.geneName;
        },
        symbolName() {
            return this.$store.getters.canonicalSymbol;
        },
        region() {
            return this.$store.getters.region;
        },
        docDetails() {
            let symbol = this.geneSymbol;
            let r = this.region;

            if (!!symbol && !!r) {
                return {
                    gene: symbol,
                    region: `${r.chromosome}:${Formatters.intFormatter(
                        r.start
                    )}-${Formatters.intFormatter(r.end)}`,
                };
            }
            return {};
        },
        geneassociations() {
            let data = this.$store.state.geneassociations.data;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            // convert to an array, sorted by p-value
            let x = Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
            return x;
        },
        hugeScores() {
            let data = sortUtils.sortArrOfObjects(
                this.$store.state.hugeScores.data,
                "huge",
                "number",
                "desc"
            );

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let hugeMap = {};

            for (let i in data) {
                const score = data[i];
                let phenotypeEntity =
                    this.$store.state.bioPortal.phenotypeMap[score.phenotype];
                score["group"] = phenotypeEntity
                    ? phenotypeEntity.group
                    : "No group info";
                score["renderScore"] = Math.log(data[i].huge);

                // skip associations not part of the disease group
                if (!this.phenotypeMap[score.phenotype]) {
                    continue;
                }

                hugeMap[score.phenotype] = score;
            }

            // convert to an array, sorted by p-value
            let x = Object.values(hugeMap);
            return x;
        },
        filteredAssociations() {
            return (
                this.geneassociations.filter((row) => {
                    return this.phenotypeMap[row.phenotype];
                }) || []
            );
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        transcriptOr52k() {
            let endpoint = !this.$store.state.selectedTranscript
                ? this.$store.state.associations52k
                : this.$store.state.transcriptAssoc;
            this.$store.state.restricted = endpoint.restricted;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                endpoint.data = sessionUtils.getInSession(
                    endpoint.data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let assocMap = {};

            for (let i in endpoint.data) {
                const assoc = endpoint.data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            endpoint.data.sort(
                (a, b) =>
                    this.pValueFormatter(a.pValue) -
                    this.pValueFormatter(b.pValue)
            );

            return endpoint.data;
        },
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        async checkGeneName(KEY) {
            let gene = await regionUtils.geneSymbol(KEY);

            if (!!gene && gene != KEY) {
                document.getElementById("invalidGeneMessage").innerHTML =
                    "Your search term is an alias name for gene symbol " +
                    gene +
                    ". Please enter a new search term above, or go to the " +
                    gene +
                    " Gene page";

                document
                    .getElementById("invalidGeneRedirect")
                    .setAttribute("href", "/gene.html?gene=" + gene);
                uiUtils.showElement("invalidGeneWarning");
                //uiUtils.showElement("pageSearchHeaderContent");
            }
        },
        filterPhenotype(newFilters) {
            this.phenotypeFilterList = newFilters;
        },
        renderPhewas(REF) {
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            setTimeout(function () {
                refComponent.renderPheWas();
            }, 500);
        },
        async getGTExdata(){
            const dataUrl = "https://cfde.hugeampkpnbi.org/api/bio/query/gtex-tstat?q="+this.$store.state.geneName;
            let contentJson = await fetch(dataUrl).then((resp) => resp.json());
            if (contentJson.error == null) {
                this.GTExData = contentJson.data;
            }
        },
        async getGTExdata2(){
            const dataUrl = "https://bioindex-dev.hugeamp.org/api/bio/query/gene-expression?q="+this.$store.state.geneName;
            let contentJson = await fetch(dataUrl).then((resp) => resp.json());
            if (contentJson.error == null) {
                const filtered = this.checkPreFilters(contentJson.data);
                this.GTExData2 = filtered;
            }
        },
        renderGTEx(REF) {
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            setTimeout(function () {
                refComponent.renderBoxPlot();
            }, 500);
        },
        checkPreFilters(DATA) {
			//Apply pre filters as data gets loaded;
			let returnData = DATA;
            let filters = [
                {
                    "field": "collection",
                    "value": "GTEx",
                    "type": "search"
                }
            ];
            let filterValues = {}
            /*
            filters.map(filter => {
                filterValues[filter.parameter] = this.utils.keyParams[filter.parameter];
            })
            */
            returnData = filterUtils.applyFilters(filters, DATA, filterValues);

			return returnData;
		},
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
