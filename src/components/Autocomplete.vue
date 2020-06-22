<template>
    <div>
        <vue-typeahead-bootstrap
            v-model="query"
            :data="genes"
            ref="optionSelect"
            placeholder="Type in a gene..."
            @hit="onOptionSelected($event)"
            @input="lookupGene"
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
    props: ["matchedGenes", "clearOnSelected", "defaultGene"],

    data() {
        return {
            query: "",
            genes: [] //users
        };
    },
    // computed: {
    //     query() {
    //         if (!this.matchedGenes) {
    //             return [];
    //         }
    //         return this.matchedGenes;
    //     }
    // },
    // watch: {
    //     query(newQuery) {}
    // },

    methods: {
        lookupGene: debounce(function() {
            let qs = queryString.stringify(
                { q: this.query, limit: 5 },
                { skipNull: true }
            );
            // in practice this action should be debounced
            fetch(`${BIO_INDEX_HOST}/api/bio/match/gene?${qs}`)
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    this.genes = data.data;
                });
        }, 500),

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
