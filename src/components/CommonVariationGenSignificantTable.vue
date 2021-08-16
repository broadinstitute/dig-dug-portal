<template>
    <div>
        <div>
            <b-table
                fixed
                borderless
                small
                thead-class="hidden_header"
                :items="items"
                :fields="fields"
                responsive="sm"
            >
                <template #cell(evidence)="data">
                    <div style="background: #E7EDF7">{{ data.item.evidence }}</div>
                </template>
                <template #cell(tag)="data">
                    <div style="color:gray">{{ data.item.tag }}</div>
                </template>

                <template #cell(bf)="data">
                    <div style="background: #DFDBDA">{{ data.item.bf }}</div>
                </template>
                <template v-slot:custom-foot="data">
                    <b-tr>
                        <b-td style="text-align: right; font-weight:bold">Bayes Factor:</b-td>
                        <b-td style=" text-align: right; background: #E7EDF7;">{{commonBF}}</b-td>
                        <b-td style="background:#E7EDF7"></b-td>
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

export default Vue.component("commonvariation-genomesig-table", {
    props: {
        isGenomeWideSignificant: {
            type: Boolean,
            required: true
        },
        gwasEvidence: {
            type: String,
            required: false
        },
        regulatoryEvidence: {
            type: String,
            required: false
        },
        codingEvidence: {
            type: String,
            required: false
        },
        commonBF: {
            type: Number,
            required: true,
            default: 1
        }
    },

    data() {
        return {
            fields: [
                { key: "pretag", tdClass: "text-right" },
                { key: "evidence", tdClass: "text-center" },
                { key: "bf", tdClass: "text-center" },
                { key: "tag", tdClass: "text-left" }
            ],
            items: [
                // {
                //     pretag: "",
                //     evidence: "Yes",
                //     bf: "No",
                //     tag: ""
                // },
                {
                    pretag: "",
                    evidence: this.gwasEvidence,
                    bf: "N/A",
                    tag: "<--GWAS Evidence"
                },
                {
                    pretag: "",
                    evidence: this.codingEvidence,
                    bf: "N/A",
                    tag: "<--Coding Evidence"
                },
                {
                    pretag: "X",
                    evidence: this.regulatoryEvidence,
                    bf: "N/A",
                    tag: "<--Regulatory Evidence"
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