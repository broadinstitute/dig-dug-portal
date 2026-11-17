<template>
    <section class="pbp-profile-editor" aria-label="Phenotype search conditions">
        <div class="pbp-unified-top">
            <form class="pbp-unified-search" :class="{ 'is-disabled': advancedOpen }" role="search" aria-label="Add an included or excluded phenotype" @submit.prevent="search">
                <div class="pbp-mode-control" @keydown.esc="modeOpen = false">
                    <button type="button" class="pbp-mode-toggle" :disabled="advancedOpen" :class="{ excluding: mode === 'exclude' }" aria-haspopup="menu" :aria-expanded="String(modeOpen)" @click="modeOpen = !modeOpen; open = false">{{ mode === 'exclude' ? 'Exclude' : 'Include' }} <b-icon-caret-down-fill aria-hidden="true" /></button>
                    <div v-if="!advancedOpen && modeOpen" class="pbp-mode-menu" role="menu" aria-label="What the phenotype does">
                        <button type="button" role="menuitemradio" :aria-checked="String(mode === 'include')" @click="setMode('include')"><strong>Include</strong><span>samples that have this phenotype</span></button>
                        <button type="button" role="menuitemradio" :aria-checked="String(mode === 'exclude')" class="excluding" @click="setMode('exclude')"><strong>Exclude</strong><span>remove samples that have it</span></button>
                    </div>
                </div>
                <div class="pbp-unified-input">
                    <input :id="inputId" :disabled="advancedOpen" v-model="query" role="combobox" aria-label="Search phenotype names or HPO IDs" aria-autocomplete="list" :aria-expanded="String(!advancedOpen && open && suggestions.length > 0)" :aria-controls="listId" :aria-activedescendant="!advancedOpen && open && suggestions[active] ? `${listId}-${active}` : null" autocomplete="off" spellcheck="false" placeholder="Search phenotype names or HPO IDs"
                        @input="open = true; modeOpen = false; active = 0" @focus="open = true" @blur="open = false" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="onEnter" @keydown.esc.prevent="open = false" />
                    <button v-if="query" type="button" class="pbp-query-clear" :disabled="advancedOpen" aria-label="Clear search text" @click="query = ''; open = false"><b-icon-x aria-hidden="true" /></button>
                    <div v-if="!advancedOpen && open && suggestions.length" :id="listId" class="pbp-suggestion-list" role="listbox" aria-label="Matching phenotypes and CRDC sample counts">
                        <button v-for="(item, index) in suggestions" :id="`${listId}-${index}`" :key="item.id" type="button" role="option" :aria-selected="String(active === index)" :disabled="!availability(item.id).enabled" @mousedown.prevent @click="choose(item.id)">
                            <span class="pbp-suggestion-name"><span><template v-for="(part, i) in highlight(item.name)"><strong v-if="part.match" :key="i">{{ part.text }}</strong><span v-else :key="i">{{ part.text }}</span></template></span><small>{{ item.id }}</small></span>
                            <span class="pbp-suggestion-count">{{ countLabel(item.id) }}</span>
                        </button>
                        <p v-if="countsStatus === 'error'" class="pbp-counts-note">CRDC sample counts are temporarily unavailable.</p>
                    </div>
                </div>
                <button type="submit" class="pbp-unified-submit" :disabled="advancedOpen" @mousedown.prevent>Search</button>
            </form>
            <button type="button" class="pbp-advanced-toggle" :class="{ active: advancedOpen }" :aria-expanded="String(advancedOpen)" :aria-controls="panelId" @click="toggleAdvanced">Advanced search <span v-if="limitCount" class="pbp-filter-count">{{ limitCount }}</span><b-icon-chevron-up v-if="advancedOpen" aria-hidden="true" /></button>
        </div>
        <p v-if="error" class="pbp-editor-error" role="alert">{{ error }}</p><p v-if="countsStatus === 'error'" class="pbp-editor-error" role="status">CRDC sample availability is unavailable. <button type="button" class="pbp-search-text-button" @click="$emit('retry-counts')">Retry availability check</button></p>
        <p v-if="refinementChange && !advancedOpen" class="pbp-refinement-feedback" :class="{ 'is-excluded': refinementChange.exclude }" role="status"><strong>Search updated</strong> · {{ refinementChange.exclude ? 'Without' : 'Includes' }} · {{ name(refinementChange.id) }} · {{ refinementChange.id }}</p>


        <div v-if="advancedOpen" :id="panelId" class="pbp-advanced-builder">
            <h3>Find samples where</h3>
            <div class="pbp-include-group">
                <p v-if="includedPhenotypeCount > 1" class="pbp-include-group-label">Included phenotypes <span>Match {{ draftMatch === 'any' ? 'any' : draftMatch === 'all' ? 'all' : `at least ${draftMinimum} of ${includedPhenotypeCount}` }}</span></p>
                <div v-for="row in orderedRows" :key="row.key" class="pbp-condition-row">
                    <span class="pbp-condition-join">{{ isIncluded(row) ? '' : 'AND' }}</span>
                    <select v-model="row.field" :aria-label="`Condition ${row.key} field`" @change="changeField(row)"><option v-for="field in fields" :key="field.value" :value="field.value">{{ field.label }}</option></select>
                    <select v-model="row.operator" :aria-label="`Condition ${row.key} operator`" :class="{ excluding: row.field === 'phenotype' && row.operator === 'exclude' }"><option v-for="item in fieldOperators(row)" :key="item.value" :value="item.value">{{ item.label }}</option></select>
                    <phenotype-term-picker v-if="row.field === 'phenotype'" v-model="row.value" :input-label="`Condition ${row.key} phenotype`" :search-index="searchIndex" :terms="terms" :sample-counts="sampleCounts" :counts-status="countsStatus" />
                    <div v-else-if="row.field === 'age' && row.operator === 'between'" class="pbp-age-range"><input v-model="row.value" type="number" min="0" max="100" step="any" :aria-label="`Condition ${row.key} minimum age`" placeholder="Min" /><span>and</span><input v-model="row.max" type="number" min="0" max="100" step="any" :aria-label="`Condition ${row.key} maximum age`" placeholder="Max" /></div>
                    <select v-else-if="row.field === 'sex'" v-model="row.value" :aria-label="`Condition ${row.key} sex`"><option value="">Choose sex</option><option value="female">Female</option><option value="male">Male</option><option value="unknown">Unknown</option></select>
                    <select v-else-if="row.field === 'affected'" v-model="row.value" :aria-label="`Condition ${row.key} affected status`"><option value="">Choose status</option><option value="Y">Yes</option><option value="N">No</option><option value="unknown">Unknown</option></select>
                    <input v-else v-model="row.value" :list="row.field === 'investigator' ? `${panelId}-investigators` : row.field === 'project' ? `${panelId}-projects` : null" :aria-label="`Condition ${row.key} value`" :placeholder="row.field === 'age' ? 'Age in years, or Unknown' : row.field === 'project' ? 'Choose a project' : 'Enter a value'" />
                    <button type="button" class="pbp-condition-remove" :aria-label="`Remove condition ${row.key}`" @click="draftRows = draftRows.filter(item => item.key !== row.key)"><b-icon-x aria-hidden="true" /></button>
                </div>
            </div>
            <datalist :id="`${panelId}-investigators`"><option v-for="value in investigators" :key="value" :value="value" /></datalist><datalist :id="`${panelId}-projects`"><option v-for="value in projects" :key="value" :value="value" /></datalist>
            <div class="pbp-builder-footer"><div class="pbp-builder-links"><button type="button" class="pbp-search-text-button" @click="addRule">+ Add a line</button><button type="button" class="pbp-search-text-button" @click="draftRows = []; draftMatch = 'all'">Clear all</button></div><div class="pbp-builder-execute"><div v-if="includedPhenotypeCount > 1" class="pbp-builder-match"><span>Included phenotypes must match</span><select v-model="draftMatch" aria-label="Advanced included phenotype matching"><option value="all">All (AND)</option><option value="any">Any (OR)</option><option v-if="includedPhenotypeCount > 2" value="atLeastTwo">Custom</option></select><label v-if="draftMatch === 'atLeastTwo'" class="pbp-custom-match">At least <input v-model.number="draftMinimum" type="number" min="1" :max="includedPhenotypeCount" step="1" aria-label="Minimum included phenotypes" /> of {{ includedPhenotypeCount }}</label></div><button type="button" class="pbp-builder-apply" @click="apply">Apply</button></div></div>
        </div>
        <div v-if="summary.ids.length || summary.excluded.length || limitedRules.length" class="pbp-search-summary" aria-label="Current search conditions">
            <div v-if="summary.ids.length" class="pbp-summary-row pbp-summary-includes">
                <strong class="pbp-summary-label">Samples with</strong>
                <div class="pbp-condition-chips">
                    <span v-for="(id, index) in summary.ids" :key="id" class="pbp-search-chip" :class="{ 'pbp-search-chip-added': refinementChange && !refinementChange.exclude && refinementChange.id === id }" :style="chipStyle(id, index)"><span><b>{{ name(id) }}</b><small>{{ id }}</small></span><button type="button" :aria-label="`Remove included ${name(id)}`" @click="removePhenotype(id, false)"><b-icon-x aria-hidden="true" /></button></span>
                </div>

            </div>
            <div v-if="summary.ids.length > 1" class="pbp-match-summary" aria-label="Phenotype matching rule"><span>{{ advancedOpen ? 'Draft matching rule' : 'Matching rule' }}</span><strong>{{ summaryMatchingRule.label }}</strong><span>{{ summaryMatchingRule.description }}</span></div>
            <div v-if="limitCount" class="pbp-summary-row pbp-summary-limits"><strong class="pbp-summary-label">Limited to</strong><div class="pbp-condition-chips"><span v-for="(row, index) in limitedRules" :key="`rule-${index}`" class="pbp-limit-chip" :class="{ 'pbp-limit-chip-excluded': row.operator === 'exclude' }"><span><template v-if="row.field === 'phenotype'"><b>{{ describe(row) }}</b><small>{{ row.value }}</small></template><template v-else>{{ describe(row) }}</template></span><button type="button" :aria-label="`Remove ${describe(row)}`" @click="removeLimit(index)"><b-icon-x aria-hidden="true" /></button></span><span v-for="id in summary.excluded" :key="`excluded-${id}`" class="pbp-search-chip pbp-search-chip-excluded"><span><b>Without · {{ name(id) }}</b><small>{{ id }}</small></span><button type="button" :aria-label="`Remove excluded ${name(id)}`" @click="removePhenotype(id, true)"><b-icon-x aria-hidden="true" /></button></span></div><button type="button" class="pbp-search-text-button" @click="clearAll">Clear all</button></div>
        </div>

    </section>
</template>

<script>
import { hpoSuggestions, resolveIndexedHpo } from './hpoSearch';
import PhenotypeTermPicker from './PhenotypeTermPicker.vue';
import { FIELDS, operators, normalizeRules, ruleLabel } from './profileFilters';
import { describeMatchingRule } from './matchingRule';
import { hpoAvailability, validateCrdcHpos } from './hpoAvailability';
const CHIP_COLORS = [
    { '--tbg': '#fff3d7', '--tbd': '#ffcf75', '--tc': '#a86300' },
    { '--tbg': '#eaf3ff', '--tbd': '#b7d7ff', '--tc': '#175b9b' },
    { '--tbg': '#e3f5ed', '--tbd': '#aae0c4', '--tc': '#1a8054' },
];
export default {
    name: 'PhenotypeProfileEditor',
    components: { PhenotypeTermPicker },
    props: {
        ids: { type: Array, required: true }, excluded: { type: Array, default: () => [] }, rules: { type: Array, default: () => [] },
        refinementChange: { type: Object, default: null },
        matchMode: { type: String, default: 'all' }, minimum: { type: Number, default: 2 },
        searchIndex: { type: Object, required: true }, terms: { type: Object, required: true },
        sampleCounts: { type: Object, default: null }, countsStatus: { type: String, default: 'loading' },
        investigators: { type: Array, default: () => [] }, projects: { type: Array, default: () => [] }, termStyle: { type: Function, default: null },
    },
    data() { return { query: '', mode: 'include', modeOpen: false, open: false, active: 0, advancedOpen: false, draftRows: [], draftMatch: this.matchMode, draftMinimum: this.minimum, error: '', nextRule: 0,
        inputId: `pbp-search-${this._uid}`, listId: `pbp-search-options-${this._uid}`, panelId: `pbp-advanced-${this._uid}`, fields: FIELDS }; },
    watch: { includedPhenotypeCount(count) { if (count <= 2 && this.draftMatch === 'atLeastTwo') this.draftMatch = this.canonicalMatch(this.draftMatch, this.draftMinimum, count); }, ids: { deep: true, handler: 'refreshDraft' }, excluded: { deep: true, handler: 'refreshDraft' }, rules: { deep: true, handler: 'refreshDraft' }, matchMode: 'refreshDraft', minimum: 'refreshDraft' },
    computed: {
        suggestions() { return hpoSuggestions(this.searchIndex, this.query, 8); },
        includedRows() { return this.draftRows.filter(this.isIncluded); },
        includedPhenotypeCount() { return new Set(this.includedRows.map(row => this.resolve(row.value)).filter(Boolean)).size; },
        orderedRows() { return [...this.includedRows, ...this.draftRows.filter(row => !this.isIncluded(row))]; },
        summary() {
            if (this.advancedOpen) {
                const ids = [...new Set(this.includedRows.map(row => this.resolve(row.value)).filter(Boolean))];
                const excluded = [...new Set(this.draftRows.filter(row => row.field === 'phenotype' && row.operator === 'exclude').map(row => this.resolve(row.value)).filter(Boolean))];
                return { ids, excluded, rules: this.draftRows.filter(row => (row.field !== 'phenotype' || row.required === true) && String(row.value).trim()), matchMode: this.draftMatch, minimum: this.clampMinimum(this.draftMinimum, ids.length) };
            }
            return { ids: this.ids, excluded: this.excluded, rules: this.rules.filter(row => (row.field !== 'phenotype' || row.required === true)), matchMode: this.matchMode, minimum: this.clampMinimum(this.minimum, this.ids.length) };
        },
        limitedRules() { return this.summary.rules.filter(row => !(row.field === 'phenotype' && row.operator === 'exclude')); },
        limitCount() { return this.limitedRules.length + this.summary.excluded.length; },
        summaryMatchingRule() { return describeMatchingRule(this.summary.matchMode, this.summary.minimum, this.summary.ids.length); },
    },
    methods: {
        name(id) { return this.terms[id]?.[0] || id; },
        resolve(value) { const id = resolveIndexedHpo(this.searchIndex, value); return this.terms[id] ? id : ''; },
        chipStyle(id, index) { return this.termStyle ? this.termStyle(id) : CHIP_COLORS[index % CHIP_COLORS.length]; },
        describe(row) { return row.field === 'phenotype' ? `${row.operator === 'exclude' ? 'Without' : 'Includes'} · ${this.name(row.value)}` : ruleLabel(row, this.name); },
        isIncluded(row) { return row.field === 'phenotype' && row.operator === 'contains' && row.required !== true; },
        clampMinimum(value, count) { return Math.max(1, Math.min(count || 1, Number.isInteger(Number(value)) ? Number(value) : 2)); },
        fieldOperators(row) {
            // Existing URL operators remain editable; new lines use the mockup's defaults.
            if (row.field === 'age') return row.operator === 'between' ? [operators('age')[0]] : operators('age');
            if ((row.field !== 'phenotype' || row.required === true) && row.operator === 'is') return [{ value: 'is', label: 'is' }];
            return operators(row.field);
        },
        emptyRule() { return { key: ++this.nextRule, field: 'phenotype', operator: 'contains', value: '', max: '' }; },
        hydrate() {
            this.draftRows = this.ids.map(id => ({ ...this.emptyRule(), value: id }));
            this.excluded.forEach(id => this.draftRows.push({ ...this.emptyRule(), operator: 'exclude', value: id }));
            this.rules.forEach(row => { if ((row.field !== 'phenotype' || row.required === true) || !this.draftRows.some(item => item.field === 'phenotype' && item.operator === row.operator && item.value === row.value)) this.draftRows.push({ ...row, key: ++this.nextRule }); });
            if (!this.draftRows.length) this.draftRows = [this.emptyRule()];
            this.draftMinimum = this.clampMinimum(this.minimum, this.includedPhenotypeCount); this.draftMatch = this.canonicalMatch(this.matchMode, this.draftMinimum, this.includedPhenotypeCount);
        },
        refreshDraft() { if (this.advancedOpen) this.hydrate(); },
        toggleAdvanced() { this.error = ''; this.query = ''; this.open = false; this.modeOpen = false; if (!this.advancedOpen) this.hydrate(); this.advancedOpen = !this.advancedOpen; },
        setMode(mode) { this.mode = mode; this.modeOpen = false; },
        move(direction) { if (!this.open) { this.open = true; this.active = direction > 0 ? 0 : Math.max(0, this.suggestions.length - 1); } else if (this.suggestions.length) this.active = (this.active + direction + this.suggestions.length) % this.suggestions.length; },
        highlight(label) {
            const query = this.query.trim().toLowerCase(), index = label.toLowerCase().indexOf(query);
            if (!query || index < 0) return [{ text: label, match: false }];
            return [{ text: label.slice(0, index), match: false }, { text: label.slice(index, index + query.length), match: true }, { text: label.slice(index + query.length), match: false }];
        },
        availability(id) { return hpoAvailability(id, this.sampleCounts, this.countsStatus); },
        countLabel(id) { return this.availability(id).reason; },
        canonicalMatch(mode, minimum, count) { return mode === 'any' || (mode === 'atLeastTwo' && Number(minimum) === 1) ? 'any' : mode === 'all' || (count > 1 && mode === 'atLeastTwo' && Number(minimum) >= count) ? 'all' : 'atLeastTwo'; },
        search() {
            if (this.advancedOpen) return;
            this.error = '';
            const id = this.resolve(this.query);
            if (id) this.choose(id);
            else if (this.query.trim()) { this.open = true; if (!this.suggestions.length) this.error = 'No matching HPO terms. Check the phenotype name or HPO ID.'; }
        },
        onEnter() { if (this.advancedOpen) return; if (this.open && this.suggestions[this.active]) this.choose(this.suggestions[this.active].id); else this.search(); },
        choose(id) {
            this.error = '';
            if (!this.terms[id]) return;
            const availability = this.availability(id);
            if (!availability.enabled) { this.open = false; this.error = `${this.name(id)} (${id}): ${availability.reason}. Each HPO needs at least 1 CRDC sample.`; return; }
            if (this.advancedOpen) {
                const operator = this.mode === 'exclude' ? 'exclude' : 'contains';
                if (!this.draftRows.some(row => row.field === 'phenotype' && row.operator === operator && this.resolve(row.value) === id)) this.draftRows.push({ ...this.emptyRule(), operator, value: id });
                this.query = ''; this.open = false;
                return;
            }
            const state = { ids: [...this.ids], excluded: [...this.excluded], rules: this.rules.filter(row => !(row.field === 'phenotype' && row.value === id)), matchMode: this.matchMode, minimum: this.minimum };
            if (this.mode === 'exclude') { state.ids = state.ids.filter(value => value !== id); if (!state.excluded.includes(id)) state.excluded.push(id); }
            else { state.excluded = state.excluded.filter(value => value !== id); if (!state.ids.includes(id)) state.ids.push(id); }
            if (!this.emitState(state)) return;
            this.query = ''; this.open = false;
        },
        emitState(state, allowEmpty = false, skipAvailability = false) {
            if (!state.ids.length && !allowEmpty) { this.error = 'Include at least one phenotype to search for matching samples.'; return false; }
            if (state.ids.length > 20) { this.error = 'Use up to 20 included phenotypes.'; return false; }
            if (state.ids.some(id => state.excluded.includes(id))) { this.error = 'A phenotype cannot be both included and excluded.'; return false; }
            if (!skipAvailability) { try { validateCrdcHpos([...state.ids, ...state.excluded, ...state.rules.filter(row => row.field === 'phenotype').map(row => row.value)], this.sampleCounts, this.countsStatus, this.name); } catch (error) { this.error = error.message; return false; } }
            state.matchMode = this.canonicalMatch(state.matchMode, state.minimum, state.ids.length);
            state.minimum = state.ids.length > 1 ? this.clampMinimum(state.minimum, state.ids.length) : Math.max(1, Number(state.minimum) || 2);
            this.$emit('apply', state); return true;
        },

        addRule() { this.draftRows.push(this.emptyRule()); },
        changeField(row) { row.value = ''; row.max = ''; row.operator = row.field === 'phenotype' ? 'contains' : row.field === 'age' ? 'between' : 'is'; },
        setMatch(mode) { if (this.advancedOpen) this.draftMatch = mode; },
        removePhenotype(id, excluded) {
            if (this.advancedOpen) { this.draftRows = this.draftRows.filter(row => !(row.field === 'phenotype' && this.resolve(row.value) === id && (row.operator === 'exclude') === excluded)); return; }
            const ids = excluded ? [...this.ids] : this.ids.filter(value => value !== id);
            if (!ids.length) { this.clearAll(); return; }
            this.emitState({ ids, excluded: excluded ? this.excluded.filter(value => value !== id) : [...this.excluded], rules: this.rules.filter(row => !(row.field === 'phenotype' && row.value === id)), matchMode: this.matchMode, minimum: this.minimum }, false, true);
        },
        removeLimit(index) { if (this.advancedOpen) this.draftRows = this.draftRows.filter(row => row !== this.limitedRules[index]); else { const target = this.limitedRules[index]; this.emitState({ ids: [...this.ids], excluded: [...this.excluded], rules: this.rules.filter(row => row !== target), matchMode: this.matchMode, minimum: this.minimum }); } },
        clearAll() { this.error = ''; this.query = ''; this.draftRows = []; this.advancedOpen = false; this.emitState({ ids: [], excluded: [], rules: [], matchMode: 'all', minimum: 2 }, true); },
        apply(close = true) {
            this.error = '';
            try {
                if (this.draftMatch === 'atLeastTwo' && (!Number.isInteger(this.draftMinimum) || this.draftMinimum < 1 || this.draftMinimum > this.includedPhenotypeCount)) throw new Error(`Enter a whole minimum from 1 to ${this.includedPhenotypeCount}.`);
                const rules = normalizeRules(this.draftRows, this.resolve);
                const ids = [...new Set(rules.filter(this.isIncluded).map(row => row.value))];
                const excluded = [...new Set(rules.filter(row => row.field === 'phenotype' && row.operator === 'exclude').map(row => row.value))];
                const state = { ids, excluded, rules: rules.filter(row => (row.field !== 'phenotype' || row.required === true)), matchMode: this.draftMatch, minimum: this.draftMinimum };
                if (!this.emitState(state, !rules.length)) return;
                if (close) this.advancedOpen = false;
            } catch (error) { this.error = error.message; }
        },
    },
};
</script>
<style src="./profileEditor.css"></style>
