import Vue from "vue";

import Template from "./Template.vue";
import store from "./store.js";
import LzPlot from "@/components/lz/beta/LzPlot"
import LzAssociations from "@/components/lz/beta/LzAssociationsPanel"

import lzConfiguration from "@/components/lz/beta/lzConfiguration"

Vue.config.productionTip = false;
const HUMAN_GENOME_BUILD_VERSION = "GRCh37";

new Vue({
    store,
    components: {
        LzPlot,
        LzAssociations
    },

    async created() {
    },

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            geneLayout: {
                responsive_resize: "width",
                max_region_scale: 500000, // without this, zooming out will fail (circa LocusZoom v0.13.1)
                // state: {
                //     chr: this.chr,
                //     start: this.start,
                //     end: this.end,
                // },
                // toolbar: {
                //     // top-to-bottom in the array => right-to-left on the layout
                //     widgets,
                // },
            },
            // LocusZoom.Layouts.get("panel", "genes", {
            //     height: 200,
            //     min_height: 200,
            //     // bottom section
            //     y_index: 3,
            // }),
            dataSources: Object.entries({
                // "assoc": ["AssociationLZ", { url: "https://portaldev.sph.umich.edu/api/v1/statistic/single/", params: { source: 45, id_field: "variant" } }],
                catalog: [
                    "GwasCatalogLZ",
                    {
                        _enableCache: false,
                        url:
                            "https://portaldev.sph.umich.edu/api/v1/annotation/gwascatalog/results/?decompose=1&variant_format=colons",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
                gene: [
                    "GeneLZ",
                    {
                        url: "https://portaldev.sph.umich.edu/api/v1/genes/",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
                ld: [
                    "LDLZ2",
                    {
                        url: "https://portaldev.sph.umich.edu/ld/",
                        params: {
                            source: "1000G",
                            build: HUMAN_GENOME_BUILD_VERSION,
                            population: "ALL",
                        },
                    },
                ],
                recomb: [
                    "RecombLZ",
                    {
                        url:
                            "https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
                constraint: [
                    "GeneConstraintLZ",
                    {
                        url: "https://gnomad.broadinstitute.org/api",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
            }),
        }
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.queries.push(
            trapi.makeQueryGraph("NCBIGENE:1017", {
                subject: "biolink:Gene",
                predicate:"biolink:gene_associated_with_condition",
                object: "biolink:Disease",
            }),
            // trapi.makeQueryGraph("NCBIGENE:1017", {
            //     subject: "biolink:Gene",
            //     predicate: "biolink:participates_in",
            //     object: "biolink:Pathway",
            // }),
            // trapi.makeQueryGraph('NCBIGENE:1017', {
            //     subject: 'biolink:Gene',
            //     predicate: 'biolink:participates_in',
            //     object: 'biolink:BiologicalProcess',
            // }),
            // trapi.makeQueryGraph('NCBIGENE:1017', {
            //     subject: 'biolink:Gene',
            //     predicate: 'biolink:expressed_in',
            //     object: 'biolink:CellularComponent',
            // }),
            // trapi.makeQueryGraph('NCBIGENE:1017', {
            //     subject: 'biolink:Gene',
            //     predicate: 'biolink:enables',
            //     object: 'biolink:MolecularActivity',
            // })
        );
        
    },
    async mounted() {
    },
    methods: {
        tap() {
            console.log(arguments)
        }
    },

    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        pageInfo() {
            let contents = this.$store.state.kp4cd.pageInfo;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },

        associationOptions() {
            return !!this.biolinkModel ? 
                Object.keys(this.biolinkModel.classes).filter(cls => this.biolinkModel.classes[cls].is_a === 'association')
            : [];
        },

        slotsForAssociation() {
            const maybeCurrentAssociation = this.queryGraphCriterion.filter(criterion => criterion.field === 'association');
            if (!!maybeCurrentAssociation[0]) {
                if (!!this.biolinkModel) {
                    const { slot_usage: { subject, object } } = this.biolinkModel.classes[maybeCurrentAssociation[0].threshold];
                    console.log(this.biolinkModel.classes[maybeCurrentAssociation[0].threshold])
                    console.log(subject, object)
                    return { subject, object };
                }
            }
            return null;
        },

    },
    methods: {
        curieLabel: trapi.normalize.curieLabel,
        curieForGene: trapi.normalize.curieForGene,
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },
        biolinkQueryGraph: trapi.makeQueryGraph,
        async makeDiseaseToPhenotypeQuery(diseaseCurie) {
            this.diseaseToPhenotypeQuery = trapi.makeQueryGraph(diseaseCurie, {
                subject: 'biolink:Disease',
                object: 'biolink:Phenotype',
                predicate: 'biolink:disease_to_exposure_event_association'
            })
        },
        async makeGeneToDiseaseQuery(geneSymbol) {
            const geneCurie = await this.curieForGene(geneSymbol)
            this.geneToDiseaseQuery = trapi.makeQueryGraph(geneCurie, {
                subject: "biolink:Gene",
                object: "biolink:Disease",
                predicate:"biolink:gene_associated_with_condition"
            });
        },
        async makeGeneToPathwayQuery(geneSymbol) {
            const geneCurie = await this.curieForGene(geneSymbol)
            let geneToPathwayQuery = trapi.makeQueryGraph(geneCurie, {
                subject: "biolink:Gene",
                object: "biolink:Pathway",
                predicate:"biolink:participates_in"
            });
            return geneToPathwayQuery
        },
        predicatePlacement(identifier, query_graph, edge=null) {

            const subjectOrObjectOfEdge = (identifier, edge) => {
                const { subject, object } = query_graph.edges[edge];
                if (identifier === subject) return "subject";
                else if (identifier === object) return "object";
                return null;
            }

            if (edge !== null) {
                return subjectOrObjectOfEdge(identifier, edge);
            } else {
                return Object.entries(query_graph.edges)
                        .reduce((acc, edgeEntry) => {
                            const _acc = acc;
                            const [edgeId, edge] = edgeEntry;
                            _acc[edgeId] = subjectOrObjectOfEdge(edge);
                            return acc;
                        }, {});
            };

        },
        conceptType(identifier, query_graph) {
            const concepts = { ...query_graph.nodes, ...query_graph.edges };
            return concepts[identifier].category || concepts[identifier].predicate;
        },
    },
    watch: {
        geneToDiseaseQueryCriterion: {
            handler: function(newCriterion, oldCriterion) {
                if (!!newCriterion[0]) {
                    const geneSymbol = newCriterion[0].threshold;
                    this.makeGeneToDiseaseQuery(geneSymbol);
                }
            },
            deep: true,
        },
        diseaseToPhenotypeQueryCriterion: {
            handler: function(newCriterion, oldCriterion) {
                if (!!newCriterion[0]) {
                    const disease = newCriterion[0].threshold;
                    this.makeDiseaseToPhenotypeQuery(disease);
                }
            },
            deep: true,
        },
        queryGraph(queryGraph) {
            if (queryGraph !== null) trapi.queries.updateResultsForSources({ "message": queryGraph }, [], this.results);
        }
    }
}).$mount("#app");
