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

import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel";

import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import FilterPValue from "@/components/criterion/FilterPValue.vue"
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue"
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue"

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue"

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
        NCATSPredicateTable
    },

    data() {
        return {
            counter: 0,
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
        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (!!r) {
                window.location.href = `./region.html?chr=${
                    r.chromosome
                }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        }
    },

    computed: {
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

        aliasNames() {
            return this.$store.state.genes.data.filter(
                g => g.source === "alias"
            );
        },

        alternateNames() {
            return this.$store.state.genes.data
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
            return this.$store.getters["uniprot/geneNames"];
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
            let symbol = this.symbolName;
            let r = this.region;

            if (!!symbol && !!r) {
                return {
                    gene: symbol,
                    region: `${r.chromosome}:${Formatters.intFormatter(
                        r.start
                    )}-${Formatters.intFormatter(r.end)}`
                };
            }
        }
    },

    watch: {
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
