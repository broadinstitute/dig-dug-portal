<template>
    <div>
        <b-table-simple borderless fixed small responsive>
            <b-tbody>
                <b-tr>
                    <b-th style="width:70px"></b-th>
                    <b-td style="width:150px;color:gray" class="text-center">Yes</b-td>
                    <b-td style="width:150px;" class="text-center">
                        <span
                            style="padding-left: 8px; padding-right: 8px;border-radius:20px; background: #af5934; color:white;"
                        >No</span>
                    </b-td>
                    <b-td style="width:200px;" class="text-left"></b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:70px"></b-th>
                    <b-td
                        style="width:150px;color:gray;background-color:#F5F5F5"
                        class="text-center"
                    >N/A</b-td>
                    <b-td style="width:150px;"></b-td>
                    <b-td
                        style="width:200px;color:gray;"
                        class="text-left"
                    ><--Exome wide Significance</b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:70px"></b-th>
                    <b-td style="width:150px;color:gray" class="text-center">N/A</b-td>
                    <b-td style="width:150px;background-color:#fef8dc" class="text-center">3.36</b-td>

                    <b-td
                        style="width:200px;color:gray;"
                        class="text-left"
                    ><--Burden statistic Association</b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:70px" rowspan="1" class="text-right">X</b-th>
                    <b-td style="width:150px;" class="text-center"></b-td>
                    <b-td style="width:150px;" class="text-center">
                        <input
                            style="background-color:#fef8dc;width:100%"
                            v-model.number="$store.state.prior"
                            type="number"
                            placeholder="Prior Variance"
                            id="prior_variance_input"
                        />
                    </b-td>
                    <b-td
                        style="width:200px;color:gray;"
                        class="text-left"
                    ><--Prior Allelic variance</b-td>
                </b-tr>
            </b-tbody>
            <!-- <hr style="padding:-20px;width:550px;text-align:right;margin-left:20px" /> -->
            <b-tfoot>
                <b-tr
                    style="width:100px;border-top: 0.25px solid;border-color:#D0D0D0;border-width:thin"
                >
                    <b-th style="width:80px" rowspan="1" class="text-right">Bayes Factor:</b-th>
                    <b-td colspan="2" style="background-color:#fef8dc" class="text-center">
                        <b>{{rareBF}}</b>
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

export default Vue.component("rarevariation-not-exomesig-table-new", {
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