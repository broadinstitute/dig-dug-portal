<template>
<<<<<<< HEAD
    <network
        v-if="nodes.length > 0 && edges.length > 0"
        ref="network"
        :nodes="nodes"
        :edges="edges"
        :options="{
            height: '800px',
        }"
    >
    </network>
</template>
<script>
import Vue from "vue";
import { Network } from "vue-vis-network";
import trapi from "./trapi";
=======
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
import trapi from "./trapi"
>>>>>>> master
const makeLink = (from, to, label, index) => ({
    from,
    to,
    label,
    index,
});

const makeNode = (id, group, label, index) => ({
    id,
    group,
    label,
    index,
});

function translateGraph(knowledge_graph) {
    let graph = {
        nodes: [],
        edges: [],
    };
    const nodeEntries = Object.entries(knowledge_graph.nodes);
    const edgeEntries = Object.entries(knowledge_graph.edges);
    graph.nodes.push(
        ...nodeEntries.map((node) =>
            makeNode(node[0], node[1].category, node[1].name, node[0])
        )
    );
    graph.edges.push(
        ...edgeEntries.map((edge) =>
            makeLink(
                edge[1].subject,
                edge[1].object,
                edge[1].predicate,
                edge[0]
            )
        )
    );
    return graph;
}

export default Vue.component("translator-knowledge-graph", {
<<<<<<< HEAD
    props: ["knowledge_graph", "query_graph"],
    components: {
        Network,
    },
=======
    props: ['knowledge_graph', 'query_graph'],
>>>>>>> master
    computed: {
        graph: function () {
            return translateGraph(this.knowledge_graph);
        },
        nodes: function () {
            return this.graph.nodes;
        },
        edges: function () {
            return this.graph.edges;
        },
    },
    watch: {
        knowledge_graph: {
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
<<<<<<< HEAD
        onNodeHovered() {
            console.log(arguments);
        },
    },
});
=======
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
>>>>>>> master
</script>
