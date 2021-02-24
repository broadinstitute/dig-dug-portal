<template>
    <div>
        <b-tabs>
            <b-tab v-for="query_graph in queries" 
                :key="Object.keys(query_graph.query_graph.edges)[0]"
                :title="`${query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].predicate} ${query_graph.query_graph.nodes[query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].object].category}`">
                <ncats-results-table
                    :title="`${query_graph.query_graph.nodes[query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].subject].id}: ${query_graph.query_graph.nodes[query_graph.query_graph.edges[Object.keys(query_graph.query_graph.edges)[0]].subject].category}`"
                    :query_graph="query_graph.query_graph"
                ></ncats-results-table>
            </b-tab>
        </b-tabs>
    </div>
</template>
<script>
import Vue from "vue";
import trapi from "@/components/NCATS/trapi"
import ResultsTable from "./ResultsTable"
import { cloneDeep } from "lodash";

export default Vue.component("ncats-results-dashboard", {
    components: {
        ResultsTable,
    },
    props: ['query_graph'],
    data() {
        return {
            resultLib: [],
            queries: []
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
        this.queries = splitQuery(this.query_graph)
        console.log(this.queries)

    },
    watch: {
        resultLib() {
            console.log(arguments)
        }
    },
    methods: {
        mapOnEntryValues(keyValueMap, f) {
           return Object.fromEntries(Object.entries(keyValueMap).map(el => [el[0], f(el[1])]));
        },
        mapOnEntryKeys(keyValueMap, f) {
            return Object.fromEntries(Object.entries(keyValueMap).map(el => [f(el[0]), el[1]]));
        },
        conceptType(identifier, query_graph) {
            const concepts = { ...query_graph.nodes, ...query_graph.edges };
            return concepts[identifier].category || concepts[identifier].predicate;
        },
        tableItems(results) {
            console.log(results)
            if (!!results && results.length > 0) {

                const formatResults = binding => 
                    result => this.mapOnEntryValues(
                              this.mapOnEntryKeys(
                                result[binding], 
                                ek => `${this.conceptType(ek, this.query_graph)}`
                              ), 
                              ev => ev[0].id)

                const resultNodes = formatResults('node_bindings');
                const resultEdges = formatResults('edge_bindings');

                return results.map(el => ({
                    ...resultNodes(el),
                    ...resultEdges(el)
                }));

            } else {
                return [];
            }
        },
    }
})
</script>
