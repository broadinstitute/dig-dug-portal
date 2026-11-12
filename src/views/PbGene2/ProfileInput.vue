<template>
    <div class="pbg-hpo-input-shell pg2-profile-input">
        <span v-for="id in selected" :key="id" class="pg2-profile-token"><span>{{ label(id) }} · {{ id }}</span><button type="button" :aria-label="'Remove ' + label(id)" @click="remove(id)"><b-icon-x aria-hidden="true" /></button></span>
        <input :value="query" type="text" aria-label="HPO context terms" aria-labelledby="pg2-profile-input-label"
               role="combobox" aria-autocomplete="list" :aria-expanded="String(open && suggestions.length > 0)"
               :aria-controls="listId" :aria-activedescendant="active >= 0 ? listId + '-' + active : null"
               autocomplete="off" spellcheck="false" :placeholder="selected.length ? 'Add another phenotype' : 'Search phenotype names or enter HPO IDs'"
               @input="edit" @focus="open = true" @blur="finish" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter="onEnter" @keydown.esc.prevent="open = false">
        <div v-if="open && suggestions.length" :id="listId" class="pbg-hpo-suggestions" role="listbox" aria-label="Phenotype suggestions">
            <button v-for="(term, index) in suggestions" :id="listId + '-' + index" :key="term.id" type="button" role="option" :aria-selected="String(active === index)" @mousedown.prevent @click="choose(term)"><strong>{{ term.label }}</strong><small>{{ term.id }}</small></button>
        </div>
    </div>
</template>
<script>
import HpoTermInput from '../PbGene/HpoTermInput';
import { hpoSuggestions } from '../PbGene/hpoContextSearch';
export default {
    name: 'Gene2ProfileInput',
    extends: HpoTermInput,
    data: () => ({ query: '' }),
    computed: { suggestions() { return this.query.trim() ? hpoSuggestions(this.query) : []; } },
    watch: { value(value) { if (!value) this.query = ''; } },
    methods: {
        resetDraft() { this.query = ''; this.open = false; this.active = -1; },
        edit(event) { this.query = event.target.value; this.open = true; this.active = -1; this.$emit('input', [...this.selected, this.query].filter(Boolean).join(', ')); },
        choose(term) { this.$emit('input', [...new Set([...this.selected, term.id])].join(', ')); this.query = ''; this.open = false; this.active = -1; },
        finish() { if (/^(?:HP:\d{7}[,;\s]*)+$/i.test(this.query.trim())) { this.$emit('input', [...new Set(this.selected)].join(', ')); this.query = ''; } this.open = false; },
        remove(id) { if (this.query.toUpperCase().includes(id)) this.query = ''; this.$emit('input', this.selected.filter(term => term !== id).join(', ')); },
    },
};
</script>
