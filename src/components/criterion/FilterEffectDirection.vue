<template>
    <filter-control-template
        class="filter-col-sm"
        :field="field"
        :type="'string'"
        :predicate="predicate"
        :labelFormatter="labelFormatter"
        :pillFormatter="pillFormatter"
        :options="options"
        @input-change="$emit('input-change', $event)"
        :multiple="false"
        :computedField="computedField"
        :color="color"
        :placeholder="placeholder"
    >
        <slot></slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-effect-direction-control", {
    props: {
        field: String,
        placeholder: String,
        computedField: Function,
        color: {
            type: String,
            default: "#007bff",
        },
        options: {
            type: Array,
            default: () => ["positive", "negative"],
        },
        labelFormatter: {
            type: Function,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${
                    !!filterDefinition.labelFormatter
                        ? `effect size ${filterDefinition.threshold}`
                        : filterDefinition.threshold
                }`,
        },
        predicate: {
            type: Function,
            default: (beta, direction) => {
                if (direction === "positive") {
                    return Math.sign(beta) === 1;
                } else if (direction === "negative") {
                    return Math.sign(beta) === -1;
                }
            },
        },
    },
    components: {
        FilterControlTemplate,
    },
});
</script>
