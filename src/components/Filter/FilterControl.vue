<template>
    <div class="col" style="padding: 5px 7px 5px 7px;">
        <slot>
            <!-- e.g. P-Value (&le;) if using documentation component or override in page; but pValue as default -->
            {{field}}
        </slot>
        <!--
            Go between a select component or a simple text input based on whether or not we have options
            Note how this is separate from whether or not the filter is a multiple; the conditional for that case is irrelevant here.
        -->
        <autocomplete
            v-if="!!options && options.length > 0"
            :matches="options"
            :labelFormatter="labelFormatter"
            @item-select="updateFilter($event)"
        ></autocomplete>
        <b-form-input
            v-else
            v-model="filterThreshold"
            @keydown.enter="updateFilter(filterThreshold)"
        ></b-form-input>
    </div>
</template>

<script>
import Vue from "vue";
import Autocomplete from "@/components/Autocomplete.vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-control", {
    props: {
        value: [ String, Number ],
        field: String,
        predicate: Function,
        options: Array,
        multiple: Boolean,
        inclusive: Boolean,
        color: {
            type: String,
        },
        pillFormatter: {
            type: Function,
            default: filterDefinition => `${filterDefinition.field} = ${filterDefinition.threshold}`
        },
        labelFormatter: {
            type: Function,
            default: id => id,
        },
        splitBy: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            // 'string', 'number', 'boolean', 'object', 'function'...
        },
        clear: {
            type: Boolean,
            default: true,
        },
    },
    components: {
        Autocomplete
    },
    data() {
        return {
            filterDefinition: {
                field: this.field,
                predicate: this.predicate,
                multiple: (!!this.multiple || !!this.splitBy) ? true : false, // if undefined, default to false
                inclusive: (!!this.inclusive || !!this.splitBy) ? true : false, // if undefined, default to false. split forces this to work (because a split of multiples is redundant and ambiguous if not inclusive)
            },
            filterThreshold: this.default, // DONE: is this sensible? to synchronize with the FilterGroup we need to push up an event immediately on created... i guess not too bad, just a bit leaky.
        };
    },
    created() {
        // set initial filter value in the widget
        if (!!this.filterThreshold) {
            this.updateFilter(this.filterThreshold);
        }
    },
    methods: {
        validateInput(newInput) {
            // TODO: elaborate validation cases here
            // TODO: validation utils?
            if (!!this.type) {
                if (this.type === 'number') {
                    return !isNaN(newInput);
                } else if (typeof newInput !== this.type) {
                    return false;
                }
            }
            return true;
        },
        updateFilter(newThreshold) {
            // NOTE: Presumes existence of EventListener component in parent, which will be true in the current (09/04/20) implementation of FilterGroup
            // TODO: apply checker function here to prevent submission on conditional including blank (to allow positive filters to stay positive, for instance; or membership of options in autocomplete)
            if (newThreshold !== null) {
                const isValid = this.validateInput(newThreshold);
                if (isValid) {
                    // if the filter is a splitter (because a char to splitBy is given)
                    if (this.splitBy) {
                        newThreshold.split(',')
                            .forEach(thresholdElement =>
                                this.$parent.$parent.$emit('change', thresholdElement.trim(),
                                    { ...this.filterDefinition, pill: { label: this.pillFormatter, color: this.color } }))
                    } else {
                        // double parent since we're only using this component as a template inside of another component
                        this.$parent.$parent.$emit('change', newThreshold, { ...this.filterDefinition, pill: { label: this.pillFormatter, color: this.color } });
                    }
                } else {
                    // TODO: handle error in here, or go silent?
                    console.warn('invalid input given for type', this.type, ':', newThreshold);
                }
            }
            if (this.clear) {
                this.filterThreshold = null;
            }
        }
    }
});
</script>
