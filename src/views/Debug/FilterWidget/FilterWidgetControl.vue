<template>
    <b-col class="filter-col-sm">
        <div class="label">
            <slot>
                <!-- P-Value (&le;) -->
                {{field}} ({{(op)}})
            </slot>
        </div>
        <!-- 
            Go between a select component or a simple text input based on whether or not we have options 
            Note how this is separate from whether or not the filter is a multiple; the conditional for that case is irrelevant here.
        -->
        <!-- TODO: replace with an autocomplete to eliminate this conditional logic? -->
        <b-form-select
            v-if="!!options && options.length > 0"
            v-model="filterThreshold"
            @input="updateFilter(filterThreshold)"
            :options="[{ value: null, text: '' }].concat(options)"
        ></b-form-select>
        <b-form-input
            v-else
            v-model="filterThreshold"
            @keydown.enter="updateFilter(filterThreshold)"
        ></b-form-input>     
    </b-col>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-widget-control", {
    props: ["value", "field", "op", "threshold", "options", "multiple"],
    data() {
        return {
            filterDefinition: {
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
            if (newThreshold !== null) {
                this.$parent.$emit('change', newThreshold, this.filterDefinition);
            }
            this.filterThreshold = null;
        }
    }
});
</script>
