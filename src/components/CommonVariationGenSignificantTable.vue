<template>
    <div>
        <b-table-simple borderless fixed small responsive>
            <b-tbody>
                <b-tr>
                    <b-th style="width:70px"></b-th>
                    
                    <b-td style="width:150px;" class="text-center">
                        <span
                            style="padding-left: 8px; padding-right: 8px;border-radius:20px; background: #254CA6; color:white;"
                        >Yes</span>
                    </b-td>
                    <b-td style="width:150px;color:gray" class="text-center">No</b-td>
                    <b-td style="width:200px;" class="text-left"></b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:70px"></b-th>
                    <b-td
                        style="width:150px;background-color:#E7EDF7"
                        class="text-center"
                    >{{gwasEvidence}}</b-td>
                    <b-td style="width:150px;color:gray;background-color:#F5F5F5">N/A</b-td>
                    <b-td style="width:200px;color:gray;" class="text-left"><--GWAS Evidence</b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:70px"></b-th>
                    <b-td
                        style="width:150px;background-color:#E7EDF7"
                        class="text-center"
                    >{{codingEvidence}}</b-td>
                    <b-td style="width:150px;" class="text-center"></b-td>
                    <b-td style="width:200px;color:gray;" class="text-left"><--Coding Evidence</b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:70px" rowspan="1" class="text-right">X</b-th>
                    <b-td
                        style="width:150px;color:gray;background-color:#F5F5F5"
                        class="text-center"
                    >N/A</b-td>
                    <b-td style="width:150px;" class="text-center">{{regulatoryEvidence}}</b-td>
                    <b-td style="width:200px;color:gray;" class="text-left"><--Regulatory Evidence</b-td>
                </b-tr>
            </b-tbody>
            <!-- <hr style="padding:-20px;width:550px;text-align:right;margin-left:20px" /> -->
            <b-tfoot>
                <b-tr>
                    <b-th style="width:80px" rowspan="1" class="text-right">Bayes Factor:</b-th>
                    <b-td
                        style="width:100px;border-top: 0.25px solid;border-color:#D0D0D0;border-width:thin;background-color:#fef8dc"
                        colspan="2"
                        class="text-center"
                    >
                        <b>{{commonBF}}</b>
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