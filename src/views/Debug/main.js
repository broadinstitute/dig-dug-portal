import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css"
import BootstrapVue, { componentsPlugin } from "bootstrap-vue"

import NCATSPredicateTable from "@/components/NCATS/PredicateTable"
import KnowledgeGraph from "@/components/NCATS/KnowledgeGraph"
import RegionPredicateTable from "@/components/NCATS/predicateTables/RegionPredicateTable"

import FieldNav from "@/components/NCATS/FieldNav"

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
        NCATSPredicateTable,
        RegionPredicateTable,
        KnowledgeGraph,
        CriterionListGroup,
        FilterEnumeration,
        FieldNav
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
        };
    },
    async mounted() {
        const biolinkModel = await trapi.model.getBiolinkModel();
        const conceptsForReact = trapi.model.findConceptByPrefix('REACT', biolinkModel);
        const possibleSlots = conceptsForReact.flatMap(conceptForPrefix =>
            [].concat(
                trapi.model.findSlotsForDomainRange({ domain: conceptForPrefix }, biolinkModel),
                trapi.model.findSlotsForDomainRange({ range: conceptForPrefix }, biolinkModel)
            )
        )
        console.log(possibleSlots, possibleSlots.map(slotName => biolinkModel.slots[slotName]));
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
        }
    },
    methods: {
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
