<template>
    <div class="pbg-hpo-input-shell">
        <input :value="value" type="text" aria-label="HPO context terms"
               role="combobox" aria-autocomplete="list" :aria-expanded="String(open && suggestions.length > 0)"
               :aria-controls="listId" :aria-activedescendant="active >= 0 ? listId + '-' + active : null"
               autocomplete="off" spellcheck="false" placeholder="Search phenotype names or enter HPO IDs"
               @input="onInput" @focus="open = true" @blur="open = false"
               @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)"
               @keydown.enter="onEnter" @keydown.esc.prevent="open = false">
        <div v-if="open && suggestions.length" :id="listId" class="pbg-hpo-suggestions" role="listbox" aria-label="Phenotype suggestions">
            <button v-for="(term, index) in suggestions" :id="listId + '-' + index" :key="term.id"
                    type="button" role="option" :aria-selected="String(active === index)"
                    @mousedown.prevent @click="choose(term)">
                <strong>{{ term.label }}</strong><small>{{ term.id }}</small>
            </button>
        </div>
        <div v-if="selected.length" class="pbg-hpo-selected" aria-label="Selected phenotype names">
            <span v-for="id in selected" :key="id">{{ label(id) }} <code>{{ id }}</code></span>
        </div>
    </div>
</template>
<script>
import { hpoLabel, hpoSuggestions, selectHpoSuggestion } from "./hpoContextSearch";
export default {
    name: "HpoTermInput",
    props: { value: { type: String, default: "" } },
    data() { return { open: false, active: -1, listId: `hpo-context-options-${this._uid}` }; },
    computed: {
        suggestions() { return hpoSuggestions(this.value); },
        selected() { return [...new Set(String(this.value).toUpperCase().match(/HP:\d{7}/g) || [])]; },
    },
    methods: {
        label: hpoLabel,
        onInput(event) { this.$emit("input", event.target.value); this.open = true; this.active = -1; },
        choose(term) { this.$emit("input", selectHpoSuggestion(this.value, term.id)); this.open = false; this.active = -1; },
        move(direction) {
            this.open = true;
            if (this.suggestions.length) this.active = (this.active + direction + this.suggestions.length) % this.suggestions.length;
        },
        onEnter(event) {
            if (this.open && this.suggestions.length) {
                event.preventDefault();
                this.choose(this.suggestions[this.active < 0 ? 0 : this.active]);
            }
        },
    },
};
</script>
<style scoped>
.pbg-hpo-input-shell { position: relative; min-width: 0; }
.pbg-hpo-input-shell input { width: 100%; box-sizing: border-box; min-width: 0; padding: .52rem .7rem; border: 1px solid #aebfd1; border-radius: .35rem; color: #183a5d; font-size: .95rem; }
.pbg-hpo-suggestions { position: absolute; top: 100%; left: 0; right: 0; z-index: 30; background: white; border: 1px solid #b7c9dc; border-radius: 6px; box-shadow: 0 8px 24px rgba(16,35,63,.18); }
.pbg-hpo-suggestions button { display: flex; justify-content: space-between; gap: 12px; width: 100%; padding: 10px 12px; text-align: left; color: #183a5d; background: white; border: 0; cursor: pointer; }
.pbg-hpo-suggestions button:hover, .pbg-hpo-suggestions button:focus, .pbg-hpo-suggestions button[aria-selected="true"] { background: #edf7ff; }
.pbg-hpo-suggestions small { color: #6b7e93; white-space: nowrap; }
.pbg-hpo-selected { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.pbg-hpo-selected span { font-size: 12px; background: #edf7ff; padding: 3px 6px; border-radius: 4px; }
</style>
