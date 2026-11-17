<template>
    <div class="pbp-inline-hpo-picker">
        <div class="pbp-inline-hpo-field">
            <input ref="input" :value="draft" role="combobox" :aria-label="inputLabel" aria-autocomplete="list"
                :aria-expanded="String(open && suggestions.length > 0)" :aria-controls="listId"
                :aria-activedescendant="open && suggestions[active] ? `${listId}-${active}` : null"
                placeholder="Search phenotype names or HPO IDs" autocomplete="off" spellcheck="false"
                @input="edit" @focus="open = true; active = 0" @blur="open = false"
                @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent.stop="selectCurrent" @keydown.esc.prevent="open = false" />
            <small v-if="selectedId">{{ selectedId }}</small>
            <button v-if="draft" type="button" :aria-label="`Clear ${inputLabel}`" @click="clear"><b-icon-x aria-hidden="true" /></button>
        </div>
        <div v-if="open && suggestions.length" :id="listId" class="pbp-inline-hpo-options" role="listbox" :aria-label="`${inputLabel} suggestions`">
            <button v-for="(item, index) in suggestions" :id="`${listId}-${index}`" :key="item.id" type="button" role="option"
                :aria-selected="String(active === index)" :disabled="!availability(item.id).enabled" @mousedown.prevent @click="choose(item.id)">
                <span><span><template v-for="(part, i) in highlight(item.name)"><strong v-if="part.match" :key="i">{{ part.text }}</strong><span v-else :key="i">{{ part.text }}</span></template></span><small>{{ item.id }}</small></span>
                <span class="pbp-inline-hpo-count">{{ countLabel(item.id) }}</span>
            </button>
        </div>
    </div>
</template>

<script>
import { hpoSuggestions, resolveIndexedHpo } from './hpoSearch';
import { hpoAvailability } from './hpoAvailability';

export default {
    name: 'PhenotypeTermPicker',
    props: {
        value: { type: String, default: '' }, inputLabel: { type: String, required: true },
        searchIndex: { type: Object, required: true }, terms: { type: Object, required: true },
        sampleCounts: { type: Object, default: null }, countsStatus: { type: String, default: 'loading' },
    },
    data() { return { draft: this.display(this.value), open: false, active: 0, listId: `pbp-inline-hpo-${this._uid}` }; },
    watch: { value(value) { if (value !== this.draft) this.draft = this.display(value); } },
    computed: {
        suggestions() { return hpoSuggestions(this.searchIndex, this.draft, 8); },
        selectedId() { const id = resolveIndexedHpo(this.searchIndex, this.value); return this.terms[id] ? id : ''; },
    },
    methods: {
        display(value) { const id = resolveIndexedHpo(this.searchIndex, value); return this.terms[id]?.[0] || value; },
        edit(event) {
            if (event.target.composing) return;
            this.draft = event.target.value; this.open = true; this.active = 0;
            this.$emit('input', this.draft);
        },
        move(direction) { if (!this.open) { this.open = true; this.active = direction > 0 ? 0 : Math.max(0, this.suggestions.length - 1); } else if (this.suggestions.length) this.active = (this.active + direction + this.suggestions.length) % this.suggestions.length; },
        choose(id) { if (!this.terms[id] || !this.availability(id).enabled) return; this.draft = this.terms[id][0]; this.open = false; this.active = 0; this.$emit('input', id); },
        selectCurrent() {
            if (this.open && this.suggestions[this.active]) this.choose(this.suggestions[this.active].id);
            else { const id = resolveIndexedHpo(this.searchIndex, this.draft); if (this.terms[id]) this.choose(id); else this.open = true; }
        },
        clear() { this.draft = ''; this.open = false; this.$emit('input', ''); this.$refs.input?.focus(); },
        availability(id) { return hpoAvailability(id, this.sampleCounts, this.countsStatus); },
        countLabel(id) { return this.availability(id).reason; },
        highlight(label) {
            const query = this.draft.trim().toLowerCase(), index = label.toLowerCase().indexOf(query);
            if (!query || index < 0) return [{ text: label, match: false }];
            return [{ text: label.slice(0, index), match: false }, { text: label.slice(index, index + query.length), match: true }, { text: label.slice(index + query.length), match: false }];
        },
    },
};
</script>

<style scoped>
.pbp-inline-hpo-picker { position: relative; min-width: 0; }
.pbp-inline-hpo-field { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-height: 48px; padding: 4px 8px 4px 12px; border: 1px solid #cbd6e5; border-radius: 6px; background: white; }
.pbp-inline-hpo-field:focus-within { border-color: var(--blue); box-shadow: 0 0 0 2px #e1ebff; }
.pbp-inline-hpo-field input { flex: 1 1 200px; width: 100%; min-width: 0; min-height: 38px; padding: 4px 0; border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; font-size: 20px; }
.pbp-inline-hpo-field input::placeholder { color: #8390a3; }
.pbp-inline-hpo-field small, .pbp-inline-hpo-options small { color: #7b879a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 16px; }
.pbp-inline-hpo-field > button { display: flex; align-items: center; justify-content: center; flex: none; width: 26px; height: 30px; padding: 0; border: 0; background: transparent; color: #7b879a; font-size: 20px; cursor: pointer; }
.pbp-inline-hpo-options { position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 40; max-height: 270px; overflow-y: auto; border: 1px solid #d1dbe8; border-radius: 7px; background: white; box-shadow: 0 6px 18px rgba(30,45,70,.12); }
.pbp-inline-hpo-options > button { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px 14px; width: 100%; padding: 11px 12px; border: 0; background: white; color: var(--ink); font: inherit; font-size: 20px; text-align: left; cursor: pointer; }
.pbp-inline-hpo-options > button:hover, .pbp-inline-hpo-options > button[aria-selected=true] { background: #edf3ff; }
.pbp-inline-hpo-options > button > span:first-child { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; min-width: 0; overflow-wrap: anywhere; }
.pbp-inline-hpo-count { flex: none; color: #526071; font-size: 18px; }
.pbp-inline-hpo-picker button:focus-visible { outline: 2px solid var(--blue); outline-offset: -2px; }
@media (max-width: 800px) { .pbp-inline-hpo-options > button { flex-wrap: wrap; } .pbp-inline-hpo-field input { flex-basis: 100%; font-size: 18px; } }
</style>
