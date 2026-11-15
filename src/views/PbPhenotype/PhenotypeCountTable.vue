<template>
<div class="pbs-table-wrap"><table class="pbs-table"><thead><tr><th>Phenotype</th><th>Samples</th><th>Share</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id"><td>{{ terms[row.id][0] }}</td><td>{{ row.count }}</td><td>{{ total ? Math.round(row.count / total * 100) : 0 }}%</td></tr><tr v-if="!rows.length"><td colspan="3">No other recorded phenotypes.</td></tr></tbody></table></div>
</template>
<script>
export default { props: { rows: Array, terms: Object, total: Number } };
</script>
