<template>
    <b-col class="filter-col-sm">
        <div class="label">
            <slot>
                <!-- P-Value (&le;) -->
                {{field}}
            </slot>
        </div>
        <!-- 
            Go between a select component or a simple text input based on whether or not we have options 
            Note how this is separate from whether or not the filter is a multiple; the conditional for that case is irrelevant here.
        -->
        <b-form-select
            v-if="!!options && options.length > 0"
            :options="[{ value: null, text: '' }].concat(options)"
            v-model="filterThreshold"
            @input="updateFilter(filterThreshold)"
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
    props: ["value", "field", "predicate", "default", "options", "multiple", "color", "pillFormatter"],
    data() {
        return {
            filterDefinition: {
                field: this.field,
                predicate: this.predicate,
                multiple: !!this.multiple, // if undefined, default to false
            },
            filterThreshold: this.default, // DONE: is this sensible? to synchronize with the FilterWidget we need to push up an event immediately on created... i guess not too bad, just a bit leaky.
        };
    },
    created() {
        // set initial filter value in the widget
        if (!!this.filterThreshold) {
            this.updateFilter(this.filterThreshold);
        }
    },
    methods: {
        updateFilter(newThreshold) {
            // NOTE: Presumes existence of EventListener component in parent, which will be true in the current (09/04/20) implementation of FilterWidget
            if (newThreshold !== null) {
                // double parent since we're only using this component as a template inside of another component
                this.$parent.$parent.$emit('change', newThreshold, { ...this.filterDefinition, pill: { label: this.pillFormatter, color: this.color } });
            }
            this.filterThreshold = null;
        }
    }
});
</script>
