<template>
    <div class="col" style="padding: 5px 7px 5px 7px">
            <!-- e.g. P-Value (&le;) if using documentation component or override in page; but pValue as default -->
            <slot>{{ field }}</slot>
        <!--
            Go between a select component or a simple text input based on whether or not we have options
            Note how this is separate from whether or not the filter is a multiple; the conditional for that case is irrelevant here.
        -->
        <numeric-range-filter
                :columnName="field"
                :displayLabel="field"
                :values="cleanupValues"
                :totalRowCount="cleanupValues.length"
                :value="presetRange"

            ></numeric-range-filter>
    </div>
</template>

<script>
import Vue from "vue";
import DualSlider from "./DualSlider.vue";
import NumericRangeFilter from "../views/Donors/NumericRangeFilter.vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-slider-template", {
    props: {
        value: Object,
        field: String,
        values: Array,
        label: String,
        placeholder: String,
        predicate: Function,
        color: {
            type: String,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} = ${filterDefinition.threshold}`,
        },
        labelFormatter: {
            type: Function,
            default: (id) => id,
        },
        splitBy: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            // 'string', 'number', 'boolean', 'object', 'function'...
        },
        clear: {
            type: Boolean,
            default: true,
        },
        disabled: Boolean,
        // called "computedField" instead of "computed" to prevent terminology collisions
        computedField: Function,
        presets: Array
    },
    components: {
        DualSlider,
        NumericRangeFilter
    },
    data() {
        return {
            filterDefinition: {
                field: this.field,
                placeholder: this.placeholder,
                label: this.pillFormatter,
                pillFormatter: this.pillFormatter,
                labelFormatter: this.labelFormatter,
                color: this.color,
                predicate: this.predicate,
                multiple: !!this.multiple || !!this.splitBy ? true : false, // if undefined, default to false
                inclusive: !!this.inclusive || !!this.splitBy ? true : false, // if undefined, default to false. split forces this to work (because a split of multiples is redundant and ambiguous if not inclusive)
                computedField: this.computedField,
            },
            filterThreshold: this.default,
            presetRange: null
        };
    },
    created() {
        // set initial filter value in the widget
        if (this.presets.length > 0){
            let preset = this.presets.find(p => p.name === this.field);
            if (preset !== undefined){
                this.filterThreshold = [preset.min, preset.max];
                this.presetRange = preset;
                this.updateFilter(this.filterThreshold);
            }
        }
    },
    mounted() {
        this.$parent.$parent.$emit('filter-mounted', this.filterDefinition);
    },
    computed:{
        cleanupValues(){
            console.log(this.field);
            console.log("In : ", JSON.stringify(this.values));
            let output = this.values.filter(v => !isNaN(v));
            console.log("Out: ", JSON.stringify(output));
            return output;
        }
    },
    methods: {
        validateInput(newInput) {
            // TODO: elaborate validation cases here
            // TODO: validation utils?
            if (!!this.type) {
                if (this.type === "number") {
                    return !isNaN(newInput[0]) && !isNaN(newInput[1]);
                } else if (typeof newInput !== this.type) {
                    return false;
                }
            }
            return true;
        },
        updateFilter(newThreshold) {
            let newMin = newThreshold[0];
            let newMax = newThreshold[1];
            // NOTE: Presumes existence of EventListener component in parent, which will be true in the current (09/04/20) implementation of CriterionGroupTemplate
            // TODO: apply checker function here to prevent submission on conditional including blank (to allow positive filters to stay positive, for instance; or membership of options in autocomplete)
            if (newThreshold !== null) {
                const isValid = this.validateInput(newThreshold);
                if (isValid) {
                    // double parent since we're only using this component as a template inside of another component
                        this.$parent.$parent.$emit("change", newThreshold, {
                            // label: this.pillFormatter,
                            // color: this.color,
                            ...this.filterDefinition,
                        });
                } else {
                    // TODO: handle error in here, or go silent?
                    console.warn(
                        "invalid input given for type",
                        this.type,
                        ":",
                        newThreshold
                    );
                }
            }
            if (this.clear) {
                this.filterThreshold = null;
            }
        },
    },
});
</script>
<style scoped>
    .col {
        vertical-align: text-top;
    }
    .format-fix-textfield{
        display: block;
    }
</style>
