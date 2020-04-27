<template>
    <div>
        <vue-typeahead-bootstrap
            v-model="userText"
            :data="phenotypeOptions"
            :serializer="s => s.description"
            @hit="onPhenotypeSelected($event)"
        >
            <template slot="suggestion" slot-scope="{ data, htmlText }">
                <span v-html="htmlText"></span>&nbsp;
                <small class="text-secondary">{{ data.group }}</small>
            </template>
        </vue-typeahead-bootstrap>
    </div>
</template>

<script>
import Vue from "vue";
import _ from "lodash";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import vSelect from "vue-select";

Vue.component("v-select", vSelect);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

import "vue-select/dist/vue-select.css";

export default Vue.component("phenotype-selectpicker", {
    props: ["phenotypes", "clearOnSelected"],

    data() {
        return {
            userText: null,
            selectedPhenotype: null
        };
    },
    computed: {
        phenotypeOptions() {
            if (!this.phenotypes) {
                return [];
            }

            return this.phenotypes.sort((a, b) => {
                if (a.group < b.group) return -1;
                if (b.group < a.group) return 1;

                if (a.description < b.description) return -1;
                if (b.description < a.description) return 1;

                return 0;
            });
        }
    },
    methods: {
        onPhenotypeSelected(event) {
            this.$store.dispatch("onPhenotypeChange", event);

            if (this.clearOnSelected) {
                this.userText = null;
            }
        }
    }
});
</script>
