<template>
    <div>
        <b-tabs>
            <b-tab v-for="(edgeId, index) in Object.keys(query_graph.edges)" 
                :key="edgeId"
                :title="`${query_graph.edges[edgeId].predicate} ${query_graph.nodes[query_graph.edges[edgeId].object].category}`">
                <b-table v-if="!!resultLib && resultLib.length > 0" :items="tableItems(resultLib[index])">
                    <template #cell()="data">
                        <resolved-curie-link
                            :curie="data.value">
                        </resolved-curie-link>
                    </template>
                </b-table>
            </b-tab>
        </b-tabs>
    </div>
</template>
<script>
import Vue from "vue";
import trapi from "@/components/NCATS/trapi"
export default Vue.component("ncats-results-dashboard", {
    props: ['query_graph'],
    data() {
        return {
            resultLib: []
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

        splitQuery(this.query_graph).forEach(
            async (query_subgraph) => {
                let list = [];
                await trapi.queries.updateResultsForSources({
                    "message": query_subgraph
                }, [], list)
                console.log('list', list)
                this.resultLib = this.resultLib.concat([list]);
            }
        )

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
