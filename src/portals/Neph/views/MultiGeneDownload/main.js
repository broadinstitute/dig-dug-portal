import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";

import MultiGeneDownloadForm from "@/portals/Neph/components/MultiGeneDownloadForm";

import sessionUtils from "@/utils/sessionUtils";



import Counter from "@/utils/idCounter";
import regionUtils from "@/utils/regionUtils";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import pigeanUtils from "@/utils/pigeanUtils.js";

import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

//import {SignIn,CheckSignInStatus} from "@/portals/Neph/components/LoginComponent.js";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        Alert,
        Documentation,
        Autocomplete,
        GeneSelectPicker,
        UnauthorizedMessage,
        MultiGeneDownloadForm,
        SearchHeaderWrapper,
    },

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
        pigeanMap(){
            console.log("get pigeanMap");
            console.log(this.pigeanPhenotypeMap);
            return this.pigeanPhenotypeMap;
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
                // helen disable phenotype filter
                /*
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }*/

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
                // helen block phenotype filter by group
                /*if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                } */

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
            console.log("filteredAssociations");
            console.log(this.pigeanMap);
            console.log(this.geneassociations);

            let pigeanMap = this.pigeanMap;
            if(!pigeanMap){
                pigeanMap = this.pigeanPhenotypeMap;
            }
            let filteredPhenotypes = pigeanMap;
            return (
                this.geneassociations.filter((row) => {
                    //console.log(row.phenotype);
                    //return this.phenotypeMap[row.phenotype];
                    return filteredPhenotypes[row.phenotype];
                }) || []
            );
        },
        hugeScores() {
            console.log("calculate huge Scores");
            console.log(this.$store.state.hugeScores.data);
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
            console.log("calculate huge Scores 2");
            console.log(data);
            console.log(this.pigeanMap);
            console.log(this.pigeanPhenotypeMap);
            let pigeanMap = [];
            if(this.pigeanMap){
                pigeanMap = this.pigeanMap;
            } else{
                if(this.pigeanPhenotypeMap){
                    pigeanMap = this.pigeanPhenotypeMap;
                }
            }
            
            let hugeMap = {};

            for (let i in data) {
                const score = data[i];
                //let phenotypeEntity =
                //    this.$store.state.bioPortal.phenotypeMap[score.phenotype];
                
                //let phenotypeEntity = this.pigeanMap[score.phenotype];
                let phenotypeEntity = pigeanMap[score.phenotype];
                score["group"] = phenotypeEntity
                    ? phenotypeEntity.group
                    : "No group info";
                score["renderScore"] = Math.log(data[i].huge);
                //console.log(score);
                // skip associations not part of the disease group
                //if (!this.phenotypeMap[score.phenotype]) {
                //if(!this.pigeanMap[score.phenotype]) {
                if(!pigeanMap[score.phenotype]) {
                    continue;
                }

                hugeMap[score.phenotype] = score;
            }
            
            // convert to an array, sorted by p-value
            let x = Object.values(hugeMap);
            console.log("calculate huge score end");
            console.log(hugeMap);
            return x;
        },

        associations52k() {
            //return this.$store.state.associations52k_private.data;
            console.log("get private association52k");
            let data = this.$store.state.associations52k_private.data;
            console.log(this.phenotypesInSession);
            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }
            console.log(data);
            
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
            console.log(assocMap);
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
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        diseaseGroup() {
            //console.log("diseaseGroup:");
            //console.log(this.$store.getters["bioPortal/diseaseGroup"]);
            return this.$store.getters["bioPortal/diseaseGroup"];
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
        },

        phenotypeMap() {
            /*console.log("phenotypeMap");
            console.log(this.$store.state.bioPortal.phenotypeMap);
            return this.$store.state.bioPortal.phenotypeMap;*/
            return this.$store.state.HPOTerms;
        },
    },

    watch: {
        geneassociations(newData, oldData) {
            //console.log("geneassociations");
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
            //console.log("diseaseGroup");
            //console.log(group);
            //if(group){
                this.$store.dispatch("kp4cd/getFrontContents", group.name);
            //} else {
                //this.$store.dispatch("kp4cd/getFrontContents", "md");
            //}
            
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
        },
    },

    async created() {
        //this.CheckSignInStatus();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");

        /// disease systems
        /*this.$store.dispatch("bioPortal/getDiseaseSystems");

        await this.$store.dispatch("getPigeanPhenotypes");
        //this.$store.dispatch("getPigeanPhenotypes");
        console.log('created pigean phenotypes');
        console.log(this.$store.state.pigeanAllPhenotypes.data);
        this.pigeanPhenotypeMap = pigeanUtils.mapPhenotypes(this.$store.state.pigeanAllPhenotypes.data);
        console.log(this.pigeanPhenotypeMap);
        console.log(this.pigeanMap);

        ////
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        // this.$store.dispatch("queryAliasName", this.$store.state.aliasName)
        //this.$store.dispatch("queryAssociations");        
        
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        
        //helen
        //this.$store.dispatch("getHugeScoresData");
        
        this.pushCriterionPhenotype("T2D");
        this.checkGeneName(this.$store.state.geneName); */
        
    },

    methods: {
        ...uiUtils,
        ...sessionUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        //CheckSignInStatus,
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
                window.location.href = `./region.html?chr=${
                    r.chromosome
                }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },

        topPhenotype(topAssocData) {
            return topAssocData[0];
        },
        renderPhewas(REF) {
            console.log(REF);
            console.log(this.$store.state.hugeScores.data.length);
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            console.log("canvasId:");
            console.log(this.$children[0]);
            setTimeout(function () {
                refComponent.renderPheWas();
            }, 500);
        },
        filterPhenotype(newFilters) {
            //console.log("filterPhenotype");
            //console.log(newFilters);
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
