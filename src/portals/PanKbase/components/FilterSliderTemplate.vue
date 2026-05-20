<template>
    <div>
            <!-- e.g. P-Value (&le;) if using documentation component or override in page; but pValue as default -->
            <!-- <slot>{{ field }}</slot> -->
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
                :customStep="customStep"
                @input="e => updateFilter(e)"

            ></numeric-range-filter>
    </div>
</template>

<script>
import Vue from "vue";
import NumericRangeFilter from "../views/Donors/NumericRangeFilter.vue";
import { parseNumericValue } from "../views/Donors/datasetUtils";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { isNull } from "lodash";

export default Vue.component("filter-slider-template", {
    props: {
        value: Object,
        field: String,
        values: Array,
        label: String,
        placeholder: String,
        predicate: {
            type: Function,
            default: (item, threshold) => threshold.includeMissing || (item >= threshold.min && item <= threshold.max),
        },
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
        disabled: Boolean,
        // called "computedField" instead of "computed" to prevent terminology collisions
        computedField: Function,
        presets: Array,
        customStep: Number
    },
    components: {
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
            presetRange: null,
            cleanupValues: [],
            overallMin: null,
            overallMax: null,
        };
    },
    created() {
        // set initial filter value in the widget
        if (this.presets.length > 0){
            let preset = this.presets.find(p => p.name === this.field);
            if (preset !== undefined){
                console.log(JSON.stringify(preset));
                this.presetRange = preset;
                this.updateFilter(preset);
            }
        }
    },
    mounted() {
        this.cleanupValues = this.cleanValues(this.values);
        this.overallMin = this.cleanupValues[0];
        this.overallMax = this.cleanupValues[this.cleanupValues.length -1];
        this.$parent.$parent.$emit('filter-mounted', this.filterDefinition);
    },
    methods: {
        cleanValues(vals){
            let output = vals.map(v => parseNumericValue(v))
                .filter(v => !isNull(v));
            return output.sort((left, right) => left - right);
        },
        updateFilter(newThreshold) {
            // TODO apply checking logic to include all including missing data if filters are set to min and max

            // NOTE: Presumes existence of EventListener component in parent, which will be true in the current (09/04/20) implementation of CriterionGroupTemplate
            // TODO: apply checker function here to prevent submission on conditional including blank (to allow positive filters to stay positive, for instance; or membership of options in autocomplete)
            if (newThreshold !== null) {
                let includeMissing = 
                    newThreshold.min === this.overallMin 
                    && newThreshold.max === this.overallMax;
                newThreshold.includeMissing = includeMissing;
                this.$parent.$parent.$emit("change", newThreshold, {
                        // label: this.pillFormatter,
                        // color: this.color,
                        ...this.filterDefinition,
                    });
            }
        },
    },
});
</script>