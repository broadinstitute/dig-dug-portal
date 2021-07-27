<template>
    <div>
        <b-table small :fields="fields" :items="items" responsive="sm">
            <template slot="bottom-row" slot-scope="data">
                <td>
                    <input
                        v-model.number="$store.state.prior"
                        type="number"
                        placeholder="Prior Variance"
                        id="prior_input"
                        @input-change="$emit('input-change', $event)"
                    />
                </td>
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
import Formatters from "@/utils/formatters";

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
                {
                    key: "posteriorProbability",
                    label: "Posterior probability",
                    formatter: this.pValueFormatter
                }
            ],
            items: [
                {
                    suggestedPrior: 0.2,
                    huGeScore: this.hugeScore,
                    posteriorProbability: this.posteriorProbability(0.2)
                },
                {
                    suggestedPrior: 0.05,
                    huGeScore: this.hugeScore,
                    posteriorProbability: this.posteriorProbability(0.05)
                },
                {
                    suggestedPrior: 0.3696,
                    huGeScore: this.hugeScore,
                    posteriorProbability: this.posteriorProbability(0.3696)
                }
            ]
        };
    },
    computed: {},
    methods: {
        pValueFormatter(pValue) {
            return Formatters.pValueFormatter(pValue);
        },
        posteriorProbability(p) {
            let bayes_factor = this.hugeScore; //combined bayes factor
            let f5 = p / (1 - p);
            let p0 = bayes_factor * f5;
            let ppa = p0 / (1 + p0);
            return ppa;
        }
    }
});
</script>
