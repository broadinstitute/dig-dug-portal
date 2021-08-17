<template>
    <div>
        <b-table-simple borderless fixed small responsive>
            <b-tbody>
                <b-tr>
                    <b-th style="width:70px"></b-th>
                    <b-td
                        style="width:75px;background-color:#D3DBED"
                        class="text-center"
                    >{{commonBF}}</b-td>
                    <b-td style="width:200px;color:gray;" class="text-left"><--Common Variation BF</b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:70px" rowspan="1" class="text-right">X</b-th>
                    <b-td style="width:75px;background-color:#fef8dc" class="text-center">{{rareBF}}</b-td>
                    <b-td style="width:200px;color:gray;" class="text-left"><--Rare Variation BF</b-td>
                </b-tr>
            </b-tbody>
            <!-- <hr style="padding:-20px;width:550px;text-align:right;margin-left:20px" /> -->
            <b-tfoot>
                <b-tr>
                    <b-th style="width:80px" rowspan="1" class="text-right">HuGE Score:</b-th>
                    <b-td
                        style="width:100px;border-top: 0.25px solid;border-color:#D0D0D0;border-width:thin;background-color:#c4edc8"
                        colspan="1"
                        class="text-center"
                    >
                        <b>{{hugeScore}}</b>
                    </b-td>
                </b-tr>
            </b-tfoot>
        </b-table-simple>
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