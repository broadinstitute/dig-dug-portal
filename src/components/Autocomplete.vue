<template>
    <vue-typeahead-bootstrap
        ref="autocomplete"
        v-model="userInput"
        :data="lookupOptions"
        :disabled="disabled"
        :placeholder="placeholder"
        :serializer="labelFormatter"
        :showOnFocus="true"
        :maxMatches="1000"
        @hit="onAutoCompleteItemSelected($event)"
        @keyup.enter="onUserEnterNonAutoCompleteItem"
    >
        <template v-slot:suggestion="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
            <small v-if="secondaryKey" class="text-secondary">{{
                data[secondaryKey]
            }}</small>
        </template>
    </vue-typeahead-bootstrap>
</template>

<script>
import { cloneDeep } from "@/utils/lodashUtils";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";

//currently autocompletes only genes
export default {
    name: "autocomplete",
    components: {
        VueTypeaheadBootstrap,
    },
    props: {
        matches: Array,
        placeholder: String,
        secondaryKey: String,
        labelFormatter: {
            type: Function,
            default: (id) => id,
        },
        disabled: Boolean,
    },
    emits: ["item-select", "keyup-enter", "input-change"],
    data() {
        return {
            userInput: this.initialText || "",
            selectedItem: "",
        };
    },

    computed: {
        lookupOptions() {
            if (!this.matches) {
                return [];
            } else {
                return this.matches;
            }
        },
    },

    methods: {
        tap() {
            console.log(arguments);
        },
        formatHTML(html) {
            return this.labelFormatter(cloneDeep(html));
        },
        serializer(item) {
            if (!this.matchkey) {
                return item;
            } else {
                return this.matchkey;
            }
        },
        onAutoCompleteItemSelected(item) {
            this.$emit("item-select", item);
            this.userInput = "";
            this.$refs.autocomplete.inputValue = "";
        },

        onUserEnterNonAutoCompleteItem() {
            this.$emit("keyup-enter", this.userInput);
            this.userInput = "";
            this.$refs.autocomplete.inputValue = "";
        },
    },

    watch: {
        userInput(text) {
            this.$emit("input-change", text);
        },
    },
};
</script>
