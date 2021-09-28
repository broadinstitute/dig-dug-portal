<template>
    <div class="container">
        <div class="center">
            <b-table-simple borderless fixed small>
                <b-tbody>
                    <b-tr>
                        <b-th style="width:150px"></b-th>
                        <b-td
                            style="width:75px;background-color:#D3DBED"
                            class="text-center"
                        >{{commonBF}}</b-td>
                        <b-td
                            style="width:200px;color:gray;"
                            class="text-left"
                        ><--Common Variation BF</b-td>
                    </b-tr>
                    <b-tr style="border: 3px solid white !important;">
                        <b-th style="width:150px" rowspan="1" class="text-right">X</b-th>
                        <b-td
                            style="width:75px;background-color:#fef8dc"
                            class="text-center"
                        >{{rareBF}}</b-td>
                        <b-td style="width:200px;color:gray;" class="text-left">
                            <span
                                style="white-space: nowrap;"
                                v-if="this.exomeSignificant == false"
                            >
                                <--Rare Variation BF(
                                <a
                                    href="#"
                                    @click.prevent="$bvModal.show('exampleModal')"
                                >Reset Prior Allelic variance</a>)
                            </span>
                            <span v-else><--Rare Variation BF</span>
                            <reset-prior-widget :beta="3" :rareBF="this.rareBF"></reset-prior-widget>
                        </b-td>
                    </b-tr>
                </b-tbody>
                <!-- <hr style="padding:-20px;width:550px;text-align:right;margin-left:20px" /> -->
                <b-tfoot>
                    <b-tr>
                        <b-th
                            style="width:150px;white-space: nowrap;"
                            rowspan="1"
                            class="text-right"
                        >HuGE Score:</b-th>
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
    </div>
</template>





<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Autocomplete from "@/components/Autocomplete.vue";
import ResetPriorWidget from "@/components/ResetPriorWidget.vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { match } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import $ from "jquery";
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
        },
        exomeSignificant: {
            type: Boolean,
            required: true,
            default: false
        }
    },

    data() {
        return {
            modalShow: false
        };
    },
    computed: {
        hugescore() {
            return this.hugeScore;
        }
    },
    methods: {
        handleOk(bvModalEvt) {
            // Prevent modal from closing
            bvModalEvt.preventDefault();
            // Trigger submit handler
            this.handleSubmit();
        },
        handleSubmit() {
            // Exit when the form isn't valid
            if (!this.checkFormValidity()) {
                return;
            }
            // Push the name to submitted names
            this.submittedNames.push(this.name);
            // Hide the modal manually
            this.$nextTick(() => {
                this.$bvModal.hide("modal-prevent-closing");
            });
        }
        // showModal() {
        //     let element = this.$refs.modal.$el;
        //     $(element).modal("show");
        // }
    }
});
</script>

<style>
.hidden_header {
    display: none;
}
#modal-title {
    color: #af5934;
    font-size: 15px;
    font-weight: bold;
}
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
}
</style>