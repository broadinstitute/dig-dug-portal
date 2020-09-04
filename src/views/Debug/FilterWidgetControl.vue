<template>
    <div>

        <template slot="control">
            <b-col class="filter-col-sm">
                <div class="label">P-Value (&le;)</div>
                <!-- <b-form-input
                    id="filter-pValue"
                    type="text"
                    v-model="select_pValue_text"
                    @change="addCompound($event, 'select_pValue','filter-pValue', false)"
                    ref="select_pValue"
                ></b-form-input> -->
            </b-col>
        </template>

        <template slot="pill">
            This is a pill
            <!-- <template v-if="select_pValue.length > 0">
                <b-badge
                    pill
                    variant="danger"
                    @click="unsetFilter('select_pValue')"
                    class="btn">
                    {{select_pValue}}
                    <span class="remove">X</span>
                </b-badge>
            </template> -->
        </template>

    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-widget-control", {
    props: ["value"],
    data() {
        return {
            // TODO: These need to be dynamically registered or collected
            // For collection, use slot scopes for modifying a shared object on event binding?
            select_pValue: "",
            select_pValue_text: "",
            select_beta: "",
            select_beta_options: [
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" },
            ],
        };
    },
    computed: {
        filterString() {
            return `${this.select_pValue}, ${this.select_beta}`
        },
    },

    methods: {
        addFilter(event, obj) {
            //console.log("add" + event);
            this[obj].push(event.trim());
            this[obj + "_text"] = "";
        },
        setFilter(event, obj) {
            this[obj] = event;
            this[obj + "_text"] = "";
        },
        removeFilter(index, obj) {
            this[obj].splice(index, 1);
        },
        unsetFilter(obj) {
            this[obj] = "";
        },
        addSingle(event, obj) {
            this.addFilter(event, obj);
            this.clearCompound();
        },
        addCompound(event, obj, id, multiple = true) {
            if (multiple) this.addFilter(event, obj);
            else this.setFilter(event, obj);

            let element = document.getElementById(id);
            element.value = "";
        },

        clearCompound() {
            // These need to be made generic
            this.select_consequence = [];
            this.select_gene = [];
            this.select_pValue = "";
            this.select_beta = "";
        },
    },
    watch: {
        filterString(newFilterString) {
            this.$emit('input', newFilterString)
        }
    }
});
</script>
