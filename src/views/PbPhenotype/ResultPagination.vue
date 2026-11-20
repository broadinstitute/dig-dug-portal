<template>
    <div class="pbp-result-page-footer">
        <span>{{ total.toLocaleString() }} {{ label }} · {{ size }} per page</span>
        <SummaryPager :page="page" :total-pages="pages" :label="label + ' pages'" @change="$emit('change', $event)" />
    </div>
</template>
<script>
import SummaryPager from '../PbGene/SummaryPager';
export default {
    components: { SummaryPager },
    props: { page: Number, total: Number, size: Number, label: String, arrowsOnly: Boolean },
    computed: { pages() { return Math.max(1, Math.ceil(this.total / this.size)); } },
};
</script>
<style scoped>
.pbp-result-page-footer { margin-top: 12px; color: #526071; font-size: 15px; }
</style>
