<template>
    <span>
        <span v-if="knowledge_graph_list.length > 0">
            <b-table
                :items="filteredTableItems"
                :per-page="perPage"
                :current-page="currentPage"
                small
            >

                <template #cell()="data">

                    <template v-if="Array.isArray(data.value)">
                        <span v-for="(curie, index) in data.value" :key="curie" :id="`${curie}-link-${index}-${data.index}`">
                            <b-tooltip :target="`${curie}-link-${data.index}-${index}`">
                                <a :href="portalLinkFor(data.value)">
                                    Go to the Portal resource  
                                </a><br>
                                <resolved-curie-link
                                    :curie="curie">
                                    Go to the curated entry
                                </resolved-curie-link>
                            </b-tooltip>
                            <span :id="`${curie}-link-${data.index}-${index}`">
                                <resolved-curie-link
                                    :curie="curie">
                                </resolved-curie-link>{{index == (data.value.length - 1) ? '' : ', '}}
                            </span>
                        </span>
                    </template>
                    <template v-else>
                        <b-tooltip :target="`${data.value}-link-${data.index}`">
                            <a>
                              Go to the Portal resource
                            </a><br>
                            <resolved-curie-link
                                :curie="data.value">
                                Go to the curated entry
                            </resolved-curie-link>
                        </b-tooltip>
                        <span :id="`${data.value}-link-${data.index}`">
                            <resolved-curie-link
                                :curie="data.value">
                            </resolved-curie-link>
                        </span>
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
            <b-pagination
                v-model="currentPage"
                :total-rows="tableItems.length"
                :per-page="perPage"
                :aria-controls="id"
            ></b-pagination>
        </span>
        <span v-else>
            <!-- <b-progress :value="100" variant="info" striped :animated="true" class="mt-2"></b-progress> -->
            <b-skeleton-table></b-skeleton-table>
        </span>
    </span>
</template>
<script>
import Vue from "vue"
import trapi from "./trapi"
import merge from "lodash.merge"

function mapTypeToPortalPage(key) {
    // if key is a synonym of supported key
}

export default Vue.component('ncats-results-table', {
    props:['query_graph', 'selectable', 'filter'],
    data() {
        return {
            currentPage: 1,
            perPage: 10,
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
    computed: {
        tableItems() {
            return this.maybe(this.tableItemsFromKnowledgeGraph(this.knowledge_graph_list), this.withSelected, this.selectable)
        },
        filteredTableItems() {
            let dataRows = this.tableItems;
            if (!!this.filter) {
                dataRows = this.tableItems.filter(this.filter);
            }
            return dataRows;
        },
    },
    methods: {
        portalLinkFor(key) {

        },
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
                        // [knowledge_graph.nodes[subject].category]: subject, 
                        subject,
                        predicate, 
                        object,
                        // [knowledge_graph.nodes[object].category]: object
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
    },
    watch: {
        tableItems: {
            handler(newTableItems) {
                this.$emit('change', newTableItems)
            },
            deep: true,
        }
    }
})
</script>