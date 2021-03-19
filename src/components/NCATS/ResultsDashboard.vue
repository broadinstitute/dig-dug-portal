<template>
    <div>
        <b-tabs v-if="myQueries.length > 0" lazy>
            <b-tab v-for="query_graph in myQueries" 
                :key="Object.keys(query_graph.edges)[0]"
                :title="`${
                    biolinkTypeFormatter(query_graph.nodes[query_graph.edges[Object.keys(query_graph.edges)[0]].subject].category)} 
                    🠖 
                    ${biolinkTypeFormatter(query_graph.nodes[query_graph.edges[Object.keys(query_graph.edges)[0]].object].category)}`
                "
                >
                <b-card>
                    <translator-results-table
                        :query_graph="query_graph"
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
            myQueries: [],
            queryGraphCriterion: [],
        }
    },
    async created() {
        this.myQueries = this.queries.map(qg => qg.query_graph);
    },
    methods: {
        biolinkTypeFormatter(biolinkTypeCurie) {
            return Formatters.capitalizedFormatter(trapi.identifiers._stripPrefix(biolinkTypeCurie))
        }
    }
})
</script>
