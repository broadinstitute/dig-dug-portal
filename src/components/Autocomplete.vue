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
        <template slot="suggestion" slot-scope="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
            <small v-if="secondaryKey" class="text-secondary">{{
                data[secondaryKey]
            }}</small>
        </template>
    </vue-typeahead-bootstrap>
</template>

<script>
import Vue from "vue";
import { cloneDeep } from "lodash";
import queryString from "query-string";
import host from "@/utils/hostUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import keyParams from "@/utils/keyParams";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

//currently autocompletes only genes
export default Vue.component("autocomplete", {
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
});
</script>
