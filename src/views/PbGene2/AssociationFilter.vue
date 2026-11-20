<template>
    <div class="pg2-association-filter">
        <button :id="targetId" type="button" class="pg2-association-filter-toggle" :class="{ 'is-active': active }"
                :aria-label="'Filter ' + label" :aria-expanded="String(open)">
            <b-icon-funnel-fill v-if="active" aria-hidden="true" />
            <b-icon-funnel v-else aria-hidden="true" />
        </button>
        <BPopover :target="targetId" :show.sync="open" triggers="click" placement="bottom" boundary="viewport"
                  container="body" :title="'Filter ' + label" @show="loadDraft">
            <form ref="filterForm" class="pg2-association-filter-form" @submit.prevent="apply" @keydown.esc.stop="close">
                <template v-if="range">
                    <label>Minimum <input v-model="minimum" type="number" min="0" step="1" placeholder="Any" /></label>
                    <label>Maximum <input v-model="maximum" type="number" min="0" step="1" placeholder="Any" /></label>
                    <p v-if="!validRange" class="pg2-association-filter-error" role="status">Enter whole counts with minimum ≤ maximum.</p>
                </template>
                <template v-else>
                    <input v-if="searchable" v-model.trim="search" type="search" :aria-label="'Search ' + label" :placeholder="'Search ' + label.toLowerCase()" />
                    <label><input type="checkbox" :checked="allSelected" :indeterminate.prop="someSelected"
                                  @change="selected = $event.target.checked ? [...options] : []" /> Select all</label>
                    <div class="pg2-association-filter-options" :class="{ 'pg2-association-filter-scroll': searchable }">
                        <label v-for="option in visibleOptions" :key="option">
                            <input v-model="selected" type="checkbox" :value="option" /> {{ optionLabel(option) }}
                        </label>
                        <p v-if="searchable && !visibleOptions.length" class="pg2-association-filter-no-options">No matching options.</p>
                    </div>
                </template>
                <div class="pg2-association-filter-actions">
                    <button type="button" @click="clear">Clear filter</button>
                    <button type="submit" :disabled="!canApply">Apply</button>
                </div>
            </form>
        </BPopover>
    </div>
</template>

<script>
import { BPopover } from 'bootstrap-vue';

export default {
    components: { BPopover },
    props: {
        label: { type: String, required: true },
        value: { type: [Array, Object], default: null },
        options: { type: Array, default: () => [] },
        optionLabel: { type: Function, default: option => option },
        searchable: Boolean,
        requireSelection: Boolean,
        range: Boolean,
    },
    data() {
        return { open: false, selected: [], minimum: '', maximum: '', search: '' };
    },
    computed: {
        targetId() { return `pg2-association-filter-${this._uid}`; },
        active() { return this.value !== null; },
        allSelected() { return this.selected.length === this.options.length; },
        someSelected() { return this.selected.length > 0 && !this.allSelected; },
        visibleOptions() {
            const query = this.search.toLowerCase().replace(/_/g, ' ');
            return this.options.filter(option => this.optionLabel(option).toLowerCase().includes(query) ||
                String(option).toLowerCase().replace(/_/g, ' ').includes(query));
        },
        canApply() { return this.range ? this.validRange : !this.requireSelection || this.selected.length > 0; },
        lowerBound() { return this.minimum === '' ? null : Number(this.minimum); },
        upperBound() { return this.maximum === '' ? null : Number(this.maximum); },
        validRange() {
            const valid = value => value == null || (Number.isSafeInteger(value) && value >= 0);
            return valid(this.lowerBound) && valid(this.upperBound)
                && (this.lowerBound == null || this.upperBound == null || this.lowerBound <= this.upperBound);
        },
    },
    mounted() { document.addEventListener('click', this.closeOutside); },
    beforeDestroy() { document.removeEventListener('click', this.closeOutside); },
    methods: {
        loadDraft() {
            if (this.range) {
                this.minimum = this.value?.min ?? '';
                this.maximum = this.value?.max ?? '';
            } else {
                this.search = '';
                this.selected = this.value === null ? [...this.options] : this.options.filter(option => this.value.includes(option));
            }
        },
        apply() {
            if (!this.canApply) return;
            if (this.range) {
                const min = this.lowerBound;
                const max = this.upperBound;
                this.$emit('input', min == null && max == null ? null : { min, max });
            } else {
                this.$emit('input', this.allSelected ? null : this.selected);
            }
            this.close();
        },
        clear() {
            this.$emit('input', null);
            this.close();
        },
        close() {
            this.open = false;
            document.getElementById(this.targetId)?.focus();
        },
        closeOutside(event) {
            if (this.open && !this.$el.contains(event.target) && !this.$refs.filterForm?.contains(event.target)) this.open = false;
        },
    },
};
</script>

<style scoped>
.pg2-association-filter-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 32px;
    padding: 0;
    border: 1px solid #b8c7df;
    border-radius: 4px;
    background: #fff;
    color: #334766;
}
.pg2-association-filter-toggle.is-active { border-color: #0b66d8; background: #edf4ff; color: #0b66d8; }
.pg2-association-filter-form { display: grid; gap: 8px; width: 210px; color: #14213d; }
.pg2-association-filter-form label { display: flex; align-items: center; gap: 8px; margin: 0; }
.pg2-association-filter-options { display: grid; gap: 8px; }
.pg2-association-filter-scroll { max-height: 230px; overflow-y: auto; padding: 2px 4px 2px 0; }
.pg2-association-filter-scroll input { flex: 0 0 auto; }
.pg2-association-filter-form input[type="search"] { width: 100%; padding: 4px 6px; border: 1px solid #b8c7df; border-radius: 4px; }
.pg2-association-filter-no-options { color: #52688b; margin: 0; }
.pg2-association-filter-form input[type="number"] { width: 100px; margin-left: auto; padding: 4px 6px; }
.pg2-association-filter-error { margin: 0; color: #a5252c; }
.pg2-association-filter-actions { display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; }
.pg2-association-filter-actions button { padding: 4px 8px; border: 1px solid #b8c7df; border-radius: 4px; background: #fff; color: #17447f; }
.pg2-association-filter-actions button[type="submit"] { border-color: #0b66d8; background: #0b66d8; color: #fff; }
.pg2-association-filter-actions button:disabled { opacity: .5; }
</style>
