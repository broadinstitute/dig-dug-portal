import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css"
import BootstrapVue, { componentsPlugin } from "bootstrap-vue"

import NCATSPredicateTable from "@/components/NCATS/PredicateTable"
import KnowledgeGraph from "@/components/NCATS/KnowledgeGraph"
import RegionPredicateTable from "@/components/NCATS/predicateTables/RegionPredicateTable"
import jsonQuery from "json-query"

import CriterionListGroup from "@/components/criterion/group/CriterionListGroup"
import FilterEnumeration from "@/components/criterion/FilterEnumeration"

import queryString from "query-string"

Vue.config.productionTip = false;
Vue.use(BootstrapVue);

new Vue({
    store,
    components: {
        NCATSPredicateTable,
        RegionPredicateTable,
        KnowledgeGraph,
        CriterionListGroup,
        FilterEnumeration
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            geneInfo: [],
            results: [],
            fields: ['pathway', 'go'],
            currentPage: 1,
            translatorResults: null,
            queryGraphCriterion: [],
            nodes: [],
            links: [],
        };
    },
    async created() {
        function tap (e, message='') { console.log(`${message}`, e); return e };

        let message = {
            "message": {
                "query_graph": {
                    "edges": {
                        "e00": {
                            "subject": "n00",
                            "object": "n01",
                            "predicate": "biolink:gene_associated_with_condition"
                        }
                    },
                    "nodes": {
                        "n00": {
                            "id": "NCBIGene:1803",
                            "category": "biolink:Gene"
                        },
                        "n01": {
                            "category": "biolink:Disease"
                        }
                    }
                }
            }
        }

        async function messageARS(message, trace=null) {
            let qs = queryString.stringify({ trace }, { skipNull: true });
            return await fetch(`https://ars.transltr.io/ars/api/messages/${message}?${qs}`).then(body => body.json())
        }

        async function _streamARAs(arsQuery, { onDone=id=>id, onError=id=>id, onUnknown=id=>id, onRunning=id=>id }, actorStatuses=new Map(), delay=600) {
            await new Promise(resolve => setTimeout(resolve, delay));

            // update the statuses with the latest information
            let _actorStatuses = new Map(actorStatuses);
            arsQuery.children.forEach(el => _actorStatuses.set(el.actor.agent, el.status));

            // check the previous status against the current status, and only handle when there has been a change
            arsQuery.children.forEach(child => {
                const { status, actor: { agent } } = child;
                if (actorStatuses.get(agent) !== _actorStatuses.get(agent)) {
                    switch(status) {
                        case 'Done': onDone(child); break;
                        case 'Error': onError(child); break;
                        case 'Unknown': onUnknown(child); break;
                        case 'Running': onRunning(child); break;
                        default: console.log('Unknown Status Code!', status, agent, actor)
                    }
                }
            });

            // terminate after no new changes after delay and all children are listed as not running
            if (arsQuery.children.map(actor => actor.status).every(status => status !== "Running")) {
                // as long as delay > expected time for any individual ARA to contribute its result after a another ARA has started providing its result,
                // then the query should complete with all ARAs being called
                return arsQuery;
            }

            return messageARS(arsQuery.message, 'y').then(aq => _streamARAs(aq, { onDone, onError, onUnknown, onRunning }, _actorStatuses, delay));
        }

        async function beginARSQuery(message) {
            return await fetch('https://ars.transltr.io/ars/api/submit', {
                method: 'POST',
                body: JSON.stringify(message)
            })
            .then(response => response.json())
            .then(async json => await messageARS(json.pk, 'y'))
        }

        function hasResults(message) {
            if (Object.keys(message).length > 0) {
                if (!!message.results && message.results.length > 0) {
                    return true
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        // 2021-02-09: The reason why we construct an entry function before the result function is that if the result function is used without the trace,
        // it loses track of the actor metadata (like the agent name) in exchange for the query results.
        const getARAMessageEntry = async ara => messageARS(ara.message).then(response => [ara.actor.agent, response.fields.data.message]);
        const getARAMessage = async ara => getARAMessageEntry(ara).then(entry => entry[1]);
        const promiseSideEffect = callback => promise => async event => promise(event).then(callback);   // TODO promiseSideEffect(getARAResultEntry, console.log) OR promiseSideEffect(console.log)(getARAResultEntry)

        async function streamARSQuery(initialMessage, successCallback=console.log, errorCallback=console.error, unknownCallback=console.warn) {

            // wrap the callbacks in functions that will inject them after a given promise
            // abbreviations are given mainly for readability's sake
            const psed = promiseSideEffect(successCallback);
            const psee = promiseSideEffect(errorCallback);
            const pseu = promiseSideEffect(unknownCallback);
            const gme = getARAMessageEntry;

            // begin the ARS Query and handle the results as a stream
            return await beginARSQuery(initialMessage)
                .then(arsQuery => _streamARAs(arsQuery, {
                        onDone: psed(gme),
                        onError: psee(gme),
                        onUnknown: pseu(gme)
                    }));

        }

        const printResultsFromSources = (sources=[]) => (entry) => {
            const [agent, message] = entry;
            if (sources.length === 0 || sources.includes(agent)) {
                if(hasResults(message)) {
                    console.log(agent, message)
                }
            }
        }
        async function printResultsForSources(message, sources=[]) {
            return await streamARSQuery(message, printResultsFromSources(sources));
        }
        // printResultsForSources(message, ['kp-genetics']);

        this.results = [];
        const updateResultsFromSources = (sources=[], assignable=[]) => (entry) => {
            const [agent, message] = entry;
            if (sources.length === 0 || sources.includes(agent)) {
                if(hasResults(message)) {
                    assignable.push(...message.results);
                }
            } return assignable;
        }
        async function updateResultsForSources(message, sources=[], assignable=[]) {
            return await streamARSQuery(message, updateResultsFromSources(sources, assignable));
        }

        await updateResultsForSources(message, [], assignable=this.results);


    },
    mounted() {
        this.$store.dispatch('myGeneInfo/infoForGeneSymbol', { geneSymbol: 'PCSK9', fields: ['pathway', 'go'] });
    },
    computed: {
        goTerms: function() {
            return this.geneInfoForField(this.$store.state.myGeneInfo.geneInfo, 'go');
        },
        pathway: function() {
            return this.geneInfoForField(this.$store.state.myGeneInfo.geneInfo, 'pathway');
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
        makeQueryGraph(preGraph) {
            const EDGE_PREFIX='e';
            const NODE_PREFIX='n';
            const isEdge = e => e.indexOf(EDGE_PREFIX) === 0;
            const isNode = e => e.indexOf(NODE_PREFIX) === 0;
            const edges = preGraph.filter(el => isEdge(el.field));
            const nodes = preGraph.filter(el => isNode(el.field));
            return {
                "query_graph": {
                    "nodes": nodes.reduce((acc, item) => {
                        const acc_ = acc;
                        acc_[item.field] = {
                            "id": item.threshold,
                            "category": '',
                        }
                        return acc_;
                    }, {}),
                    "edges": edges.reduce((acc, item) => {
                        const acc_ = acc;
                        acc_[item.field] = {
                            "subject": '',
                            "object": '',
                            "predicate": item.threshold
                        }
                        return acc_;
                    }, {})
                },
            }

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
    }
}).$mount("#app");
