<template>
    <div>
        <div>
            <b-table borderless small thead-class="hidden_header" :items="items" :fields="fields">
                <template #cell(tag)="data">
                    <div style="color:gray">{{ data.item.tag }}</div>
                </template>
                <template v-slot:custom-foot="data">
                    <b-tr>
                        <b-td style="text-align: right; font-weight:bold">HuGe Score:</b-td>
                        <b-td style=" text-align: right; background: #e4f4e4;">{{hugescore}}</b-td>
                        <b-td></b-td>
                    </b-tr>
                </template>
            </b-table>
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
            fields: [
                { key: "pretag", tdClass: "text-right" },
                { key: "bf", tdClass: "text-right" },
                { key: "tag", tdClass: "text-left" }
            ],
            items: [
                {
                    pretag: "",
                    _cellVariants: { bf: "info" },
                    bf: this.commonBF,
                    tag: "<--Common Variation BF"
                },
                {
                    pretag: "X",
                    bf: this.rareBF,
                    _cellVariants: { bf: "warning" },
                    tag: "<--Rare Variation BF"
                }
            ],
            visibleRows: []
        };
    },
    computed: {
        hugescore() {
            return this.hugeScore;
        }
    },
    methods: {}
});
</script>

<style>
.hidden_header {
    display: none;
}
</style>