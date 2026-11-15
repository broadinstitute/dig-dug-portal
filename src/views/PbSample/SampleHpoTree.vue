<template>
    <ul class="pbs-hpo-tree">
        <li v-for="node in nodes" :key="node.id" :class="{ 'pbs-hpo-recorded': node.recorded }">
            <details v-if="node.children.length" open>
                <summary>
                    <span class="pbs-hpo-name">{{ node.label }}</span>
                    <a class="pbs-hpo-id" :href="phenotypeHref(node.id)" @click.stop>{{ node.id }}</a>
                    <span v-if="node.recorded" class="pbs-hpo-recorded-badge">Recorded</span>
                </summary>
                <SampleHpoTree :nodes="node.children" />
            </details>
            <div v-else class="pbs-hpo-leaf">
                <span class="pbs-hpo-name">{{ node.label }}</span>
                <a class="pbs-hpo-id" :href="phenotypeHref(node.id)">{{ node.id }}</a>
                <span v-if="node.recorded" class="pbs-hpo-recorded-badge">Recorded</span>
            </div>
        </li>
    </ul>
</template>
<script>
export default {
    name: 'SampleHpoTree',
    props: { nodes: { type: Array, default: () => [] } },
    methods: { phenotypeHref(id) { return `/pb_phenotype.html?query=${encodeURIComponent(id)}`; } },
};
</script>
