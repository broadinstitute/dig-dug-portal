import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css"
import BootstrapVue, { componentsPlugin } from "bootstrap-vue"

import ResultsDashboard from "@/components/NCATS/ResultsDashboard"
import ResolvedCurie from "@/components/NCATS/ResolvedCurieLink"
import KnowledgeGraph from "@/components/NCATS/KnowledgeGraph"

import jsonQuery from "json-query"
import { match } from "@/utils/bioIndexUtils";

import CriterionListGroup from "@/components/criterion/group/CriterionListGroup"
import FilterEnumeration from "@/components/criterion/FilterEnumeration"

import queryString from "query-string"
import _, { merge } from "lodash"
import trapi from "@/components/NCATS/trapi"
import AsyncComputed from 'vue-async-computed'
import StaticPageInfo from "@/components/StaticPageInfo.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(AsyncComputed);

new Vue({
    store,
    components: {
        CriterionListGroup,
        FilterEnumeration,
        ResolvedCurie,
        StaticPageInfo,
        PageHeader,
        PageFooter,
        ResultsDashboard,
        KnowledgeGraph,
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            geneInfo: [],
            results: [],
            fields: [],
            gene: 'PCSK9',
            currentPage: 1,
            translatorResults: null,
            queryGraphCriterion: [],
            subjects: ['biolink:Gene'],
            objects: ['biolink:Disease'],
            predicates: ['biolink:gene_associated_with_condition'],
            links: [],
            biolinkModel: null,
            matchingGenes: [],
            query_graph: {
                "query_graph": {
                  "edges": {
                    "e00": {
                      "object": "n01",
                      "subject": "n00",
                      "predicate": "biolink:functional_association"
                    },
                    "e01": {
                        "object": "n02",
                        "subject": "n00",
                        "predicate": "biolink:functional_association"
                    },
                    "e02": {
                        "object": "n03",
                        "subject": "n00",
                        "predicate": "biolink:functional_association"
                      }
                  },
                  "nodes": {
                    "n00": {
                      "category": "biolink:Gene",
                      "id": "NCBIGene:1017"
                    },
                    "n01": {
                      "category": "biolink:BiologicalProcess"
                    },
                    "n02": {
                        "category": "biolink:CellularComponent"
                    },
                    "n03": {
                        "category": "biolink:Pathway"
                    }
                  }
                }
            },

            globalKnowledgeGraph: null,

            geneToDiseaseQueryCriterion: [],
            diseaseToPhenotypeQueryCriterion: [],

            geneToDiseaseQuery: null,
            diseaseToPhenotypeQuery: null,

            selectedResults: [],
            selectedGeneCriterion: [],

            geneToDiseasePredicates: [],

            mock: true,
        }
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    async mounted() {
        const biolinkModel = await trapi.model.biolinkModel;
        this.geneToDiseasePredicates = trapi.model.findSlotsForDomainRange({
            domain: 'gene',
            range: 'disease or phenotypic feature'
        }, biolinkModel)
    },
    asyncComputed: {
        async diseaseMap() {
            const curieOptions = this.selectedResults.filter(el => el.selected).map(el => el.object);
            if (curieOptions.length > 0) {
                return await Promise.all(
                    curieOptions.map(curie => new Promise((resolve => {
                        resolve(trapi.normalize.curieLabel(curie).then(label => ({ [curie]: label })))
                    })))
                ).then(list => list.reduce((acc, item) => merge(acc, item), {}));
            }
            return {};
        },
        async diseaseLabels() {
            return Object.values(this.diseaseMap)
        },
        async diseaseOptions() {
            return Object.keys(this.diseaseMap)
        },
        async geneQueries() {
            if (this.selectedGeneCriterion.length > 0) {
                return await Promise.all(this.selectedGeneCriterion
                                    .map(el => el.threshold)
                                    .map(gene => this.makeGeneToPathwayQuery(gene)));
            } else {
                return [];
            }

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

        queryGraph() {
            return this.makeQueryGraph(this.queryGraphCriterion)
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
        async makeDiseaseToPhenotypeQuery(diseaseCurie) {
            this.diseaseToPhenotypeQuery = {
                query_graph: {
                    nodes: {
                        diseaseToPhenotypeDisease: {
                            id: diseaseCurie,
                            category: 'biolink:Disease'
                        },
                        diseaseToPhenotypePhenotype: {
                            category: 'biolink:Phenotype'
                        }
                    },
                    edges: {
                        geneToDisease: {
                            subject: "diseaseToPhenotypeDisease",
                            object: "diseaseToPhenotypePhenotype",
                            predicate: "biolink:disease_to_exposure_event_association"
                        }
                    }
                }
            }
        },
        async makeGeneToDiseaseQuery(geneSymbol) {
            const geneCurie = await this.curieForGene(geneSymbol)
            this.geneToDiseaseQuery = {
                query_graph: {
                    nodes: {
                        geneToDiseaseGene: {
                            id: geneCurie,
                            category: 'biolink:Gene'
                        },
                        geneToDiseaseDisease: {
                            category: 'biolink:Disease'
                        }
                    },
                    edges: {
                        geneToDisease: {
                            subject: "geneToDiseaseGene",
                            object: "geneToDiseaseDisease",
                            predicate: "biolink:gene_associated_with_condition"
                        }
                    }
                }
            }
        },
        async makeGeneToPathwayQuery(geneSymbol) {
            const geneCurie = await this.curieForGene(geneSymbol)
            let geneToPathwayQuery = {
                query_graph: {
                    nodes: {
                        gene: {
                            id: geneCurie,
                            category: 'biolink:Gene'
                        },
                        pathway: {
                            category: 'biolink:Pathway'
                        }
                    },
                    edges: {
                        geneToPathway: {
                            subject: "gene",
                            object: "pathway",
                            predicate: "biolink:functional_association"
                        }
                    }
                }
            }
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
        makeQueryGraph(preGraph, mode='complete') {
            const EDGE_PREFIX='e';
            // const NODE_PREFIX='n';
            const SUBJECT_PREFIX='s';
            const OBJECT_PREFIX='o';

            const isEdge = e => e.indexOf(EDGE_PREFIX) === 0;
            // const isNode = e => e.indexOf(NODE_PREFIX) === 0;
            const isSubject = e => e.indexOf(SUBJECT_PREFIX) === 0;
            const isObject = e => e.indexOf(OBJECT_PREFIX) === 0;

            const edges = preGraph.filter(el => isEdge(el.field));
            // const nodes = preGraph.filter(el => isNode(el.field));
            const subjects = preGraph.filter(el => isSubject(el.field));
            const objects = preGraph.filter(el => isObject(el.field));

            const isComplete = edges.length > 0 && subjects.length > 0 && objects.length > 0;
            const isPartial = edges.length > 0 || subjects.length > 0 || objects.length > 0;

            if (mode === 'complete' && isComplete || mode === 'partial' && isPartial) {
                return {
                    "query_graph": {
                        "nodes": {
                            ...subjects.reduce((acc, item) => {
                                const acc_ = acc;
                                acc_[item.field] = {
                                    "id": item.threshold !== 'All' ? item.threshold : undefined,
                                }
                                return acc_;
                            }, {}),
                            ...objects.reduce((acc, item) => {
                                const acc_ = acc;
                                acc_[item.field] = {
                                    "id": item.threshold !== 'All' ? item.threshold : undefined,
                                }
                                return acc_;
                            }, {}),
                        },
                        "edges": edges.reduce((acc, item) => {
                            const acc_ = acc;
                            _.zip(subjects, objects).forEach(so => {
                                const [s, o] = so;
                                console.log('so?', so)
                                acc_[item.field] = {
                                    "subject": !!s ? s.field : undefined,
                                    "object": !!o ? o.field : undefined,
                                    "predicate": item.threshold
                                }
                            });
                            return acc_;
                        }, {})
                    },
                }
            }
            return null;
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
