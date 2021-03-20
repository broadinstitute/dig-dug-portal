<template>
    <span>
        <span v-if="queryDone && knowledge_graph_list.length > 0">

            <criterion-function-group>

                <!-- <filter-enumeration-control
                    :field="'subject'"
                    :options="mungedOptions(tableItems, 'subject')"
                    :labelFormatter="label=> subjectLabels[label]">
                    <div class="label">
                        {{'Subject'}}
                    </div>
                </filter-enumeration-control> -->

                <filter-enumeration-control
                    :field="'predicate'"
                    :labelFormatter="biolinkTypeFormatter"
                    :options="mungedOptions(tableItems, 'predicate')">
                    <div class="label">
                        {{'Predicate'}}
                    </div>
                </filter-enumeration-control>

                <filter-enumeration-control
                    :field="'object'"
                    :options="mungedOptions(tableItems, 'object')"
                    :labelFormatter="label=> {
                        return objectLabels[label]
                    }">
                    <div class="label">
                        {{'Object'}}
                    </div>
                </filter-enumeration-control>

                <!-- <filter-enumeration-control
                    :field="'publications'"
                    :labelFormatter="biolinkTypeFormatter"
                    :options="mungedOptions(tableItems, 'publications')">
                    <div class="label">
                        {{'Publications'}}
                    </div>
                </filter-enumeration-control> -->

<!-- 
                <filter-enumeration-control
                    :field="'provenance'"
                    :options="mungedOptions(tableItems, 'provenance')">
                    <div class="label">
                        {{'Provenance'}}
                    </div>
                </filter-enumeration-control> -->

                <template #filtered="{filter}">

                    <b-table
                        :items="tableItems.filter(filter)"
                        :fields="uniqueSortableTableFields"
                        :per-page="perPage"
                        :current-page="currentPage"
                        small>

                        <template #cell()="data" v-if="outlinks">
                            <span v-if="data.value != false">
                                <template v-if="Array.isArray(data.value)">
                                    <ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; list-style-type: none; padding: 0; margin: 0; column-gap:10px">
                                        <li v-for="(curie, index) in data.value" 
                                            :key="curie" 
                                            :id="`${curie}-link-${index}-${data.index}`">
                                            <results-tooltip
                                                :target="`${curie}-link-${data.index}-${index}`"
                                                :query_graph="query_graph"
                                                :rowData="data"
                                                :curie="curie"
                                                :key="`${curie}_tooltip`"
                                            ></results-tooltip>

                                            <span :id="`${curie}-link-${data.index}-${index}`">
                                                <resolved-curie-link
                                                    :key="`${curie}_item`"
                                                    :curie="curie">
                                                </resolved-curie-link>
                                                <!-- {{index == (data.value.length - 1) ? '' : ', '}} -->
                                            </span>
                                        </li>
                                    </ul>                                
                                </template>

                                <span v-else :key="data.value">

                                    <results-tooltip
                                        :target="`${data.value}-link-${data.index}`"
                                        :query_graph="query_graph"
                                        :key="`${data.value}_tooltip`"
                                        :rowData="data"
                                    ></results-tooltip>
                                    
                                    <span :id="`${data.value}-link-${data.index}`">
                                        <resolved-curie-link
                                            :key="`${data.value}_item`"
                                            v-if="typeof data.value === 'string' && data.value.includes(':')"
                                            :curie="data.value">
                                        </resolved-curie-link>
                                        <span v-else>
                                            {{data.value}}
                                        </span>
                                    </span>
                                </span>
                            </span>
                            <span v-else>
                                No {{data.field.label}}
                            </span>
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
                        :total-rows="tableItems.filter(filter).length"
                        :per-page="perPage"
                    ></b-pagination>

                </template>
            </criterion-function-group>
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
import { mock_knowledge_graph } from "./mock"
import merge from "lodash.merge"
import { cloneDeep } from "lodash"
import ResultsTooltip from "@/components/NCATS/ResultsTooltip";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue"
import Formatters from "@/utils/formatters"
import AsyncComputed from "vue-async-computed";
Vue.use(AsyncComputed);

export default Vue.component('translator-results-table', {
    props: ['query_graph', 'selectable', 'filter', 'mock', 'relationsOnly'],
    props: {
        query_graph: Object,
        selectable: Boolean,
        filter: Function,
        mock: Boolean,
        relationsOnly: {
            type: Boolean,
            default: true
        },
        outlinks: {
            type: Boolean,
            default: true
        }
    },
    components: {
        ResultsTooltip,
        CriterionFunctionGroup
    },
    data() {
        return {
            tableFields: [],

            currentPage: 1,
            perPage: 20,

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
            return cloneDeep(this.knowledge_graph_list.reduce((acc, item) => merge(acc, item), {}));
        },
        uniqueSortableTableFields() {
            return Array.from(new Set(this.tableFields)).map(field => ({
                key: field,
                sortable: true
            }));
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
    asyncComputed: {
        async subjectLabels() {
            return Promise.all(
                this.mungedOptions(this.tableItems, 'subject').map(value => {
                    return trapi.normalize.curieLabel(value).then(label => [value, label]);
                })
            ).then(Object.fromEntries)
        },
        async objectLabels() {
            return Promise.all(
                this.mungedOptions(this.tableItems, 'object').map(value => {
                    return trapi.normalize.curieLabel(value).then(label => [value, label]);
                })
            ).then(Object.fromEntries)
        },
    },
    methods: {
        // TODO: this sucks
        mungedOptions(items, attribute) {
            return items.map(row => row[attribute])
                        .filter(el => el !== undefined)
                        .flatMap(id => id) 
        },
        biolinkTypeFormatter(biolinkTypeCurie) {
            return Formatters.capitalizedFormatter(trapi.identifiers._stripPrefix(biolinkTypeCurie))
        },
        aggKnowledgeGraph(knowledge_graph_list) {
            return knowledge_graph_list.reduce((acc, item) => merge(acc, item), {});
        },
        tableItemsFromKnowledgeGraph(knowledge_graph_list) {
            const restrictedTypes = ['bts:GO', 'bts:term', 'bts:WIKIPATHWAYS'];

            if (!!knowledge_graph_list && knowledge_graph_list.length > 0) {

                let knowledge_graph = this.aggKnowledgeGraph(knowledge_graph_list)

                let results = Object.entries(knowledge_graph.edges).map(edgeEntry => {

                    const [name, edge]  = edgeEntry;
                    let { subject, predicate, object, attributes } = edge;
                    
                    const attributeMap = attributes.reduce((acc, item) => {
                        const { name, value } = item;
                        acc[name] = value;
                        return acc;
                    }, {});

                    let row = {
                        // [knowledge_graph.nodes[subject].category]: subject, 
                        subject,
                        predicate, 
                        object,
                        // [knowledge_graph.nodes[object].category]: object
                    }
                    
                    // flag if we want to ignore attributes
                    if (!!!this.relationsOnly) {
                        if (!!attributes.length > 0) {
                            row = {
                                ...row,
                                ...attributeMap,
                            }
                        };
                    }

                    // NOTE: since publications and provenance are generally useful, we add those fields regardless of whether we just want relations
                    if (typeof attributeMap['publications'] !== 'undefined') row['publications'] = attributeMap['publications'];
                    // if (typeof attributeMap['provenance'] !== 'undefined') row['provenance'] = attributeMap['provenance'];

                    // side effect for keeping track of row fields
                    this.tableFields.push(...Object.keys(row));

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