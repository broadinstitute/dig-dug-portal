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
import VariantSearch from "@/portals/Radiant/components/VariantSearch";
import keyParams from "@/utils/keyParams";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";

import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";

import NCATSPredicateTable from "@/components/NCATS/old/PredicateTable.vue";
import ResultsDashboard from "@/components/NCATS/ResultsDashboard.vue";

import Counter from "@/utils/idCounter";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
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
    },

    data() {
        return {
            counter: 0,
            genePageSearchCriterion: [],
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
                opentargets: {
                    title: "Open Targets",
                    link: "https://genetics.opentargets.org/Gene/",
                },
            },
        };
    },

    computed: {
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
                .filter((criterion) => criterion.field === "phenotype")
                .map((criterion) => phenotypeMap[criterion.threshold]);
        },

        selectedPhenotype() {
            if (this.selectedPhenotypes.length > 0) {
                return this.selectedPhenotypes[0].name;
            } else return "T2D";
        },
        eglData() {
            let geneSymbol = this.$store.state.geneName;
            if (this.selectedPhenotype == "T2D") {
                if (this.$store.state.kp4cd.eglData.data) {
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
            if (geneData.length > 0) {
                return this.$store.state.genes.data
                    .filter((g) => g.start == geneData[0].start)
                    .filter((g) => g.end == geneData[0].end)
                    .filter((g) => g.source !== "symbol")
                    .sort((a, b) => {
                        if (a.source < b.source) return -1;
                        if (a.source > b.source) return 1;
                        return 0;
                    });
            } else {
                return [];
            }
        },
        ensemblElement() {
            return (
                this.alternateNames.find((name) => name.source === "ensembl") ||
                {}
            );
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

        documentationMap() {
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
            return this.$store.state.bioPortal.phenotypeMap;
        },
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

        // selectedPhenotypes(phenotypes, oldPhenotypes) {
        //     const removedPhenotypes = _.difference(
        //         oldPhenotypes.map(p => p.name),
        //         phenotypes.map(p => p.name)
        //     );
        //     this.$store.dispatch("get52KAssociationData");
        //     if (removedPhenotypes.length > 0) {
        //         this.$store.dispatch(
        //             "getVarAssociationsData",
        //             phenotypes[0].name
        //         );
        //     }
        //     this.$store.dispatch("getEGLData");
        // },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        // the region for the gene was found
        region(region) {
            if (region) {
                uiUtils.hideElement("pageSearchHeaderContent");
                this.$store.dispatch("queryGeneRegion", region);
            }
        },

        // the canonical symbol was found
        symbolName(symbol) {
            this.$store.dispatch("queryUniprot", symbol);
            this.$store.dispatch("queryAssociations");
        },
    },

    created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        // this.$store.dispatch("queryAliasName", this.$store.state.aliasName)
        //this.$store.dispatch("queryAssociations");
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");

        this.pushCriterionPhenotype("T2D");
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
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
        isExomeWideSignificant(data, trait) {
            if (data.length) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == trait) {
                        if (data[i].pValue <= 2.5e-6) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        topPhenotype(topAssocData) {
            return topAssocData[0];
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
