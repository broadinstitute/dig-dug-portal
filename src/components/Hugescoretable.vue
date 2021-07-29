<template>
    <div>
        <div>
            <b-table small thead-class="hidden_header" :items="items"></b-table>
        </div>
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

export default Vue.component("hugescore-table", {
    props: {
        commonBF: {
            type: Number,
            required: true,
            default: 1
        },
        rareBF: {
            type: Number,
            required: true,
            default: 1
        },
        hugeScore: {
            type: Number,
            required: true,
            default: 1
        }
    },

    data() {
        return {
            items: [
                {
                    age: 89,

                    _rowVariant: "danger"
                },
                {
                    age: 40,

                    _cellVariants: { age: "info" }
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

<style>
.hidden_header {
    display: none;
}
</style>