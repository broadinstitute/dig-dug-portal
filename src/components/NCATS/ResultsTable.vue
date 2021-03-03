<template>
    <span>
        <span v-if="queryDone && knowledge_graph_list.length > 0">
            <b-table
                :items="filteredTableItems"
                :per-page="perPage"
                :current-page="currentPage"
                small
            >

                <template #cell()="data">
                    <template v-if="Array.isArray(data.value)">
                        <span v-for="(curie, index) in data.value" :key="curie" :id="`${curie}-link-${index}-${data.index}`">

                            <results-tooltip
                                :target="`${curie}-link-${data.index}-${index}`"
                                :query_graph="query_graph"
                                :rowData="data"
                                :curie="curie"
                            ></results-tooltip>

                            <span :id="`${curie}-link-${data.index}-${index}`">
                                <resolved-curie-link
                                    :curie="curie">
                                </resolved-curie-link>{{index == (data.value.length - 1) ? '' : ', '}}
                            </span>

                        </span>
                    </template>
                    <template v-else>

                        <!-- <b-tooltip v-if="['subject', 'object'].includes(data.field.key)" :target="`${data.value}-link-${data.index}`">
                            <a v-if="portalLinkFor(data.field.key) !== ''" :href="portalLinkFor(data.field.key)(data.value)">
                                <span style="color: #fff">Go to Portal resource</span><br>
                            </a>
                            <resolved-curie-link
                                class="options-4-actions"
                                :curie="data.value">
                                <span style="color: #fff">Go to curated entry</span>
                            </resolved-curie-link>
                        </b-tooltip> -->

                        <results-tooltip
                            :target="`${data.value}-link-${data.index}`"
                            :query_graph="query_graph"
                            :rowData="data"
                        ></results-tooltip>

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
                            v-model="data.item.selected"
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
import { mock_knowledge_graph} from "./mock"
import merge from "lodash.merge"
import ResultsTooltip from "@/components/NCATS/ResultsTooltip";

export default Vue.component('translator-results-table', {
    props:['query_graph', 'selectable', 'filter', 'mock'],
    components: {
        ResultsTooltip
    },
    data() {
        return {
            currentPage: 1,
            perPage: 10,
            knowledge_graph_list: [],
            queryDone: false,
        }
    },
    async mounted() {
        if (this.mock) {
            this.knowledge_graph_list = [mock_knowledge_graph];
            this.queryDone = true;
        } else {
            let self = this;
            await trapi.queries.knowledgeGraphsForSources({
                message: { 
                    query_graph: this.query_graph
                }
            }, [], this.knowledge_graph_list)
            .then(_ => { self.queryDone = true });
        }
    },
    computed: {
        knowledge_graph() {
            return this.knowledge_graph_list.reduce((acc, item) => merge(acc, item), {});
        },
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
        async curieLabel(curie) {
            let curieLabel = await trapi.normalize.curieLabel(curie);
            // local cache for synchronous functions
            return curieLabel;
        },
        tableItemsFromKnowledgeGraph(knowledge_graph_list) {
            const restrictedTypes = ['bts:GO', 'bts:term', 'bts:WIKIPATHWAYS']
            if (!!knowledge_graph_list && knowledge_graph_list.length > 0) {
                let knowledge_graph = knowledge_graph_list.reduce((acc, item) => merge(acc, item), {});
                let results = Object.entries(knowledge_graph.edges).map(edgeEntry => {
                    const [name, edge]  = edgeEntry;
                    let { subject, predicate, object, attributes } = edge;
                    let row = {
                        // [knowledge_graph.nodes[subject].category]: subject, 
                        subject,
                        predicate, 
                        object,
                        // [knowledge_graph.nodes[object].category]: object
                    }
                    if (!!attributes) {
                        row = attributes.filter(attr => !restrictedTypes.includes(attr.type)).reduce((acc, item) => {
                            const { name, value } = item;
                            acc[name] = value;
                            return acc;
                        }, row)
                    };
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
        },
        knowledge_graph: {
            handler(newKnowledgeGraph) {
                this.$emit('change-knowledge-graph', newKnowledgeGraph)
            },
            deep: true,
        }
    }
})
</script>