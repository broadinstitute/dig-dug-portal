<template>
    <vue-typeahead-bootstrap
        v-model="query"
        ref="optionSelect"
        placeholder="Type in a gene..."
        :data="geneOptions"
        @hit="onOptionSelected($event)"
    >
        <template slot="suggestion" slot-scope="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
            <small class="text-secondary">{{ data }}</small>
        </template>
    </vue-typeahead-bootstrap>
</template>

<script>
import Vue from "vue";
import _ from "lodash";

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
            query: this.defaultGene || null
        };
    },
    computed: {
        geneOptions() {
            if (!this.matchedGenes) {
                return [];
            }
            return this.matchedGenes;
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
