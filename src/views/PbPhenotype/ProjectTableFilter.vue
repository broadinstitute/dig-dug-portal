<template>
    <div class="pbs-project-filter">
        <div class="pbs-project-header">
            <button v-if="sortable" type="button" class="pbp-sort" @click="$emit('sort', sortDirection === 'asc' ? 'desc' : 'asc')">{{ heading }} {{ sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '' }}</button><button v-else type="button" class="pbp-sort" :aria-expanded="String(open)" :aria-controls="panelId" @click="toggle">{{ heading }}</button>
            <button ref="trigger" type="button" class="pbs-filter-trigger" :class="{ 'pbs-filter-active': value !== null }" :aria-label="`Filter sample ${filterKey}`" :aria-expanded="String(open)" :aria-controls="panelId" @click="toggle"><b-icon-funnel-fill v-if="value !== null"/><b-icon-funnel v-else/></button>
        </div>
        <div v-if="open" :id="panelId" ref="panel" class="pbs-project-filter-panel" :style="position" role="dialog" :aria-label="`Filter sample ${filterKey}`" @keydown.esc.stop.prevent="close">
            <div v-if="sortable" class="pbs-filter-sorts"><button type="button" class="pbp-btn" @click="sort('asc')">Sort A → Z</button><button type="button" class="pbp-btn" @click="sort('desc')">Sort Z → A</button></div>
            <p v-if="description" class="pbs-filter-description">{{ description }}</p><label :for="`${panelId}-search`">{{ searchLabel }}</label>
            <input :id="`${panelId}-search`" ref="search" v-model="search" type="search" autocomplete="off"/>
            <div class="pbs-filter-selection"><button type="button" class="pbs-link" @click="selectVisible(true)">Select all{{ search ? ' results' : '' }}</button><button type="button" class="pbs-link" @click="selectVisible(false)">Clear{{ search ? ' results' : '' }}</button></div>
            <div class="pbs-project-options">
                <label v-for="option in visibleOptions" :key="option.name"><input v-model="draft" type="checkbox" :value="option.name"/><span>{{ option.label || option.name }}<small v-if="option.investigators">{{ option.investigators }}</small></span><span class="pbs-option-count">{{ option.count.toLocaleString() }}</span></label>
                <p v-if="!visibleOptions.length">No matching {{ filterKey }}.</p>
            </div>
            <div class="pbs-filter-footer"><span>{{ draft.length }} of {{ options.length }} selected</span><button type="button" class="pbp-btn" @click="close">Cancel</button><button type="button" class="pbp-btn pbs-filter-apply" @click="apply">Apply</button></div>
        </div>
    </div>
</template>
<script>
export default {
    props: { options: Array, value: { type: Array, default: null }, sortDirection: String,
        heading: { type: String, default: 'Project / Investigator' },
        filterKey: { type: String, default: 'projects' },
        searchLabel: { type: String, default: 'Find a project or investigator' },
        description: String, sortable: { type: Boolean, default: true },
    },
    data: () => ({ open: false, search: '', draft: [], position: {} }),
    computed: {
        panelId() { return `pbs-${this.filterKey}-filter-panel`; },
        visibleOptions() { const query = this.search.trim().toLowerCase(); return this.options.filter(row => `${row.name} ${row.label || ''} ${row.investigators || ''}`.toLowerCase().includes(query)); },
    },
    mounted() { document.addEventListener('pointerdown', this.outside); window.addEventListener('resize', this.place); window.addEventListener('scroll', this.place, true); },
    beforeDestroy() { document.removeEventListener('pointerdown', this.outside); window.removeEventListener('resize', this.place); window.removeEventListener('scroll', this.place, true); },
    methods: {
        toggle() { if (this.open) return this.close(); this.draft = this.value === null ? this.options.map(row => row.name) : [...this.value]; this.search = ''; this.open = true; this.$nextTick(() => { this.place(); this.$refs.search.focus(); }); },
        close() { this.open = false; this.$refs.trigger.focus(); },
        outside(event) { if (this.open && !this.$el.contains(event.target)) this.open = false; },
        place() {
            if (!this.open) return;
            const rect = this.$refs.trigger.getBoundingClientRect();
            const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
            const width = Math.min(490, (window.innerWidth - 32) / zoom);
            const top = Math.min(rect.bottom + 8, Math.max(16, window.innerHeight - 440 * zoom));
            this.position = { width: `${width}px`, left: `${Math.max(16, Math.min(rect.right - width * zoom, window.innerWidth - width * zoom - 16)) / zoom}px`, top: `${top / zoom}px`, maxHeight: `${(window.innerHeight - top - 16) / zoom}px` };
        },
        selectVisible(selected) { const visible = new Set(this.visibleOptions.map(row => row.name)); this.draft = selected ? [...new Set([...this.draft, ...visible])] : this.draft.filter(name => !visible.has(name)); },
        apply() { this.$emit('input', this.draft.length === this.options.length ? null : [...this.draft]); this.close(); },
        sort(direction) { this.$emit('sort', direction); this.close(); },
    },
};
</script>
