<template>
    <div>
        <b-table small :fields="fields" :items="items" responsive="sm">
            <template #head(huGeScore)="data">
                <span style="color:#3fb54a ">{{ data.label }}</span>
            </template>
            <template #cell(huGeScore)="data">
                <div style="color:#3fb54a ">{{ data.item.huGeScore }}</div>
            </template>
            <template slot="bottom-row" slot-scope="data">
                <td>
                    <input
                        v-model.number="suggestedPriorinput"
                        type="number"
                        placeholder="Prior Variance"
                        id="prior_input"
                        @keyup.enter="addToItems($event)"
                    />
                </td>

                <!-- <td>
                    <b-button
                        style="background: gray; cursor: pointer;"
                        v-on:click="resetPrior(data.item)"
                    >Reset prior</b-button>
                </td>-->
            </template>
            <!-- <template slot="removeItem" slot-scope="data">
                <div
                    :class="value > 0.3696 ? 'text-success' : 'text-danger'"
                >{{ value.toFixed(2) }} EUR</div>
            </template>-->
            <template #cell(removeItem)="data">
                <b-button
                    style="padding: 0;border: none;background: none; cursor: pointer;"
                    v-on:click="removeItems(data.item)"
                >
                    <span style="color: green; background:white">
                        <b-icon-x-circle-fill></b-icon-x-circle-fill>
                    </span>
                </b-button>
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
            suggestedPriorinput: "Prior",
            // resetflag: { default: false },
            fields: [
                { key: "suggestedPrior", label: "Suggested prior" },

                {
                    key: "huGeScore",
                    label: "HuGe Score"
                },

                {
                    key: "posteriorProbability",
                    label: "Posterior probability",
                    formatter: this.pValueFormatter
                },
                {
                    key: "removeItem",
                    label: ""
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
        addToItems(event) {
            var my_object = {
                suggestedPrior: this.suggestedPriorinput,
                huGeScore: this.hugeScore,
                posteriorProbability: this.posteriorProbability(
                    this.suggestedPriorinput
                )
            };
            this.items.push(my_object);
            this.$store.dispatch("addSuggestedPriorLines", {
                suggestedPrior: this.suggestedPriorinput,
                color: "green"
            });
        },
        removeItems(item) {
            this.items.pop(item);
        },

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

<style scoped>
.enable {
    background-color: rgb(204, 241, 241);
}
.disable {
    background-color: rgb(114, 129, 129);
}
</style>
