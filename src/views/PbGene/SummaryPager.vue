<template>
    <nav v-if="totalPages > 1" class="pbg-summary-pagination" :aria-label="label">
        <template>
            <button type="button" :disabled="page <= 1" @click="$emit('change', page - 1)">Previous</button>
            <button v-for="number in pageNumbers" :key="number" type="button"
                    :class="{ 'pbg-ve-page-active': number === page }"
                    :aria-current="number === page ? 'page' : null"
                    @click="$emit('change', number)">{{ number }}</button>
            <button type="button" :disabled="page >= totalPages" @click="$emit('change', page + 1)">Next</button>
            <form class="pbg-summary-page-jump" @submit.prevent="jump">
                <label :for="resolvedInputId">Page</label>
                <input :id="resolvedInputId" v-model.trim="target" type="number" min="1" :max="totalPages"
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
        inputId: { type: String, default: "" },
        compact: { type: Boolean, default: false },
    },
    data() { return { target: "", error: "" }; },
    computed: {
        resolvedInputId() { return this.inputId || `pb-pagination-${this._uid}`; },
        pageNumbers() {
            const count = Math.min(5, this.totalPages);
            const start = Math.max(1, Math.min(this.page - 1, this.totalPages - count + 1));
            return Array.from({ length: count }, (_, index) => start + index);
        },
    },
    watch: {
        page() { this.target = ""; this.error = ""; },
        totalPages() { this.target = ""; this.error = ""; },
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

<style scoped>
nav.pbg-summary-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 12px; padding: 0; color: #526071; font: 15px/1.4 Arial, sans-serif; }
.pbg-summary-pagination > button, .pbg-summary-page-jump button { min-width: 24px; min-height: 30px; padding: 3px 6px; border: 1px solid #c9d9eb; border-radius: 4px; background: #fff; color: #194f83; font: inherit; font-weight: 600; cursor: pointer; }
.pbg-summary-pagination > button.pbg-ve-page-active { background: #0b66d8; border-color: #0b66d8; color: #fff; }
.pbg-summary-pagination button:disabled { opacity: .45; cursor: default; }
.pbg-summary-page-jump { display: inline-flex; align-items: center; gap: 4px; margin: 0; padding: 0; font: inherit; }
.pbg-summary-page-jump label { margin: 0; font: inherit; }
.pbg-summary-page-jump input { box-sizing: border-box; width: 48px; min-height: 30px; padding: 3px 4px; border: 1px solid #c9d9eb; border-radius: 4px; font: inherit; }
.pbg-summary-pagination button:focus-visible, .pbg-summary-page-jump input:focus-visible { outline: 2px solid #0b66d8; outline-offset: 2px; }
.pbg-summary-page-state { white-space: nowrap; color: #526071; font: inherit; }
.pbg-ve-position-error { color: #b91c1c; }
</style>
