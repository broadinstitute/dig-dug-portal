<template>
    <nav class="pbs-pagination" :aria-label="`${label} pages`">
        <span><template v-if="!arrowsOnly">{{ page }} / {{ pages }} · </template>{{ total.toLocaleString() }} {{ label }} · {{ size }} per page</span>
        <div><button type="button" class="pbp-btn" :disabled="page <= 1" :aria-label="`Previous ${label} page`" @click="$emit('change', page - 1)"><b-icon-chevron-left aria-hidden="true"/></button>
        <span v-if="arrowsOnly" class="pbs-page-position" aria-live="polite">{{ page }} / {{ pages }}</span>
        <template v-else><button v-for="value in numbers" :key="value" type="button" class="pbp-btn" :class="{ 'pbs-current-page': page === value }" :aria-current="page === value ? 'page' : null" :aria-label="`${label} page ${value}`" @click="$emit('change', value)">{{ value }}</button></template>
        <button type="button" class="pbp-btn" :disabled="page >= pages" :aria-label="`Next ${label} page`" @click="$emit('change', page + 1)"><b-icon-chevron-right aria-hidden="true"/></button></div>
    </nav>
</template>
<script>
export default {
    props: { page: Number, total: Number, size: Number, label: String, arrowsOnly: Boolean },
    computed: {
        pages() { return Math.max(1, Math.ceil(this.total / this.size)); },
        numbers() {
            const start = Math.floor((this.page - 1) / 5) * 5 + 1;
            return Array.from({ length: Math.min(5, this.pages - start + 1) }, (_, index) => start + index);
        },
    },
};
</script>
