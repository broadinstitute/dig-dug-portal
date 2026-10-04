<template>
    <nav v-if="totalPages > 1" class="pbg-summary-pagination" :class="{ 'pbg-summary-pagination--compact': compact }" :aria-label="label">
        <template v-if="compact">
            <button type="button" :class="{ 'pbg-ve-page-active': page === 1 }" :aria-label="`First ${label}`" :aria-current="page === 1 ? 'page' : null" @click="$emit('change', 1)">1</button>
            <button type="button" :disabled="page <= 1" :aria-label="`Previous ${label}`" @click="$emit('change', page - 1)">‹</button>
            <form class="pbg-summary-page-jump" @submit.prevent="jump">
                <label class="pbg-visually-hidden" :for="inputId">Go to {{ label }} (current page {{ page }} of {{ totalPages }}; press Enter)</label>
                <input :id="inputId" v-model.trim="target" type="number" min="1" :max="totalPages"
                       :aria-invalid="error ? 'true' : 'false'" :title="`Current page ${page} of ${totalPages}. Enter a page number and press Enter.`">
            </form>
            <button type="button" :disabled="page >= totalPages" :aria-label="`Next ${label}`" @click="$emit('change', page + 1)">›</button>
            <button type="button" :class="{ 'pbg-ve-page-active': page === totalPages }" :aria-label="`Last ${label}`" :aria-current="page === totalPages ? 'page' : null" @click="$emit('change', totalPages)">{{ totalPages }}</button>
        </template>
        <template v-else>
            <button type="button" :disabled="page <= 1" @click="$emit('change', page - 1)">Previous</button>
            <button v-for="number in pageNumbers" :key="number" type="button"
                    :class="{ 'pbg-ve-page-active': number === page }"
                    :aria-current="number === page ? 'page' : null"
                    @click="$emit('change', number)">{{ number }}</button>
            <button type="button" :disabled="page >= totalPages" @click="$emit('change', page + 1)">Next</button>
            <form class="pbg-summary-page-jump" @submit.prevent="jump">
                <label :for="inputId">Page</label>
                <input :id="inputId" v-model.trim="target" type="number" min="1" :max="totalPages"
                       :placeholder="String(totalPages)" :aria-invalid="error ? 'true' : 'false'">
                <button type="submit">Go</button>
            </form>
            <span class="pbg-summary-page-state">{{ page }} / {{ totalPages }}</span>
        </template>
        <span v-if="error" class="pbg-ve-position-error" role="alert">{{ error }}</span>
    </nav>
</template>

<script>
export default {
    name: "SummaryPager",
    props: {
        page: { type: Number, required: true },
        totalPages: { type: Number, required: true },
        label: { type: String, required: true },
        inputId: { type: String, required: true },
        compact: { type: Boolean, default: false },
    },
    data() { return { target: "", error: "" }; },
    computed: {
        pageNumbers() {
            const count = Math.min(5, this.totalPages);
            const start = Math.max(1, Math.min(this.page - 1, this.totalPages - count + 1));
            return Array.from({ length: count }, (_, index) => start + index);
        },
    },
    methods: {
        jump() {
            const input = String(this.target).trim();
            const number = Number(input);
            if (!/^\d+$/.test(input) || !Number.isSafeInteger(number) || number < 1 || number > this.totalPages) {
                this.error = "Invalid page";
                return;
            }
            this.error = "";
            this.target = "";
            this.$emit("change", number);
        },
    },
};
</script>
