<template>
    <div class="pbs-header-filter">
        <button :id="targetId" class="pbs-header-filter-button" :class="{ 'is-filtered': active, 'is-accent': accent }" type="button" :aria-label="'Filter ' + label" :aria-expanded="open ? 'true' : 'false'">
            {{ label }} <b-icon-funnel-fill v-if="active" /><b-icon-chevron-down v-else />
        </button>
        <BPopover :target="targetId" :show.sync="open" triggers="click" placement="bottom" boundary="viewport" container="body" custom-class="pbs-column-filter-popover" :title="'Filter ' + label">
            <div class="pbs-column-filter-menu">
                <div class="pbs-column-filter-actions"><button type="button" @click="$emit('sort',1)">Sort A–Z ↑</button><button type="button" @click="$emit('sort',-1)">Sort Z–A ↓</button></div>
                <input v-model="search" type="search" :placeholder="searchOnly ? 'Position / HGVS / rsID' : 'Search values…'" :aria-label="'Search ' + label" @input="searchOnly && $emit('query', search)" />
                <template v-if="!searchOnly">
                    <div class="pbs-column-filter-actions"><button type="button" @click="$emit('input',null)">Select all</button><button type="button" @click="$emit('input',[])">Clear all</button></div>
                    <div class="pbs-column-filter-options">
                        <label v-for="item in visibleOptions" :key="item.value"><input type="checkbox" :checked="selected === null || selected.includes(item.value)" @change="toggle(item.value)" /><span>{{ item.label || item.value }}</span><small>{{ item.count }}</small></label>
                        <p v-if="!visibleOptions.length">No values match this search.</p>
                    </div>
                </template>
                <div class="pbs-column-filter-footer"><span>{{ matchCount }} variants match</span><button v-if="searchOnly && search" type="button" @click="search = ''; $emit('query','')">Clear</button><button type="button" @click="open = false">Done</button></div>
            </div>
        </BPopover>
    </div>
</template>
<script>
import { BPopover } from 'bootstrap-vue';
export default {
    components: { BPopover },
    props: { label: String, options: { type:Array, default:()=>[] }, selected: { type:Array, default:null }, query: { type:String, default:'' }, searchOnly:Boolean, accent:Boolean, matchCount:Number },
    data() { return { open:false, search:this.query }; },
    computed: {
        targetId() { return `pbs-header-filter-${this._uid}`; },
        active() { return this.searchOnly ? !!this.query.trim() : this.selected !== null; },
        visibleOptions() { const search = this.search.trim().toLowerCase(); return this.options.filter(item => `${item.label || ''} ${item.value}`.toLowerCase().includes(search)); },
    },
    watch: { query(value) { if (this.searchOnly) this.search = value; } },
    mounted() { document.addEventListener('click', this.closeOutside); document.addEventListener('keydown', this.closeEscape); },
    beforeDestroy() { document.removeEventListener('click', this.closeOutside); document.removeEventListener('keydown', this.closeEscape); },
    methods: {
        toggle(value) { const selected = this.selected === null ? this.options.map(item => item.value) : this.selected; this.$emit('input',selected.includes(value) ? selected.filter(item => item !== value) : [...selected,value]); },
        closeOutside(event) { if (this.open && !event.target.closest(`#${this.targetId}, .pbs-column-filter-popover`)) this.open = false; },
        closeEscape(event) { if (event.key === 'Escape') this.open = false; },
    },
};
</script>
