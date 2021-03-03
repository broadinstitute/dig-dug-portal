<template>
    <div>
        <b-tabs v-if="myQueries.length > 0">
            <b-tab v-for="query_graph in myQueries" 
                :key="Object.keys(query_graph.query_graph.edges)[0]"
                :title="`${biolinkTypeFormatter(query_graph.query_graph.nodes[query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].subject].category)} 🠖 ${biolinkTypeFormatter(query_graph.query_graph.nodes[query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].object].category)}`">
                <b-card>
                    <translator-results-table
                        :query_graph="query_graph.query_graph"
                        :mock="mock"
                    ></translator-results-table>
                </b-card>
            </b-tab>
        </b-tabs>
    </div>
</template>
<script>

import Vue from "vue";
import ResultsTable from "./ResultsTable"
import trapi from "@/components/NCATS/trapi"
import Formatters from "@/utils/formatters.js"

// Note: Here's the LoC for predicate label decoding
// 🠖 ${biolinkTypeFormatter(query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].predicate)} 

export default Vue.component("translator-results-dashboard", {
    components: {
        ResultsTable,
    },
    props: {
        query_graph: Object,
        title: String,
        queries: {
            type: Array,
            default: () => [],
        },
        mock: {
            type: Boolean,
            default: false,
        }
    },
    data() {
        return {
            resultLib: [],
            myQueries: this.queries,
            queryGraphCriterion: [],
        }
    },
    async created() {
        const splitQuery = function(query_graph) {
            const { nodes, edges } = query_graph;
            const myQueries = [];
            Object.keys(edges).forEach(edgeKey => {
                const { subject, object } = edges[edgeKey];
                let newQuery = { query_graph: { nodes: {}, edges: {} } };
                newQuery.query_graph.edges[edgeKey] = edges[edgeKey];
                newQuery.query_graph.nodes[subject] = nodes[subject];
                newQuery.query_graph.nodes[object] = nodes[object];
                myQueries.push(newQuery);

            })
            return myQueries;
        }
        this.myQueries = splitQuery(this.query_graph);
    },
    methods: {
        biolinkTypeFormatter(biolinkTypeCurie) {
            return Formatters.capitalizedFormatter(trapi.identifiers._stripPrefix(biolinkTypeCurie))
        }
    }
})
</script>
