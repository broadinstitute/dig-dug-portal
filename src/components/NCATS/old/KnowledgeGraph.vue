<template>
    <div
        v-if="nodes.length > 0 && edges.length > 0"
        ref="networkContainer"
        style="height: 800px; width: 100%;">
    </div>
</template>
<script>
import Vue from "vue";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import _ from "lodash"

const makeGraph = (query_graph, knowledge_graph_results) => {

    const makeLink = (from, to, label) => ({
      from, to, label
    });

    const makeNode = (id, group, label, index) => ({
        id, group, label, index
    });

    // const edge_labels = Object.keys(query_graph.edges);
    // const node_labels = Object.keys(query_graph.nodes);
    let graph = { nodes: [], links: [] };

    knowledge_graph_results.forEach(el => {
        // Target Schema:
            // Node: {"name":"Myriel","group":1,"index":0}, {"name":"Napoleon","group":1,"index":1}
            // Link: {"source":1,"target":0,"value":1}

        const edgeResultKeys = Object.keys(el.edge_bindings);

        edgeResultKeys.forEach(edgeId => {
             if (Object.keys(query_graph.edges).includes(edgeId)) {
                // since map keys are unordered we have to find out what node is the subject or the object from the query
                const { subject, object } = query_graph.edges[edgeId];

                // create nodes then create link
                const subjectNode = makeNode(el.node_bindings[subject][0].id, query_graph.nodes[subject].category,
                     el.node_bindings[subject][0].id, el.node_bindings[subject][0].id);

                const objectNode = makeNode(el.node_bindings[object][0].id, query_graph.nodes[object].category,
                     el.node_bindings[object][0].id, el.node_bindings[object][0].id);

                const subjectObjectLink = makeLink(subjectNode.index, objectNode.index, query_graph.edges[edgeId].predicate);

                graph.nodes.push(subjectNode, objectNode);
                graph.links.push(subjectObjectLink);

             }
        })

    });

    graph.nodes = _.uniqBy(graph.nodes, 'id')
    return graph;
};

export default Vue.component("translator-knowledge-graph", {
    props: ['query_graph', 'results'],
    computed: {
        graph: function() { return makeGraph(this.query_graph, this.results) },
        nodes: function() { return this.graph.nodes },
        edges: function() { return this.graph.links },
    },
    watch: {
        results: {
            handler() {
                this.$nextTick(() => this.renderNetwork());
            },
            deep: true,
        },
    },
    mounted() {
        this.$nextTick(() => this.renderNetwork());
    },
    beforeDestroy() {
        if (this.network) {
            this.network.destroy();
        }
    },
    methods: {
        renderNetwork() {
            const container = this.$refs.networkContainer;
            if (!container || this.nodes.length === 0) return;
            if (this.network) {
                this.network.destroy();
            }
            const data = {
                nodes: new DataSet(this.nodes),
                edges: new DataSet(this.edges),
            };
            this.network = new Network(container, data, {});
        },
        onNodeHovered() {
            console.log(arguments)
        }
    }
})
</script>
