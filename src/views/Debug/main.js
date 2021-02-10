import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css"
import BootstrapVue, { componentsPlugin } from "bootstrap-vue"

import NCATSPredicateTable from "@/components/NCATS/PredicateTable"
import RegionPredicateTable from "@/components/NCATS/predicateTables/RegionPredicateTable"
import jsonQuery from "json-query"

import queryString from "query-string"

Vue.config.productionTip = false;
Vue.use(BootstrapVue);

new Vue({
    store,
    components: {
        NCATSPredicateTable,
        RegionPredicateTable
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
        };
    },
    async created() {
        function tap (e, message='') { console.log(`${message}`, e); return e };

        let message = {
            "message": {
                "query_graph": {
                    // "edges": {
                    //     "e00": {
                    //         "subject": "n00",
                    //         "object": "n01",
                    //         "predicate": "biolink:gene_associated_with_condition"
                    //     }
                    // },
                    "nodes": {
                        "n00": {
                            "id": "NCBIGene:1803",
                            "category": "biolink:Gene"
                        },
                        // "n01": {
                        //     "category": "biolink:Disease"
                        // }
                    }
                }
            }
        };

        async function messageARS(message, trace=null) {
            let qs = queryString.stringify({ trace }, { skipNull: true });
            return await fetch(`https://ars.transltr.io/ars/api/messages/${message}?${qs}`).then(body => body.json())
        }

        // TODO: Refactor to some differentiating function? (i.e. will throw callback on any status change, not just success)
        async function streamARAs(arsQuery, successCallback=console.log, completed=[], delay=600) {
            await new Promise(resolve => setTimeout(resolve, delay));

            let _completed = completed;
            let newSuccessfulARAs = arsQuery.children.filter(ara => ara.status === "Done" && !completed.includes(ara.actor.agent))
            if (newSuccessfulARAs.length > 0) {
                _completed.push(...newSuccessfulARAs.map(successfulARA => successfulARA.actor.agent))
                newSuccessfulARAs.forEach(successCallback)
            } else {
                // terminate after no new successes after delay
                // as long as delay > expected time for any individual ARA to contribute its result after a another ARA has provided its result, then the query should complete
                // ...tenuous
                return arsQuery;
            }

            messageARS(arsQuery.message, 'y').then(aq => streamARAs(aq, successCallback, _completed, delay));
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

        async function streamARSQuery(initialMessage, callback) {
            return await beginARSQuery(initialMessage)
                .then(arsQuery => streamARAs(
                    arsQuery,
                    promiseSideEffect(callback)(getARAMessageEntry))
                );
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
        printResultsForSources(message, ['kp-genetics']);

        this.results = [];
        const updateResultsFromSources = (sources=[]) => (entry) => {
            const [agent, message] = entry;
            if (sources.length === 0 || sources.includes(agent)) {
                if(hasResults(message)) {
                    this.results.push(...message.results);
                }
            }
        }
        async function updateResultsForSources(message, sources=[]) {
            return await streamARSQuery(message, updateResultsFromSources(sources));
        }
        updateResultsForSources(message);


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
