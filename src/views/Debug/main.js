import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css"
import BootstrapVue, { componentsPlugin } from "bootstrap-vue"

import KnowledgeGraph from "@/components/NCATS/KnowledgeGraph"
import ResultsDashboard from "@/components/NCATS/ResultsDashboard"
import ResolvedCurie from "@/components/NCATS/ResolvedCurieLink"

import jsonQuery from "json-query"

import CriterionListGroup from "@/components/criterion/group/CriterionListGroup"
import FilterEnumeration from "@/components/criterion/FilterEnumeration"

import queryString from "query-string"
import _ from "lodash"
import trapi from "@/components/NCATS/trapi"

Vue.config.productionTip = false;
Vue.use(BootstrapVue);

new Vue({
    store,
    components: {
        KnowledgeGraph,
        CriterionListGroup,
        FilterEnumeration,
        ResolvedCurie,
        ResultsDashboard
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
                    }
                  }
                }
              }
            };
    },
    async mounted() {

        this.biolinkModel = await trapi.model.biolinkModel;
        let biolinkModel = this.biolinkModel;

        const conceptsForReact = ['REACT', 'GO'].flatMap(prefix => trapi.model.findConceptByPrefix(prefix, biolinkModel));
        const possibleSlots = Array.from(new Set(conceptsForReact.flatMap(conceptForPrefix =>
            [].concat(
                trapi.model.findSlotsForDomainRange({ domain: conceptForPrefix }, biolinkModel),
                trapi.model.findSlotsForDomainRange({ range: conceptForPrefix }, biolinkModel)
            )
        )))
        console.log(possibleSlots, possibleSlots.map(slotName => biolinkModel.slots[slotName]));

        await trapi.queries.updateResultsForSources({
            "message": this.query_graph
        }, [], this.results);
    },
    computed: {
        goTerms: function() {
            return this.geneInfoForField(this.$store.state.myGeneInfo.geneInfo, 'go');
        },
        pathway: function() {
            return this.geneInfoForField(this.$store.state.myGeneInfo.geneInfo, 'pathway');
        },
        queryGraph() {
            return this.makeQueryGraph(this.queryGraphCriterion)
        },
        mapOnEntryValues(keyValueMap, f) {
            return Object.fromEntries(Object.entries(keyValueMap).map(el => [el[0], f(el[1])]));
        },
        mapOnEntryKeys(keyValueMap, f) {
            return Object.fromEntries(Object.entries(keyValueMap).map(el => [f(el[0]), el[1]]));
        },
        tableItems() {
            if (this.results.length > 0) {

                const formatResults = binding => 
                    result => this.mapOnEntryValues(
                              this.mapOnEntryKeys(
                                result[binding], 
                                ek => `${this.conceptType(ek, this.query_graph.query_graph)}`
                              ), 
                              ev => ev[0].id)

                const resultNodes = formatResults('node_bindings');
                const resultEdges = formatResults('edge_bindings');

                return this.results.map(el => ({
                    ...resultNodes(el),
                    ...resultEdges(el)
                }));

            } else {
                return [];
            }
        },
        associationOptions() {
            return !!this.biolinkModel ? 
                Object.keys(this.biolinkModel.classes).filter(cls => this.biolinkModel.classes[cls].is_a === 'association')
            : [];
        },
        associationOptions() {
            return !!this.biolinkModel ? 
                Object.keys(this.biolinkModel.classes).filter(cls => this.biolinkModel.classes[cls].is_a === 'association')
            : [];
        }
    },
    methods: {
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


        
        addNode() {
            this.nodes.push(`n0${this.nodes.length}`)
        },
        removeNode(node) {
            this.nodes = this.nodes.filter(n => n !== node)
        },
        addEdge() {
            this.links.push(`e0${this.links.length}`)
        },
        removeEdge(edge) {
            this.links = this.links.filter(n => n !== edge)
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
                                    "category": 'biolink:Gene',
                                }
                                return acc_;
                            }, {}),
                            ...objects.reduce((acc, item) => {
                                const acc_ = acc;
                                acc_[item.field] = {
                                    "id": item.threshold !== 'All' ? item.threshold : undefined,
                                    "category": 'biolink:Disease',
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
        geneInfoForField(geneInfo, field) {
            const helpers = {
                aggregateNestedLists: function(elements) {
                    const element = elements.flatMap(element => Object.entries(element).filter(element => element[1].length > 0).flatMap(entry => entry[1]))
                    return element;
                }
            }
            return jsonQuery(`geneInfo[${field}]:aggregateNestedLists`, {
                data: {
                    geneInfo
                },
                allowRegexp: true,
                locals: helpers
            }).value;
        },
    },
    watch: {
        queryGraph(queryGraph) {
            if (queryGraph !== null) trapi.queries.updateResultsForSources({ "message": queryGraph }, [], this.results);

        }
    }
}).$mount("#app");
