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

import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GenePageCombinedEvidenceTable from "@/components/GenePageCombinedEvidenceTable.vue";

import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue";
import ResultsDashboard from "@/components/NCATS/ResultsDashboard.vue";

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
        HugeCalScoreSection
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
        /*bayes_factor(beta, stdErr) {
            let w = this.$store.state.prior;
            let v = Math.pow(stdErr, 2);
            let f1 = v / (v + w);
            let sqrt_f1 = Math.sqrt(f1);
            let f2 = w * Math.pow(beta, 2);
            let f3 = 2 * v * (v + w);
            let f4 = f2 / f3;
            let bayes_factor = sqrt_f1 * Math.exp(f4);
            return bayes_factor;
        },*/
        /*determineCategory(bayesfactor) {
            let category;
            if (bayesfactor <= 1) {
                category = "No";
            }
            if (bayesfactor > 1 && bayesfactor < 3) {
                category = "Anecdotal";
            } else if (bayesfactor >= 3 && bayesfactor < 10) {
                category = "Moderate";
            } else if (bayesfactor >= 10 && bayesfactor < 30) {
                category = "Strong";
            } else if (bayesfactor >= 30 && bayesfactor < 100) {
                category = "Very Strong";
            } else if (bayesfactor >= 100 && bayesfactor < 350) {
                category = "Extreme";
            } else if (bayesfactor >= 350) {
                category = "Compelling";
            }
            return category;
        },*/
        /*isGWASSignificantAssociation(data, selectedPhenotype) {
            if (!!data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == selectedPhenotype) {
                        if (data[i].pValue <= 5e-8) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },*/
        /*bayesFactorCombinedEvidence(commonBF, rareBF) {
            let combinedbf = commonBF * rareBF;
            return Number.parseFloat(combinedbf).toFixed(2);
        },*/

        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (!!r) {
                window.location.href = `./region.html?chr=${r.chromosome
                    }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },
        /*isExomeWideSignificant(data, trait) {
            if (!!data.length) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == trait) {
                        if (data[i].pValue <= 2.5e-6) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },*/
        topPhenotype(topAssocData) {
            return topAssocData[0];
        }
    },

    computed: {

        phenotypeOptions() {
            return this.$store.state.bioPortal.phenotypes
                .filter(x => x.name != this.$store.state.phenotype)
                .map(phenotype => phenotype.name);
        },

        transcriptOr52k() {
            let endpoint = !this.$store.state.selectedTranscript
                ? this.$store.state.associations52k
                : this.$store.state.transcriptAssoc;
            this.$store.state.restricted = endpoint.restricted;
            endpoint.data.sort((a, b) => this.pValueFormatter(a.pValue) - this.pValueFormatter(b.pValue));
            return endpoint.data;
        },

        geneassociations() {
            let data = this.$store.state.geneassociations.data;
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

        smallestpValuePhenotype() {
            // let data = this.$store.state.varassociations.data;
            // let x = data.sort(
            //     (a, b) => a.pValue - b.pValue
            // );

            return "T2D";
        },
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
        /*eglData() {
            let geneSymbol = this.$store.state.geneName;
            if (this.selectedPhenotype == "T2D") {
                if (!!this.$store.state.kp4cd.eglData.data) {
                    let effectordata = this.$store.state.kp4cd.eglData.data;
                    let effectorGeneData = {};

                    for (var i = 0; i < effectordata.length; ++i) {
                        if (
                            effectordata[i].gene.toLowerCase() ===
                            geneSymbol.toLowerCase()
                        ) {
                            effectorGeneData = effectordata[i];
                            if (effectorGeneData.category == "(T2D_related)") {
                                effectorGeneData.category = "No Evidence";
                            }
                            break;
                        }
                        //if the gene is in GWAS but not in mccarthy data
                    }
                    return effectorGeneData;
                }
            } else {
                return { category: "in GWAS" };
            }
        },*/

        /*combinedScore() {
            return (
                this.bayesFactorCommonVariation * this.bayesFactorRareVariation
            );
        },*/

        /*bayesFactorRareVariation() {
            let masks = [];
            let rarebayesfactor = 1;
            let beta;
            let stdErr;
            let selectedPhenotype = "";
            if (this.selectedPhenotypes.length > 0) {
                selectedPhenotype = this.selectedPhenotypes[0].name;
            }

            let data = this.$store.state.associations52k.data;
            if (this.isExomeWideSignificant(data, selectedPhenotype)) {
                rarebayesfactor = 348;
            } else {
                if (data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                        if (
                            !!this.$store.state.associations52k.data[i]
                                .phenotype &&
                            this.$store.state.associations52k.data[i]
                                .phenotype == selectedPhenotype
                        ) {
                            //filter with selected phenotype
                            masks = data[i].masks;
                            if (!!masks && masks.length > 0) {
                                let d = masks.sort(
                                    (a, b) => a.pValue - b.pValue
                                );
                                let mostSignificantMask = d[0];
                                stdErr = mostSignificantMask.stdErr;
                                beta = mostSignificantMask.beta;
                                rarebayesfactor = this.bayes_factor(
                                    beta,
                                    stdErr
                                );
                            }
                            if (rarebayesfactor < 1) {
                                rarebayesfactor = 1;
                            }
                            return Number.parseFloat(rarebayesfactor).toFixed(
                                2
                            );
                        }
                        //if phenotype doesn't exist in 52K Associations data
                        else {
                            rarebayesfactor = 1;
                        }
                    }
                }
            }

            return Number.parseFloat(rarebayesfactor).toFixed(2);
        },*/

        /*bayesFactorCommonVariation() {
            let commonBF = 1;
            let data = [];
            let selectedPhenotype = "";
            let selectGene = this.$store.state.geneName;
            if (this.selectedPhenotypes.length > 0) {
                selectedPhenotype = this.selectedPhenotypes[0].name;
            }
            data = this.$store.state.varassociations.data;
            if (data.length > 0) {
                //let data = this.$store.state.associations.data;
                let coding_variants = {
                    transcript_ablation: "HIGH",
                    splice_acceptor_variant: "HIGH",
                    splice_donor_variant: "HIGH",
                    stop_gained: "HIGH",
                    frameshift_variant: "HIGH",
                    stop_lost: "HIGH",
                    start_lost: "HIGH",
                    transcript_amplification: "HIGH",
                    inframe_insertion: "MODERATE",
                    inframe_deletion: "MODERATE",
                    missense_variant: "MODERATE",
                    protein_altering_variant: "MODERATE"
                };
                data.sort(function (a, b) {
                    return a.pValue - b.pValue;
                });
                let topVariant = data[0];
                let topVariant_consequence = topVariant.consequence;
                let genesInARegion = this.$store.state.genes.data;
                var filteredGenesInARegion = genesInARegion.filter(
                    a => a.source == "symbol"
                );
                let distance = 0;
                //calculate the distance of topVariant to each gene and find the smallest distance
                filteredGenesInARegion.forEach(function (geneinregion) {
                    let distanceFromStart =
                        topVariant.position - geneinregion.start;
                    let distanceFromEnd =
                        topVariant.position - geneinregion.end;
                    if (distanceFromStart * distanceFromEnd > 0) {
                        distance = Math.min(
                            Math.abs(distanceFromStart),
                            Math.abs(distanceFromEnd)
                        );
                        geneinregion["distance"] = distance;
                    } else {
                        distance = 0;
                        geneinregion["distance"] = distance;
                    }
                });

                filteredGenesInARegion.sort(function (a, b) {
                    return a.distance - b.distance;
                });
                let lowestPvalueClosestGene = filteredGenesInARegion[0];

                //find lowest p - value, is it closest gene - TO DO

                data.forEach(function (eachSNP) {
                    if (coding_variants.hasOwnProperty(eachSNP.consequence)) {
                        if (eachSNP.pValue < 5e-8) {
                            commonBF = 20;
                            return commonBF;
                        }
                    }
                });
                //if NOT GWAS significant
                if (
                    !this.isGWASSignificantAssociation(data, selectedPhenotype)
                ) {
                    commonBF = 1;
                    console.log("gene is not GWAS significant");
                }
                //if  GWAS significant
                else {
                    //if top variant is coding and the impact of that coding variant is high or moderate
                    if (
                        coding_variants.hasOwnProperty(topVariant_consequence)
                    ) {
                        if (
                            coding_variants[topVariant_consequence] == "HIGH" ||
                            "MODERATE"
                        ) {
                            //you HAVE TP CHECK IF IT IS SAME GENE - TO DO
                            commonBF = 360;
                        }
                    } else if (lowestPvalueClosestGene.name == selectGene) {
                        commonBF = 45;
                        console.log(
                            lowestPvalueClosestGene,
                            "lowestPvalueClosestGene"
                        );
                    } else {
                        commonBF = 3;
                    }
                }
            }

            return commonBF;
        },*/

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
                console.log("top-phenotype", topPhenotype);
                if (this.genePageSearchCriterion[0] != topPhenotype) {
                    this.genePageSearchCriterion = [];
                }
                this.pushCriterionPhenotype(topPhenotype);

                this.$store.dispatch("getVarAssociationsData", topPhenotype);

                //this.$store.dispatch("getEGLData");
            }

            //this.pushCriterionPhenotype(newTopPhenotype)
            // if (removedPhenotypes.length > 0) {
            //     this.$store.dispatch("getVarAssociationsData", newTopPhenotype);
            // }
            // this.$store.dispatch("getEGLData");
        },

        selectedPhenotypes(phenotypes, oldPhenotypes) {
            console.log("selectedPhenotypes", phenotypes, oldPhenotypes);
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
            //this.$store.dispatch("getEGLData");
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
        }
    }
}).$mount("#app");
