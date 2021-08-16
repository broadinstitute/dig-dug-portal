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
                    <div style="background: #fef8dc">{{ data.item.evidence }}</div>
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
                        <b-td style=" text-align: right; background: #fef8dc;">{{rareBF}}</b-td>
                        <b-td style="background:#fef8dc"></b-td>
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

export default Vue.component("rarevariation-not-exomesig-table", {
    props: {
        isExomeWideSignificant: {
            type: Boolean,
            required: true
        },
        exomeEvidence: {
            type: String,
            required: false
        },
        burdenAssocEvidence: {
            type: Number,
            required: false
        },
        priorVariance: {
            type: Number,
            required: false
        },

        rareBF: {
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
                {
                    pretag: "",
                    evidence: this.exomeEvidence,
                    bf: "N/A",
                    tag: "<--Exome wide Significance"
                },

                {
                    pretag: "",
                    evidence: this.burdenAssocEvidence,
                    bf: "N/A",
                    tag: "<--Burden stats"
                },

                {
                    pretag: "X",
                    evidence: this.priorVariance,
                    bf: "N/A",
                    tag: "<--Prior Allelic Variance"
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