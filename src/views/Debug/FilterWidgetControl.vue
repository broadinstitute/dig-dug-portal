<template>
    <div>

        <template>
            <b-col class="filter-col-sm">
                <div class="label">
                    <slot>
                        <!-- P-Value (&le;) -->
                        {{field}} {{(op)}}
                    </slot>
                </div>
                <b-form-input
                    :ref="filterDefinition.ref"
                    :id="filterDefinition.id"
                    v-model="filterThreshold"
                    type="text"
                ></b-form-input>
            </b-col>
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
    props: ["value", "field", "op", "threshold", "options", "multiple"],
    data() {
        return {
            filterDefinition: {
                id: null,
                ref: null,
                field: this.field,
                op: this.op,
                multiple: !!this.multiple, // if undefined, default to false
            },
            filterThreshold: this.threshold, // DONE: is this sensible? to synchronize with the FilterWidget we need to push up an event immediately on created... i guess not too bad, just a bit leaky.
        };
    },
    created() {
        // TODO: are these eliminable?
        this.filterDefinition['ref'] = `select_${this.field}`
        this.filterDefinition['id'] = `filter-${this.field}`
        // set initial filter value in the widget
        if (!!this.filterThreshold) {
            this.updateFilter(this.filterThreshold);
        }
    },
    methods: {
        updateFilter(newThreshold) {
            // NOTE: Presumes existence of EventListener component in parent, which will be true in the current (09/04/20) implementation of FilterWidget
            // -? Refactor out filterModel watcher in favor for only the computed function being pushed out? 
            //    OR does the filter widget make the function and we just shunt out the spec?
            // -? Refactor out addCompound? (is it necessary over addFilter as a single?)
            this.$parent.$emit('change', 'addCompound', newThreshold, this.filterDefinition.ref, this.filterDefinition.id, !!this.multiple, this.filterDefinition);
        }
    },
    watch: {
        filterThreshold(newThreshold) {
            this.updateFilter(newThreshold);
        }
    }
});
</script>
