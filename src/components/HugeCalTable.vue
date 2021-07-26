<template>
    <div>
        <b-table small :fields="fields" :items="items" responsive="sm">
            <!-- A custom formatted column -->
            <template #cell(name)="data">
                <b class="text-info">{{ data.value.last.toUpperCase() }}</b>,
                <b>{{ data.value.first }}</b>
            </template>

            <!-- A virtual composite column -->
            <template
                #cell(nameage)="data"
            >{{ data.item.name.first }} is {{ data.item.age }} years old</template>

            <!-- Optional default data cell scoped slot -->
            <template #cell()="data">
                <i>{{ data.value }}</i>
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
    props: [],

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
                { name: { first: "John", last: "Doe" }, sex: "Male", age: 42 },
                {
                    name: { first: "Jane", last: "Doe" },
                    sex: "Female",
                    age: 36
                },
                {
                    name: { first: "Rubin", last: "Kincade" },
                    sex: "Male",
                    age: 73
                },
                {
                    name: { first: "Shirley", last: "Partridge" },
                    sex: "Female",
                    age: 62
                }
            ]
        };
    },
    computed: {},
    methods: {}
});
</script>
