<template>
    <!-- Modal -->
    <b-modal
        header-class="my-header-class"
        v-model="show"
        class="modal fade"
        id="exampleModal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
    >
        <template #modal-header>
            <div class="w-100">
                <p style="float-center">Rare Variation</p>
            </div>
        </template>

        <b-table-simple borderless fixed small responsive>
            <b-tbody>
                <b-tr>
                    <b-th style="width:100px"></b-th>
                    <b-td style="width:150px;background-color:#fef8dc" class="text-center">3.36</b-td>
                    <b-td
                        style="width:200px;color:gray;"
                        class="text-left"
                    ><--Burden Association Summary Statistics</b-td>
                </b-tr>
                <b-tr>
                    <b-th style="width:100px" rowspan="1" class="text-right">X</b-th>
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
                    ><--Prior Allelic Variance</b-td>
                </b-tr>
            </b-tbody>
            <!-- <hr style="padding:-20px;width:550px;text-align:right;margin-left:20px" /> -->
            <b-tfoot>
                <b-tr>
                    <b-th style="width:100px" rowspan="1" class="text-right">Bayes Factor:</b-th>
                    <b-td
                        style="width:100px;border-top: 0.25px solid;border-color:#D0D0D0;border-width:thin;background-color:#fef8dc"
                        colspan="1"
                        class="text-center"
                    >
                        <b>1.26</b>
                    </b-td>
                </b-tr>
            </b-tfoot>
        </b-table-simple>

        <template #modal-footer>
            <div class="w-100">
                <b-button variant="primary" size="sm" class="float-right" @click="show=false">Close</b-button>
            </div>
        </template>
    </b-modal>
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

export default Vue.component("reset-prior-widget", {
    props: {
        beta: {
            type: Number,
            required: true,
            default: 1
        },
        rareBF: {
            type: Number,
            required: true,
            default: 1
        }
    },

    data() {
        return {
            show: false,
            variants: [
                "primary",
                "secondary",
                "success",
                "warning",
                "danger",
                "info",
                "light",
                "dark"
            ],
            headerBgVariant: "dark",
            headerTextVariant: "light",
            bodyBgVariant: "light",
            bodyTextVariant: "dark",
            footerBgVariant: "warning",
            footerTextVariant: "dark",
            submittedNames: [],
            name: "",
            nameState: null
        };
    },
    computed: {},
    methods: {
        checkFormValidity() {
            const valid = this.$refs.form.checkValidity();
            this.nameState = valid;
            return valid;
        },
        resetPriorAllelicVariance() {
            console.log("reset prior clicked");
        },
        handleSubmit() {
            // Exit when the form isn't valid
            if (!this.checkFormValidity()) {
                return;
            }
            // Push the name to submitted names
            this.submittedNames.push(this.name);
            console.log(this.submittedNames);
            // Hide the modal manually
            this.$nextTick(() => {
                this.$bvModal.hide("modal-prevent-closing");
            });
        }
    }
});
</script>

<style scoped>
.hidden_header {
    display: none;
}

my-header-class {
    color: #af5934;
    font-size: 15px;
    font-weight: bold;
}
</style>