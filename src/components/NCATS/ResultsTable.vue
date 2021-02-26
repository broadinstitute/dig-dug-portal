<template>
    <span>
        <b-table  :items="withSelected([{'test': 'value'},{'test': 'value2'}])">
            <template #cell()="data">
                <template v-if="Array.isArray(data.value)">
                    <span v-for="(curie, index) in data.value" :key="curie">
                        <resolved-curie-link
                            :curie="curie">
                        </resolved-curie-link>{{index == (data.value.length - 1) ? '' : ', '}}
                    </span>
                </template>
                <template v-else>
                    <resolved-curie-link
                        :curie="data.value">
                    </resolved-curie-link>
                </template>
            </template>
             <template #cell(selected)="data">
                <b-form-group>
                    <input
                        type="checkbox"
                        v-model="
                            data.item
                                .selected
                        "
                    />
                </b-form-group>
            </template>
        </b-table>
    </span>
</template>
<script>
import Vue from "vue"
import trapi from "./trapi"
import merge from "lodash.merge"

export default Vue.component('ncats-results-table', {
    props:['query_graph', 'selectable'],
    data() {
        return {
            results: [],
            knowledge_graph_list: [],
        }
    },
    async mounted() {
        await trapi.queries.knowledgeGraphsForSources({
            message: { 
                query_graph: this.query_graph
            }
        }, [], this.knowledge_graph_list)
    },
    methods: {
        tableItemsFromKnowledgeGraph(knowledge_graph_list) {
            const restrictedTypes = ['bts:GO', 'bts:term', 'bts:WIKIPATHWAYS']
            if (!!knowledge_graph_list && knowledge_graph_list.length > 0) {
                let knowledge_graph = knowledge_graph_list.reduce((acc, item) => merge(acc, item), {});
                let results = Object.entries(knowledge_graph.edges).map(edgeEntry => {
                    const [name, edge]  = edgeEntry;
                    const { subject, predicate, object, attributes } = edge;
                    const row = attributes.filter(attr => !restrictedTypes.includes(attr.type)).reduce((acc, item) => {
                        const { name, value } = item;
                        acc[name] = value;
                        return acc;
                    }, {
                        [knowledge_graph.nodes[subject].category]: subject, 
                        predicate, 
                        [knowledge_graph.nodes[object].category]: object
                    })
                    return row;
                });
                return results;
            } return [];
        },
        withSelected(tableItems) {
            return tableItems.map(tableItem => merge({ selected: true }, tableItem));
        },
        maybe(items, callback, condition) {
            if (condition) {
                return callback(items)
            } return items;
        }
    }
})
</script>