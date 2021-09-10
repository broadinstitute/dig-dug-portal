<template>
    <div>
        <b-table-simple borderless fixed small>
            <b-tbody>
                <b-tr>
                    <b-td
                        style="width:50px;background-color:#E7EDF7"
                        class="text-center"
                    >{{commonBF}}</b-td>
                    <b-td style="width:25px;" class="text-center">X</b-td>
                    <b-td style="width:50px;background-color:#fef8dc" class="text-center">{{rareBF}}</b-td>
                    <b-td style="width:25px;" class="text-center">=</b-td>
                    <b-td
                        style="width:50px;background-color:#c4edc8"
                        class="text-center"
                    >{{combinedBF}}</b-td>
                    <b-td style="width:75px;" class="text-left"><-- HuGE Score</b-td>
                </b-tr>
            </b-tbody>
            <!-- <hr style="padding:-20px;width:550px;text-align:right;margin-left:20px" /> -->
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

export default Vue.component("genepage-combinedevidence-table", {
    props: {
        commonBF: {
            type: Number,
            required: false,
            default: 1
        },
        combinedBF: {
            type: Number,
            required: false,
            default: 1
        },

        rareBF: {
            type: Number,
            required: false,
            default: 1
        }
    },

    data() {
        return {
            fields: [],
            items: [],
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