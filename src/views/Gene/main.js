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
import Formatters from "@/utils/formatters";
import VariantSearch from "@/components/VariantSearch";
import keyParams from "@/utils/keyParams";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";

import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GenePageCombinedEvidenceTable from "@/components/GenePageCombinedEvidenceTable.vue";


import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue"
import ResultsDashboard from "@/components/NCATS/ResultsDashboard.vue"

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
        UnauthorizedMessage,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        LocusZoom,
        LocusZoomPhewasPanel,
        SearchHeaderWrapper,
        ResultsDashboard,
        NCATSPredicateTable,
        VariantSearch,
        ColorBarPlot,
        GenePageCombinedEvidenceTable,
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
            }
        };
    },

    created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        // this.$store.dispatch("queryAliasName", this.$store.state.aliasName)
        //this.$store.dispatch("queryAssociations");
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");

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
        biolinkQueryGraph(subjectCurie, { subject, predicate, object }) {
            const uuid = Counter.getUniqueId;
            const sid = uuid('s');
            const oid = uuid('o');
            const eid = uuid('e')
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
                            predicate: predicate,
                        }
                    }
                }
            }
        },
        determineCategory(bayesfactor) {
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
        },
        bayesFactorCombinedEvidence(commonBF, rareBF) {
            let combinedbf = commonBF * rareBF;
            return Number.parseFloat(combinedbf).toFixed(2);
        },

        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (!!r) {
                window.location.href = `./region.html?chr=${
                    r.chromosome
                    }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },

    },

    computed: {
        selectedPhenotypes() {
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            if (Object.keys(phenotypeMap).length === 0) {
                return [];
            }

            return this.genePageSearchCriterion
                .filter(criterion => criterion.field === "phenotype")
                .map(criterion => phenotypeMap[criterion.threshold]);
        },

        combinedScore() {
            return 250
            //return this.bayesFactorRareVariation * this.bayesFactorCommonVariation;
        },

        bayesFactorRareVariation() {
            let masks = [];
            let rarebayesfactor = 1;
            let beta;
            let stdErr;
            if (
                this.isExomeWideSignificant(
                    this.$store.state.geneAssociations52k.data,
                    this.selectedPhenotype[0]
                )
            ) {
                rarebayesfactor = 348;
            } else {
                if (this.$store.state.geneAssociations52k.data.length > 0) {
                    for (
                        let i = 0;
                        i < this.$store.state.geneAssociations52k.data.length;
                        i++
                    ) {
                        if (
                            !!this.$store.state.geneAssociations52k.data[i]
                                .phenotype &&
                            this.$store.state.geneAssociations52k.data[i]
                                .phenotype == this.selectedPhenotype[0]
                        ) {
                            //filter with selected phenotype
                            masks = this.$store.state.geneAssociations52k.data[
                                i
                            ].masks;
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
        },
        bayesFactorCommonVariation() {
            let firstBF = 1;
            let secondBF = 1;
            let thirdBF = 1;
            let commonBF = 1;
            let data = this.$store.state.associations.data;
            if (!!data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    //if GWAS evidence
                    if (data[i].phenotype == this.selectedPhenotype[0]) {
                        if (data[i].pValue <= 5e-8) {
                            firstBF = 3;
                            if (!!this.eglData) {
                                if (
                                    !!this.eglData.genetic &&
                                    this.eglData.genetic == "1C"
                                ) {
                                    secondBF = 117;
                                }
                                if (
                                    !!this.eglData.genetic &&
                                    this.eglData.genetic == "2C"
                                ) {
                                    secondBF = 5;
                                }
                                if (
                                    !!this.eglData.genomic &&
                                    this.eglData.genomic == "2R"
                                ) {
                                    thirdBF = 5;
                                }
                                if (
                                    !!this.eglData.genomic &&
                                    this.eglData.genomic == "3R"
                                ) {
                                    thirdBF = 2.2;
                                }
                            }
                        }
                    }
                }
            }

            commonBF = firstBF * secondBF * thirdBF;
            return Number.parseFloat(commonBF).toFixed(2);
        },

        queries() {
            return [
                // this.biolinkQueryGraph("NCBIGENE:1017", {
                //     subject: "biolink:Gene",
                //     predicate: "biolink:participates_in",
                //     object: "biolink:Pathway",
                // }),
                // // this.biolinkQueryGraph('NCBIGENE:1017', {
                // //     subject: 'biolink:Gene',
                // //     predicate: 'biolink:participates_in',
                // //     object: 'biolink:BiologicalProcess',
                // // }),
                // // this.biolinkQueryGraph('NCBIGENE:1017', {
                // //     subject: 'biolink:Gene',
                // //     predicate: 'biolink:expressed_in',
                // //     object: 'biolink:CellularComponent',
                // // }),
                this.biolinkQueryGraph('NCBIGENE:1017', {
                    subject: 'biolink:Gene',
                    predicate: 'biolink:enables',
                    object: 'biolink:MolecularActivity',
                })
            ]
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
        // alternativeNames() {
        //     let geneData = this.$store.state.gene.data
        //     let data = this.$store.state.genes.data
        //     let aliases = []
        //     for (let i in data) {
        //         if (data[i].chromosome == geneData[0].chromosome && data[i].start == geneData[0].start && data[i].end == geneData[0].end) {
        //             if (data[i].source === "alias") {
        //                 aliases.push(data[i].name);
        //             }
        //         }

        //     }
        //     return aliases;
        // },

        alternateNames() {
            let geneData = this.$store.state.gene.data
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
            return this.$store.getters["uniprot/dbReference"];
        },

        accession() {
            return this.$store.getters["uniprot/accession"];
        },

        geneFunction() {
            return this.$store.getters["uniprot/geneFunction"];
        },

        geneNames() {
            let x = this.$store.getters["uniprot/geneNames"];
            return x;
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
            return this.$store.state.associations.data.map(a => a.phenotype);
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
        selectedPhenotypes(phenotypes, oldPhenotypes) {
            const removedPhenotypes = _.difference(
                oldPhenotypes.map(p => p.name),
                phenotypes.map(p => p.name)
            );
            // if (removedPhenotypes.length > 0) {
            //     removedPhenotypes.forEach(removedPhenotype => {
            //         delete this.pageAssociationsMap[removedPhenotype];
            //         this.pageAssociations = Object.entries(
            //             this.pageAssociationsMap
            //         ).flatMap(pam => pam[1]);
            //     });
            // }
            keyParams.set({ phenotype: phenotypes.map(p => p.name).join(",") });
            //console.log("current phenotypes",phenotypes)

            // // reload the global enrichment for these phenotypes
            // this.$store.dispatch("globalEnrichment/clear");
            // phenotypes.forEach(p => {
            //     this.$store.dispatch("globalEnrichment/query", {
            //         q: p.name,
            //         append: true
            //     });
            // });
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
        }
    }
}).$mount("#app");
