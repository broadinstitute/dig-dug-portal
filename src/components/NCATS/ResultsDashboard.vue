<template>
    <div>
        <b-tabs>
            <b-tab v-for="query_graph in queries" 
                :key="Object.keys(query_graph.query_graph.edges)[0]"
                :title="`${biolinkTypeFormatter(query_graph.query_graph.nodes[query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].subject].category)} 🠖 ${biolinkTypeFormatter(query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].predicate)} 🠖 ${biolinkTypeFormatter(query_graph.query_graph.nodes[query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].object].category)}`">
                <b-card>
                    <ncats-results-table
                        :query_graph="query_graph.query_graph"
                    ></ncats-results-table>
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
export default Vue.component("ncats-results-dashboard", {
    components: {
        ResultsTable,
    },
    props: ['query_graph'],
    data() {
        return {
            resultLib: [],
            queries: [],
            queryGraphCriterion: [],
        }
    },
    async created() {

        const splitQuery = function(query_graph) {
            const { nodes, edges } = query_graph;
            const queries = [];
            Object.keys(edges).forEach(edgeKey => {
                const { subject, object } = edges[edgeKey];
                let newQuery = { query_graph: { nodes: {}, edges: {} } };
                newQuery.query_graph.edges[edgeKey] = edges[edgeKey];
                newQuery.query_graph.nodes[subject] = nodes[subject];
                newQuery.query_graph.nodes[object] = nodes[object];
                queries.push(newQuery);

            })
            return queries;
        }
        this.queries = splitQuery(this.query_graph);
    },
    methods: {
        biolinkTypeFormatter(biolinkTypeCurie) {
            return Formatters.capitalizedFormatter(trapi.identifiers._stripPrefix(biolinkTypeCurie))
        }
    }
})
</script>
