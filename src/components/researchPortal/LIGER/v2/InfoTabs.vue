<script>
import Vue from "vue";

// The inner tab strip inside a detail panel. Visually distinct from the card's own
// tab band above it -- these are pills rather than a full-width band, so two levels
// of tabs do not read as one confused row.
//
// A tab carrying a count shows it. A tab with nothing behind it is still rendered
// but disabled, because "this program has no gene set associations" is information,
// and hiding the tab would make that indistinguishable from "not loaded".
export default Vue.component("InfoTabs", {
    props: {
        // [{ key, label, count? }] -- count null means "unknown / not loaded",
        // which is NOT the same as 0 and does not disable the tab.
        tabs: {
            type: Array,
            default: () => []
        },
        value: {
            type: String,
            default: ""
        }
    },

    methods: {
        isDisabled(tab) {
            return tab.count === 0;
        },

        select(tab) {
            if (this.isDisabled(tab) || tab.key === this.value) {
                return;
            }

            this.$emit("input", tab.key);
        }
    }
});
</script>

<template>
    <div class="info-tabs" role="tablist">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="info-tab"
            :class="{ active: tab.key === value, empty: isDisabled(tab) }"
            role="tab"
            :aria-selected="tab.key === value ? 'true' : 'false'"
            :disabled="isDisabled(tab)"
            @click="select(tab)"
        >
            {{ tab.label }}
            <span v-if="Number.isFinite(tab.count)" class="tab-count">{{ tab.count }}</span>
        </button>
    </div>
</template>

<style scoped>
.info-tabs{
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 14px 0 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--ce-line);
}
.info-tab{
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: none;
    font-size: 11px;
    font-weight: 700;
    color: var(--ce-muted);
    cursor: pointer;
    transition: background-color .12s ease, color .12s ease;
}
.info-tab:hover:not(:disabled):not(.active){
    background: var(--ce-sunken);
    color: var(--ce-ink);
}
.info-tab.active{
    background: var(--ce-accent-soft);
    border-color: var(--ce-accent);
    color: var(--ce-accent);
}
/* Rendered, but not clickable: an empty tab says the API reported nothing here,
   which is different from the tab not existing. */
.info-tab.empty{
    color: var(--ce-line);
    cursor: not-allowed;
}
.tab-count{
    padding: 0 5px;
    border-radius: 999px;
    background: var(--ce-sunken);
    font-size: 10px;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
}
.info-tab.active .tab-count{
    background: #fff;
}
.info-tab.empty .tab-count{
    background: none;
}
</style>
