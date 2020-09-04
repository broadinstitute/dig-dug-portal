<template>
    <div>
        <!-- Controls and their labels -->
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col class="filter-col-sm">
                    <div class="label">P-Value (&le;)</div>
                    <b-form-input
                        id="filter-pValue"
                        type="text"
                        v-model="select_pValue_text"
                        @change="addCompound($event, 'select_pValue','filter-pValue', false)"
                        ref="select_pValue"
                    ></b-form-input>
                </b-col>
                <b-col class="filter-col-sm">
                    <div class="label">Effect</div>
                    <b-form-select
                        id="filter-beta"
                        @input="addCompound($event, 'select_beta','filter-beta', false)"
                        :options="select_beta_options"
                        ref="select_beta"
                        v-model="select_beta"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>

        <!-- Pills for everything -->
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row v-if="select_pValue || select_beta">
                <b-col>

                    <span>Selected Filters:&nbsp;&nbsp;</span>
                    <!-- Derive this from current filter state?
                         Might lose coloring - unless we use something like my planned colorUtils with real-time schema generation on a cycle
                         It would be deterministic upto the compile-time declaration of the FilterWidget controls which would lead to predicatable results at runtime
                     -->
                    <template v-if="select_pValue.length > 0">
                        <b-badge
                            pill
                            variant="danger"
                            @click="unsetFilter('select_pValue')"
                            class="btn">
                            {{select_pValue}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>

                    <template v-if="select_beta">
                        <b-badge
                            pill
                            variant="primary"
                            @click="unsetFilter('select_beta')"
                            class="btn">
                            {{select_beta_options.find(e => e.value === select_beta).text}}
                            <span
                                class="remove"
                            >X</span>
                        </b-badge>
                    </template>

                </b-col>
            </b-row>
        </b-container>
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

// TODO: Define a reducer or reducer-like object (a filter interaction and creation protocol) that can be used with 
// filter-widget-controls (as children!) as well as derived/computed pills
// first thing is that for each filter-wiget-control, it needs a corresponding item in a object so it can be dynamically referenced in the template (as well as the component methods)
// could define the child component it in here for file cohesion (although that disobeys convention that one component = one file)
// ditto with the event-listener component on the slot

export default Vue.component("filter-widget", {
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
