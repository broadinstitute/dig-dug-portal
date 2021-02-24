<template>
    <b-table :items="tableItems(results)">
        <template #cell()="data">
            <resolved-curie-link
                :curie="data.value">
            </resolved-curie-link>
        </template>
    </b-table>
</template>
<script>
import Vue from "vue"
import trapi from "./trapi"

export default Vue.component('ncats-results-table', {
    props:['query_graph'],
    data() {
        return {
            results: []
        }
    },
    async mounted() {
        await trapi.queries.updateResultsForSources({
            message: { 
                query_graph: this.query_graph
            }
        }, [], this.results)
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