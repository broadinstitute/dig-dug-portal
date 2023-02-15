import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import UniprotReferencesTable from "@/components/UniprotReferencesTable.vue";
import GeneAssociationsTable from "@/components/GeneAssociationsTable";
import GeneAssociationsMasks from "@/components/GeneAssociationsMasks";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import Autocomplete from "@/components/Autocomplete.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import AncestrySelectPicker from "@/components/AncestrySelectPicker";
import TranscriptSelectPicker from "@/components/TranscriptSelectPicker";
import Formatters from "@/utils/formatters";
import VariantSearch from "@/components/VariantSearch";
import keyParams from "@/utils/keyParams";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import HugeScoresTable from "@/components/HugeScoresTable.vue";

import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GenePageCombinedEvidenceTable from "@/components/GenePageCombinedEvidenceTable.vue";

import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue";
import ResultsDashboard from "@/components/NCATS/ResultsDashboard.vue";

import sessionUtils from "@/utils/sessionUtils";
import HugeCalScoreSection from "@/components/HugeCalScoreSection.vue";

import Counter from "@/utils/idCounter";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

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
        UniprotReferencesTable,
        GeneAssociationsTable,
        GeneAssociationsMasks,
        Documentation,
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
        SearchHeaderWrapper,
        ResultsDashboard,
        NCATSPredicateTable,
        VariantSearch,
        ColorBarPlot,
        GenePageCombinedEvidenceTable,
        HugeCalScoreSection,
        HugeScoresTable
    },

    data() {
        return {
            counter: 0,
            genePageSearchCriterion: [],
            externalResources: {
                ensembl: {
                    title: "Ensembl",
                    link:
                        "https://useast.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g="
                },
                hgnc: {
                    title: "HUGO Gene Nomenclature Committee",
                    link:
                        "https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/"
                },
                mgd: {
                    title: "Mouse Genome Database",
                    link: "http://www.informatics.jax.org/marker/"
                },
                rgd: {
                    title: "Rat Genome Database",
                    link: "https://rgd.mcw.edu/rgdweb/report/gene/main.html?id="
                },
                ucsc: {
                    title: "USSC Genome Browser",
                    link:
                        "http://genome.ucsc.edu/cgi-bin/hgGene?db=hg19&hgg_gene="
                },
                uniprot: {
                    title: "Universal Protein Resource",
                    link: "https://www.uniprot.org/uniprot/"
                }
            },

        };
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
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        ...sessionUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        ancestryFormatter: Formatters.ancestryFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        onAncestrySet() {

            let ancestry = this.$store.state.selectedAncestry;

            let sectionWrapper = document.getElementById('common_variants');
            let bubbleCollection = sectionWrapper.querySelectorAll('.filter-pill-collection');
            let bubbleWrapper = document.getElementById('ancestry_set');

            bubbleWrapper.innerHTML = "";

            let ancestryBubble = document.getElementById('ancestry_bubble')
            if (!!ancestryBubble) {
                ancestryBubble.remove();
            }

            let bubble = document.createElement("span");
            bubble.setAttribute("class", "badge btn search-bubble 3 badge-secondary badge-pill");
            bubble.setAttribute("id", "ancestry_bubble");
            bubble.textContent = 'Ancestry = ' + this.ancestryFormatter(ancestry);

            if (!!ancestry && ancestry != undefined) {
                if (bubbleCollection.length > 0) {
                    bubbleCollection[0].append(bubble);
                } else {
                    bubbleWrapper.innerHTML = " Selected Filters:	 ";
                    bubbleWrapper.append(bubble);
                }
            }
        },
        pushCriterionPhenotype(phenotypeName) {
            this.genePageSearchCriterion.push({
                field: "phenotype",
                threshold: phenotypeName
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
                            category: subject
                        },
                        [oid]: {
                            category: object
                        }
                    },
                    edges: {
                        [eid]: {
                            subject: sid,
                            object: oid,
                            predicate: predicate
                        }
                    }
                }
            };
        },

        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (!!r) {
                window.location.href = `./region.html?chr=${r.chromosome
                    }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },

        topPhenotype(topAssocData) {
            return topAssocData[0];
        }
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
        phenotypeOptions() {
            return this.phenotypesInSession
                .filter(x => x.name != this.$store.state.phenotype)
                .map(phenotype => phenotype.name);
        },

        transcriptOr52k() {
            let endpoint = !this.$store.state.selectedTranscript
                ? this.$store.state.associations52k
                : this.$store.state.transcriptAssoc;
            this.$store.state.restricted = endpoint.restricted;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                endpoint.data = sessionUtils.getInSession(endpoint.data, this.phenotypesInSession, 'phenotype');
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


            endpoint.data.sort((a, b) => this.pValueFormatter(a.pValue) - this.pValueFormatter(b.pValue));

            return endpoint.data;
        },

        geneassociations() {
            let data = this.$store.state.geneassociations.data;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(data, this.phenotypesInSession, 'phenotype');
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
            let data = this.$store.state.hugeScores.data;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(data, this.phenotypesInSession, 'phenotype');
            }

            let hugeMap = {};

            for (let i in data) {
                const score = data[i];
                score["group"] = this.$store.state.bioPortal.phenotypeMap[score.phenotype].group;
                let range = data[i].huge >= 350 ? "Compelling" : data[i].huge >= 100 ? "Extreme" : data[i].huge >= 30 ? "Very Strong" : data[i].huge >= 10 ? "Strong" : data[i].huge >= 3 ? "Moderate" : data[i].huge > 1 ? "Anecdotal" : "No Evidence";

                score["range"] = range;

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

        associations52k() {

            let data = this.$store.state.associations52k.data;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(data, this.phenotypesInSession, 'phenotype');
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
                .filter(criterion => criterion.field === "phenotype")
                .map(criterion => phenotypeMap[criterion.threshold]);
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
                    object: "biolink:MolecularActivity"
                })
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
                g => g.source === "alias"
            );
        },

        alternateNames() {
            let geneData = this.$store.state.gene.data;
            return this.$store.state.genes.data
                .filter(g => g.start == geneData[0].start)
                .filter(g => g.end == geneData[0].end)
                .filter(g => g.source !== "symbol")
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

            if (!!r) {
                return `${r.chromosome}:${Formatters.intFormatter(
                    r.start
                )}-${Formatters.intFormatter(r.end)}`;
            } else {
                return "";
            }
        },

        regionTextExpanded() {
            let r = this.region;

            if (!!r) {
                return `${r.chromosome}:${Formatters.intFormatter(
                    r.start - 50000
                )}-${Formatters.intFormatter(r.end + 50000)}`;
            } else {
                return "";
            }
        },

        associationPhenotypes() {
            return this.$store.state.geneassociations.data.map(
                a => a.phenotype
            );
        },

        documentationMap() {
            let symbol = this.geneSymbol;
            let r = this.region;

            if (!!symbol && !!r) {
                return {
                    gene: symbol,
                    region: `${r.chromosome}:${Formatters.intFormatter(
                        r.start
                    )}-${Formatters.intFormatter(r.end)}`
                };
            }
        },

        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        }
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

        selectedPhenotypes(phenotypes, oldPhenotypes) {
            const removedPhenotypes = _.difference(
                oldPhenotypes.map(p => p.name),
                phenotypes.map(p => p.name)
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
            this.hideElement("variangeneSearchHolder");
            this.$store.dispatch("queryGeneRegion", region);
        },

        // the canonical symbol was found
        symbolName(symbol) {
            this.$store.dispatch("queryUniprot", symbol);
            this.$store.dispatch("queryAssociations");
            this.$store.dispatch("getHugeScoresData");
        },
        "$store.state.selectedAncestry"(newAncestry) {
            let geneQuery = !newAncestry ? { q: this.$store.state.geneName } : { q: `${this.$store.state.geneName},${newAncestry}` };
            this.$store.dispatch("geneassociations/query", geneQuery);
        },
        "$store.state.selectedTranscript"(newTranscript) {
            if (!!newTranscript) {
                this.$store.dispatch("transcriptAssoc/query", { q: newTranscript });
            }
        },
        "$store.state.commonVariantsLength"(NUM) {
            this.onAncestrySet();
        },
        "$store.state.geneName"(NAME) {
            this.$store.dispatch("getHugeScoresData");
        }
    }
}).$mount("#app");
