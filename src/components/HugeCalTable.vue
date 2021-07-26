<template>
    <div>
        <b-table small :fields="fields" :items="items" responsive="sm">
            A custom formatted column
            <template #cell(huGeScore)="data">
                <b class="text-info">{{ data.item.huGeScore }}</b>
            </template>

            <!-- A virtual composite column -->
            <template
                #cell(suggestedPrior)="data"
            >{{ data.item.suggestedPrior }} is {{ data.item.huGeScore}} years old</template>

            <!-- Optional default data cell scoped slot -->
            <template #cell(posteriorProbability)="data">
                <i>{{ data.item.posteriorProbability }}</i>
            </template>
        </b-table>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { match } from "@/utils/bioIndexUtils";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("autocomplete", Autocomplete);

export default Vue.component("hugecal-table", {
    props: {
        hugeScore: {
            type: Number,
            required: true,
            default: 0.6
        }
    },

    data() {
        return {
            fields: [
                // A virtual column that doesn't exist in items

                // A column that needs custom formatting
                { key: "suggestedPrior", label: "Suggested prior" },

                // A regular column
                { key: "huGeScore", label: "HuGe Score" },
                // A virtual column made up from two fields
                { key: "posteriorProbability", label: "Posterior probability" }
            ],
            items: [
                {
                    suggestedPrior: 0.2,
                    huGeScore: this.hugeScore,
                    posteriorProbability: 42
                },
                {
                    suggestedPrior: 0.05,
                    huGeScore: this.hugeScore,
                    posteriorProbability: 36
                },

                {
                    suggestedPrior: 0.04,
                    huGeScore: this.hugeScore,
                    posteriorProbability: 62
                }
            ]
        };
    },
    computed: {},
    methods: {}
});
</script>
