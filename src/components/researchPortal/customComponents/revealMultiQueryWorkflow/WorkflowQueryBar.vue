<template>
    <div class="reveal-query-input-wrap">
        <div class="reveal-query-criteria-slot">
            <label class="sr-only" for="reveal-search-criteria-select">Search criteria</label>
            <select
                id="reveal-search-criteria-select"
                class="form-control form-control-sm reveal-query-criteria-select"
                :value="searchCriteriaType"
                @change="onCriteriaChange($event.target.value)"
            >
                <option
                    v-for="opt in searchCriteriaOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :disabled="!opt.enabled"
                >
                    {{ opt.label }}
                </option>
            </select>
        </div>
        <input
            ref="queryInput"
            type="text"
            class="form-control reveal-query-text-input"
            :value="userQuery"
            :placeholder="searchInputPlaceholder"
            @input="$emit('update:userQuery', $event.target.value)"
            @focus="$emit('query-focus')"
            @blur="$emit('query-blur')"
            @keydown.enter.prevent="$emit('reveal')"
        />
        <div class="reveal-query-input-actions">
            <button
                type="button"
                class="btn btn-cfde reveal-query-submit-btn"
                style="min-width: 120px;"
                @click="$emit('reveal')"
            >
                Reveal
            </button>
        </div>
    </div>
</template>

<script>
/** Search-entity options for the main query bar. Only enabled values are selectable. */
export const REVEAL_SEARCH_CRITERIA_OPTIONS = [
    { value: "gene", label: "Gene", enabled: false },
    { value: "disease", label: "Disease", enabled: false },
    { value: "gene_set", label: "Gene set", enabled: true },
    { value: "dataset", label: "Dataset", enabled: false },
    { value: "free_text", label: "Free text", enabled: true },
];

export default {
    name: "WorkflowQueryBar",
    props: {
        userQuery: { type: String, default: "" },
        searchInputPlaceholder: { type: String, default: "" },
        /** Active entity type: gene_set | free_text (others reserved / disabled). */
        searchCriteriaType: { type: String, default: "free_text" },
    },
    computed: {
        searchCriteriaOptions() {
            return REVEAL_SEARCH_CRITERIA_OPTIONS;
        },
    },
    methods: {
        focusQueryInput() {
            const el = this.$refs.queryInput;
            if (el) el.focus();
        },
        onCriteriaChange(value) {
            const opt = REVEAL_SEARCH_CRITERIA_OPTIONS.find((o) => o.value === value);
            if (!opt || !opt.enabled) return;
            this.$emit("update:searchCriteriaType", value);
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
