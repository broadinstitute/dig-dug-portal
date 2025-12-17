import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import _ from "lodash";

import UniprotReferencesTable from "@/components/UniprotReferencesTable.vue";
import GeneAssociationsTable from "@/components/GeneAssociationsTable";
import GeneAssociationsMasks from "@/components/GeneAssociationsMasks";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker";
import TranscriptSelectPicker from "@/components/TranscriptSelectPicker";
import VariantSearch from "@/components/VariantSearch.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import HugeScoresTable from "@/components/HugeScoresTable.vue";
import ResearchExpressionDisplay from "@/components/researchPortal/ResearchExpressionDisplay.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";
import EffectorGenesSectionOnGene from "@/components/EffectorGenesSectionOnGene.vue";
import MouseSummaryTable from "@/components/MouseSummaryTable.vue";
import ColocusTable from "@/components/ColocusTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import GenePageCombinedEvidenceTable from "@/components/GenePageCombinedEvidenceTable.vue";

import PigeanGean from "@/components/PigeanGean.vue";

import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue";
import ResultsDashboard from "@/components/NCATS/ResultsDashboard.vue";

import sessionUtils from "@/utils/sessionUtils";
import HugeCalScoreSection from "@/components/HugeCalScoreSection.vue";

import Counter from "@/utils/idCounter";
import regionUtils from "@/utils/regionUtils";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import { pageMixin } from "@/mixins/pageMixin.js";

Vue.config.productionTip = false;

new Vue({
    store,
    modules: {},
    components: {
        UniprotReferencesTable,
        GeneAssociationsTable,
        GeneAssociationsMasks,
        Documentation,
        TooltipDocumentation,
        Autocomplete,
        GeneSelectPicker,
        AncestrySelectPicker,
        TranscriptSelectPicker,
        UnauthorizedMessage,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        LocusZoom,
        LocusZoomPhewasPanel,
        ResearchPheWAS,
        ResearchExpressionDisplay,
        ResearchDataTable,
        SearchHeaderWrapper,
        ResultsDashboard,
        NCATSPredicateTable,
        VariantSearch,
        ColorBarPlot,
        GenePageCombinedEvidenceTable,
        HugeCalScoreSection,
        HugeScoresTable,
        EffectorGenesSectionOnGene,
        ResearchSingleSearch,
        MouseSummaryTable,
        ColocusTable,
        PigeanGean,
    },
    mixins: [pageMixin],

    data() {
        return {
            counter: 0,
            genePageSearchCriterion: [],
            phenotypeFilterList: [],
            activeTab: "hugeScorePheWASPlot",
            externalResources: {
                ensembl: {
                    title: "Ensembl",
                    link: "https://useast.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=",
                },
                hgnc: {
                    title: "HUGO Gene Nomenclature Committee",
                    link: "https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/",
                },
                mgd: {
                    title: "Mouse Genome Database",
                    link: "http://www.informatics.jax.org/marker/",
                },
                rgd: {
                    title: "Rat Genome Database",
                    link: "https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=",
                },
                ucsc: {
                    title: "USSC Genome Browser",
                    link: "http://genome.ucsc.edu/cgi-bin/hgGene?db=hg19&hgg_gene=",
                },
                uniprot: {
                    title: "Universal Protein Resource",
                    link: "https://www.uniprot.org/uniprot/",
                },
            },
            noTranscriptDataPortal: ["sleep", "lung", "ndkp", "autoimmune"],
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
        };
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
        ///
        phenotypeOptions() {
            return this.phenotypesInSession
                .filter((x) => x.name != this.$store.state.phenotype)
                .map((phenotype) => phenotype.name);
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
        //filter associations that only exist in the phenotypeMap
        filteredAssociations() {
            return (
                this.geneassociations.filter((row) => {
                    return this.phenotypeMap[row.phenotype];
                }) || []
            );
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

        pigeanGeneData() {
            let data = this.$store.state.pigeanGene.data;
            return data;
        },

        associations52k() {
            let data = this.$store.state.associations52k.data;

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
        geneExpression() {
            let data = this.$store.state.geneExpression.data;
            return data;
        },

        /*smallestpValuePhenotype() {
            // let data = this.$store.state.varassociations.data;
            // let x = data.sort(
            //     (a, b) => a.pValue - b.pValue
            // );

            return "T2D";
        },*/
        selectedPhenotypes() {
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            if (Object.keys(phenotypeMap).length === 0) {
                return [];
            }

            return this.genePageSearchCriterion
                .filter((criterion) => criterion.field === "phenotype")
                .map((criterion) => phenotypeMap[criterion.threshold]);
        },

        selectedPhenotype() {
            if (this.selectedPhenotypes.length > 0) {
                return this.selectedPhenotypes[0].name;
            } else return "T2D";
        },

        queries() {
            return [
                this.biolinkQueryGraph("NCBIGENE:1017", {
                    subject: "biolink:Gene",
                    predicate: "biolink:enables",
                    object: "biolink:MolecularActivity",
                }),
            ];
        },

        region() {
            return this.$store.getters.region;
        },

        symbolName() {
            return this.$store.getters.canonicalSymbol;
        },
        geneSymbol() {
            return this.$store.getters.geneSymbol;
        },

        aliasNames() {
            return this.$store.state.genes.data.filter(
                (g) => g.source === "alias"
            );
        },

        alternateNames() {
            let geneData = this.$store.state.gene.data;
            return this.$store.state.genes.data
                .filter((g) => g.start == geneData[0].start)
                .filter((g) => g.end == geneData[0].end)
                .filter((g) => g.source !== "symbol")
                .sort((a, b) => {
                    if (a.source < b.source) return -1;
                    if (a.source > b.source) return 1;
                    return 0;
                });
        },

        dbReference() {
            return this.$store.getters["uniprot/dbReference"] || [];
        },

        accession() {
            return this.$store.getters["uniprot/accession"] || [];
        },

        geneFunction() {
            return this.$store.getters["uniprot/geneFunction"] || "";
        },

        geneNames() {
            return this.$store.getters["uniprot/geneNames"] || [];
        },

        gene() {
            let data = this.$store.state.gene.data;
            if (data.length > 0) {
                return data[0];
            }
            return {};
        },

        regionText() {
            let r = this.region;

            if (r) {
                return `${r.chromosome}:${Formatters.intFormatter(
                    r.start
                )}-${Formatters.intFormatter(r.end)}`;
            } else {
                return "";
            }
        },

        regionTextExpanded() {
            let r = this.region;

            if (r) {
                return `${r.chromosome}:${Formatters.intFormatter(
                    r.start - 50000
                )}-${Formatters.intFormatter(r.end + 50000)}`;
            } else {
                return "";
            }
        },

        associationPhenotypes() {
            return this.$store.state.geneassociations.data.map(
                (a) => a.phenotype
            );
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

        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
    },

    watch: {
        geneassociations(newData, oldData) {
            let topPhenotype = "LDL";
            if (newData.length > 0) {
                topPhenotype = newData[0].phenotype;
                if (this.genePageSearchCriterion[0] != topPhenotype) {
                    this.genePageSearchCriterion = [];
                }
                this.pushCriterionPhenotype(topPhenotype);

                this.$store.dispatch("getVarAssociationsData", topPhenotype);
            }
        },
        geneExpressionTable() {
            console.log(this.geneExpressionTable);
        },

        selectedPhenotypes(phenotypes, oldPhenotypes) {
            const removedPhenotypes = _.difference(
                oldPhenotypes.map((p) => p.name),
                phenotypes.map((p) => p.name)
            );
            this.$store.dispatch("get52KAssociationData");
            if (removedPhenotypes.length > 0) {
                this.$store.dispatch(
                    "getVarAssociationsData",
                    phenotypes[0].name
                );
            }
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        // the region for the gene was found
        region(region) {
            if (region) {
                //uiUtils.hideElement("pageSearchHeaderContent");
                this.$store.dispatch("queryGeneRegion", region);
            }
        },

        // the canonical symbol was found
        symbolName(symbol) {
            this.$store.dispatch("queryUniprot", symbol);
            this.$store.dispatch("queryAssociations");
            this.$store.dispatch("getHugeScoresData");
            this.$store.dispatch("getPigeanGeneData");
            this.$store.dispatch("getMouseData");
        },
        "$store.state.selectedAncestry"(newAncestry) {
            let geneQuery = !newAncestry
                ? { q: this.$store.state.geneName }
                : { q: `${this.$store.state.geneName},${newAncestry}` };
            this.$store.dispatch("geneassociations/query", geneQuery);
        },
        "$store.state.selectedTranscript"(newTranscript) {
            if (newTranscript) {
                this.$store.dispatch("transcriptAssoc/query", {
                    q: newTranscript,
                });
            }
        },
        "$store.state.geneName"(NAME) {
            this.$store.dispatch("getHugeScoresData");
            this.$store.dispatch("getPigeanGeneData");
        },
    },

    created() {
        /// disease systems
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        ////
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        // this.$store.dispatch("queryAliasName", this.$store.state.aliasName)
        //this.$store.dispatch("queryAssociations");
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.pushCriterionPhenotype("T2D");
        this.checkGeneName(this.$store.state.geneName);
    },

    methods: {
        ...uiUtils,
        ...sessionUtils,
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

        hideGeneWarning() {
            uiUtils.hideElement("invalidGeneWarning");
        },

        pushCriterionPhenotype(phenotypeName) {
            this.genePageSearchCriterion.push({
                field: "phenotype",
                threshold: phenotypeName,
            });
        },
        biolinkQueryGraph(subjectCurie, { subject, predicate, object }) {
            const uuid = Counter.getUniqueId;
            const sid = uuid("s");
            const oid = uuid("o");
            const eid = uuid("e");
            return {
                query_graph: {
                    nodes: {
                        [sid]: {
                            id: subjectCurie,
                            category: subject,
                        },
                        [oid]: {
                            category: object,
                        },
                    },
                    edges: {
                        [eid]: {
                            subject: sid,
                            object: oid,
                            predicate: predicate,
                        },
                    },
                },
            };
        },

        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (r) {
                window.location.href = `./region.html?chr=${r.chromosome
                    }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },

        topPhenotype(topAssocData) {
            return topAssocData[0];
        },
        renderPhewas(REF) {
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            setTimeout(function () {
                refComponent.renderPheWas();
            }, 500);
        },
        filterPhenotype(newFilters) {
            this.phenotypeFilterList = newFilters;
        },
        clearCriterion(criterion) {
            if (criterion === "transcript") {
                this.$store.state.selectedTranscript = "";
                return;
            }
            if (criterion === "ancestry") {
                this.$store.state.selectedAncestry = "";
                return;
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
