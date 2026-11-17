<template>
    <form @submit.prevent="submit">
        <input v-model.trim="draft" :aria-label="inputLabel" :placeholder="placeholder"
            :list="searchIndex ? listId : null" autocomplete="off"
            @input="onInput" @change="onChange" />
        <button type="submit" :class="buttonClass">{{ buttonLabel }}</button>
        <datalist v-if="searchIndex" :id="listId">
            <option v-for="item in suggestions" :key="item.id" :value="`${item.name} [${item.id}]`" />
        </datalist>
    </form>
</template>

<script>
import { hpoSuggestions, resolveIndexedHpo } from './hpoSearch';

// Editing a draft must not render/recompute the phenotype results. Only a
// submitted query or a completed HPO selection is sent to the parent page.
export default {
    name: 'PhenotypeQueryInput',
    props: {
        value: { type: String, default: '' },
        searchIndex: { type: Object, default: null },
        inputLabel: { type: String, required: true },
        placeholder: { type: String, default: '' },
        buttonLabel: { type: String, default: '+' },
        buttonClass: { type: String, default: '' },
    },
    data() { return { draft: this.value, listId: `pbp-hpo-${this._uid}` }; },
    watch: { value(value) { this.draft = value; } },
    computed: {
        suggestions() { return this.searchIndex ? hpoSuggestions(this.searchIndex, this.draft) : []; },
    },
    methods: {
        onInput(event) {
            if (event.target.composing) return;
            if (this.searchIndex && (/^HP:\d{7}$/i.test(this.draft) || /\[HP:\d{7}\]$/i.test(this.draft))) this.submit();
        },
        onChange() { if (this.searchIndex) this.submit(); },
        submit() {
            if (!this.searchIndex) { this.$emit('submit', this.draft); return; }
            const id = resolveIndexedHpo(this.searchIndex, this.draft);
            if (!id) return;
            this.draft = '';
            this.$emit('select', id);
        },
    },
};
</script>
