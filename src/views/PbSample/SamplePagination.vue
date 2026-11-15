<template>
    <nav class="pbs-number-pagination" :aria-label="label">
        <button type="button" :disabled="page <= 1" @click="$emit('change', page - 1)">Previous</button>
        <template v-for="(number, index) in numbers">
            <span v-if="number === '…'" :key="'gap-' + index">…</span>
            <button v-else :key="number" type="button" :aria-current="number === page ? 'page' : null" :class="{ 'is-current': number === page }" @click="$emit('change', number)">{{ number }}</button>
        </template>
        <button type="button" :disabled="page >= pageCount" @click="$emit('change', page + 1)">Next</button>
    </nav>
</template>
<script>
const { pageNumbers } = require('../PbGene2/evidencePagination');
export default {
    props: { compact: Boolean, label: String, page: {type: Number, default: 1}, pageCount: {type: Number, default: 1} },
    computed: { numbers() { if (this.compact) { const start = Math.max(1, Math.min(this.page - 2, this.pageCount - 4)); return Array.from({length: Math.min(5, this.pageCount)}, (_, i) => start + i); } return pageNumbers(this.page, this.pageCount); } },
};
</script>
