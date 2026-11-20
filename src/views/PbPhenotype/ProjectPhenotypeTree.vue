<template>
    <ul class="pbs-project-hpo-tree">
        <li v-for="node in nodes" :key="node.id">
            <details v-if="node.children.length" :open="node.id === 'HP:0000118' || queryBranches.has(node.id)">
                <summary :class="{ 'pbs-query-row': selected.includes(node.id) }" :style="selected.includes(node.id) ? { '--hpo-query-color': queryColor(node.id) } : null"><span :class="{ 'pbs-hpo-query': selected.includes(node.id) }" :style="selected.includes(node.id) ? { '--hpo-query-color': queryColor(node.id) } : null"><b-icon-square-fill v-if="selected.includes(node.id)" class="pbs-hpo-query-marker" aria-hidden="true"/>{{ node.label }}</span> <a :href="href(node.id)" @click.stop>{{ node.id }}</a> <span class="pbs-hpo-count">{{ node.count.toLocaleString() }} / {{ total.toLocaleString() }}</span></summary>
                <project-phenotype-tree :nodes="node.children" :total="total" :selected="selected" :query-color="queryColor" :depth="depth + 1"/>
            </details>
            <div v-else class="pbs-project-hpo-leaf" :class="{ 'pbs-query-row': selected.includes(node.id) }" :style="selected.includes(node.id) ? { '--hpo-query-color': queryColor(node.id) } : null"><span :class="{ 'pbs-hpo-query': selected.includes(node.id) }" :style="selected.includes(node.id) ? { '--hpo-query-color': queryColor(node.id) } : null"><b-icon-square-fill v-if="selected.includes(node.id)" class="pbs-hpo-query-marker" aria-hidden="true"/>{{ node.label }}</span> <a :href="href(node.id)">{{ node.id }}</a> <span class="pbs-hpo-count">{{ node.count.toLocaleString() }} / {{ total.toLocaleString() }}</span></div>
        </li>
    </ul>
</template>
<script>
import { selectedHierarchyBranches } from './singlePhenotypeModel';
export default {
    name: 'ProjectPhenotypeTree',
    props: { nodes: Array, total: Number, selected: Array, queryColor: Function, depth: { type: Number, default: 0 } },
    computed: { queryBranches() { return selectedHierarchyBranches(this.nodes, this.selected); } },
    methods: { href(id) { return `/phenotyperesult.html?query=${encodeURIComponent(id)}`; } },
};
</script>
