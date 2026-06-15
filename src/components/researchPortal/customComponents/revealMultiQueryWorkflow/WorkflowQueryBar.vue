<template>
    <div class="reveal-query-input-wrap">
        <input
            ref="queryInput"
            type="text"
            class="form-control"
            :value="userQuery"
            :placeholder="searchInputPlaceholder"
            style="padding: 10px 140px 10px 10px; font-size: 11pt; height: auto;"
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
export default {
    name: "WorkflowQueryBar",
    props: {
        userQuery: { type: String, default: "" },
        searchInputPlaceholder: { type: String, default: "" },
    },
    methods: {
        focusQueryInput() {
            const el = this.$refs.queryInput;
            if (el) el.focus();
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
