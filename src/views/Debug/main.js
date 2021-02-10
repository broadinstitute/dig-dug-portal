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
        };

        async function messageARS(message, trace=null) {
            let qs = queryString.stringify({ trace }, { skipNull: true });
            return await fetch(`https://ars.transltr.io/ars/api/messages/${message}?${qs}`).then(body => body.json())
        }

        // TODO: Refactor to some differentiating function? (i.e. will throw callback on any status change, not just success)
        async function streamARAs(arsQuery, successCallback=console.log, completed=[], delay=1000) {
            let _completed = completed;
            let successfulARAs = arsQuery.children.filter(ara => ara.status === "Done" && !completed.includes(ara.actor.agent))
            if (successfulARAs.length > 0) {
                _completed.push(...successfulARAs.map(successfulARAs => successfulARAs.actor.agent))
                successfulARAs.forEach(successCallback)
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            await messageARS(arsQuery.message, 'y').then(aq => streamARAs(aq, successCallback, _completed, delay));
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
        const getARAResultEntry = async ara => messageARS(ara.message).then(response => [ara.actor.agent, response.fields.data.message]);
        const getARAResult = async ara => getARAResultEntry(ara).then(entry => entry[1]);
        const promiseSideEffect = callback => promise => async event => await promise(event).then(callback);   // promiseSideEffect(getARAResultEntry, console.log) OR promiseSideEffect(console.log)(getARAResultEntry)

        await beginARSQuery(message)
            .then(arsQuery => streamARAs(arsQuery, promiseSideEffect(message => { this.results.push(...message.results) })(getARAResult)));

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
