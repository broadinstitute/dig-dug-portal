<template>
    <SummaryPager :page="page" :total-pages="pageCount" :label="label" @change="$emit('change', $event)" />
</template>
<script>
import SummaryPager from '../PbGene/SummaryPager';
export default {
    components: { SummaryPager },
    props: { compact: Boolean, label: String, page: {type: Number, default: 1}, pageCount: {type: Number, default: 1} },
};
</script>
