<template>
    <filter-control-template
        class="filter-col-sm"
        :field="fieldMin"
        :type="'number'"
        :predicate="predicateLower"
        :pillFormatter="pillFormatterLower"
        :placeholder="placeholder"
        :color="color"
        :computedField="computedField"
        :inclusive="true"
    >
        <slot>{{ fieldMin }}</slot>
    </filter-control-template>
    <filter-control-template
        class="filter-col-sm"
        :field="fieldMax"
        :type="'number'"
        :predicate="predicateUpper"
        :pillFormatter="pillFormatterUpper"
        :placeholder="placeholder"
        :color="color"
        :computedField="computedField"
        :inclusive="true"
    >
        <slot>{{ fieldMax }}</slot>
    </filter-control-template>
    
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-range", {
    props: {
        field: String,
        computedField: Function,
        predicateLower: {
            type: Function,
            default: (number, lowerBound) => number >= lowerBound
        },
        predicateUpper: {
            type: Function,
            default: (number, upperBound) => number <= upperBound
        },
        pillFormatterLower: {
            type: Function,
            default: filterDefinition =>
                `${filterDefinition.field} ≥ ${filterDefinition.threshold}`
        },
        pillFormatterUpper: {
            type: Function,
            default: filterDefinition =>
                `${filterDefinition.field} <= ${filterDefinition.threshold}`
        },
        color: {
            type: String
        },
        placeholder: String
    },
    components: {
        FilterControlTemplate
    }
});
</script>
