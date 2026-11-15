<template>
    <div class="pbg-hpo-input-shell pg2-profile-input">
        <span v-for="id in selected" :key="id" class="pg2-profile-token"><span>{{ label(id) }} · <a v-if="linkHpoIds" :href="phenotypeHref(id)" @click.stop>{{ id }}</a><template v-else>{{ id }}</template></span><button type="button" :aria-label="'Remove ' + label(id)" @click="remove(id)"><b-icon-x aria-hidden="true" /></button></span>
        <input :value="query" type="text" aria-label="HPO context terms" aria-labelledby="pg2-profile-input-label"
               role="combobox" aria-autocomplete="list" :aria-expanded="String(open && suggestions.length > 0)"
               :aria-controls="listId" :aria-activedescendant="active >= 0 ? listId + '-' + active : null"
               autocomplete="off" spellcheck="false" :placeholder="selected.length ? 'Add another phenotype' : 'Search phenotype names or enter HPO IDs'"
               @input="edit" @focus="open = true" @blur="finish" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter="onEnter" @keydown.esc.prevent="open = false">
        <div v-if="open && suggestions.length" :id="listId" class="pbg-hpo-suggestions" role="listbox" aria-label="Phenotype suggestions">
            <button v-for="(term, index) in suggestions" :id="listId + '-' + index" :key="term.id" type="button" role="option" :aria-selected="String(active === index)" :disabled="!availability(term.id).enabled" @mousedown.prevent @click="choose(term)"><span>{{ term.label }}<small>{{ term.id }}</small></span><small>{{ availability(term.id).reason }}</small></button>
        </div>
        <p v-if="availabilityError || countsStatus === 'error'" class="pg2-profile-availability-error" role="alert">{{ availabilityError || 'CRDC sample availability could not be checked. Retry before applying this profile.' }} <button v-if="countsStatus === 'error'" type="button" @click="loadAvailability">Retry availability check</button></p>
    </div>
</template>
<script>
import HpoTermInput from '../PbGene/HpoTermInput';
import { hpoSuggestions, resolveHpoTerms } from '../PbGene/hpoContextSearch';
import { hpoAvailability, validateCrdcHpos, loadCrdcHpoCounts } from '../../utils/crdcHpoAvailability';
export default {
    name: 'Gene2ProfileInput',
    extends: HpoTermInput,
    props: { linkHpoIds: { type: Boolean, default: false } },
    data: () => ({ query: '', sampleCounts: null, countsStatus: 'loading', availabilityError: '' }),
    mounted() { this.loadAvailability(); },
    computed: { suggestions() { return this.query.trim() ? hpoSuggestions(this.query) : []; } },
    watch: { value(value) { if (!value) this.query = ''; } },
    methods: {
        phenotypeHref(id) { return '/pb_phenotype.html?query=' + encodeURIComponent(id); },
        async loadAvailability() {
            this.countsStatus = 'loading'; this.availabilityError = '';
            try { this.sampleCounts = await loadCrdcHpoCounts(); this.countsStatus = 'ready'; }
            catch (_) { this.countsStatus = 'error'; this.availabilityError = 'CRDC sample availability could not be checked. Retry before applying this profile.'; }
        },
        availability(id) { return hpoAvailability(id, this.sampleCounts, this.countsStatus); },
        resetDraft() { this.query = ''; this.open = false; this.active = -1; this.availabilityError = ''; },
        edit(event) { this.query = event.target.value; this.open = true; this.active = -1; this.availabilityError = ''; },
        choose(term) {
            if (!this.availability(term.id).enabled) { this.availabilityError = `${term.label}: ${this.availability(term.id).reason}.`; return; }
            this.$emit('input', [...new Set([...this.selected, term.id])].join(', ')); this.resetDraft();
        },
        finish() {
            this.open = false;
            try {
                const terms = [...new Set([...this.selected, ...(this.query.trim() ? resolveHpoTerms(this.query) : [])])];
                validateCrdcHpos(terms, this.sampleCounts, this.countsStatus, this.label);
                this.$emit('input', terms.join(', ')); this.query = ''; this.availabilityError = ''; return true;
            } catch (error) { this.availabilityError = error.message; return false; }
        },
        onEnter(event) {
            if (this.open && this.suggestions.length) { event.preventDefault(); this.choose(this.suggestions[this.active < 0 ? 0 : this.active]); }
            else if (this.finish() === false) event.preventDefault();
        },
        remove(id) { if (this.query.toUpperCase().includes(id)) this.query = ''; this.$emit('input', this.selected.filter(term => term !== id).join(', ')); },
    },
};
</script>
<style scoped>
.pbg-hpo-suggestions button > span { min-width: 0; }
.pbg-hpo-suggestions button > span small { display: block; }
.pbg-hpo-suggestions button:disabled { color: #64748b; background: #f5f7fa; cursor: not-allowed; }
.pbg-hpo-suggestions button > small { max-width: 46%; white-space: normal; font-weight: 400; }
.pg2-profile-availability-error { width: 100%; margin: 8px 0 0; color: #a1342e; font-size: 18px; font-weight: 400; }
.pg2-profile-availability-error button { border: 0; padding: 0; background: transparent; color: #0b66d8; text-decoration: underline; font: inherit; }
</style>
