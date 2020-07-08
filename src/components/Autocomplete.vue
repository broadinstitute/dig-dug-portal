<template>
    <div>
        <vue-typeahead-bootstrap
            v-model="userText"
            :data="lookupOptions"
            ref="optionSelect"
            placeholder="Type in a gene..."
            @hit="onOptionSelected($event)"
        >
            <template slot="suggestion" slot-scope="{ data, htmlText }">
                <span v-html="htmlText"></span>&nbsp;
                <small class="text-secondary">{{ data }}</small>
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
    props: ["userInput", "matchingOutput"],

    data() {
        return {
            // genes: [],
            userText: this.userInput || null
        };
    },
    computed: {
        lookupOptions() {
            if (!this.matchingOutput) {
                return [];
            }
            return this.matchingOutput;
        }
    },

    methods: {
        //currently working only for gene
        onOptionSelected(event) {
            this.$store.dispatch("onGeneChange", event);

            if (this.clearOnSelected) {
                this.userText = null;
            }
        }
    }
});
</script>
