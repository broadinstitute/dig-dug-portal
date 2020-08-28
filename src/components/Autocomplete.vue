<template>
    <div>
        <vue-typeahead-bootstrap
            v-model="userInput"
            :data="lookupOptions"
            :placeholder="placeholder"
            @hit="onAutoCompleteItemSelected($event)"
            @keyup.enter="onUserEnterNonAutoCompleteItem"
        >
            <template slot="suggestion" slot-scope="{ data, htmlText }">
                <span v-html="htmlText"></span>&nbsp;
                <small v-if="secondaryKey" class="text-secondary">{{ data[secondaryKey] }}</small>
            </template>
        </vue-typeahead-bootstrap>
    </div>
</template>

<script>
import Vue from "vue";
import _ from "lodash";
import { debounce } from "lodash";
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
    props: ["matches", "placeholder", "secondaryKey"],

    data() {
        return {
            userInput: this.initialText || null,
            selectedItem: null,
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
        serializer(item) {
            if (!this.matchkey) {
                return item;
            } else {
                return this.matchkey;
            }
        },
        onAutoCompleteItemSelected(item) {
            //return object if phenotype?

            this.selectedItem = item;
            this.userText = null;

            this.$emit("item-select", item);
        },

        onUserEnterNonAutoCompleteItem() {
            this.$emit("keyup-enter", this.userInput);
        },
    },

    watch: {
        userInput(text) {
            this.$emit("input-change", text);
        },
    },
});
</script>
