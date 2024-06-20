<template>
    <filter-control-template
        class="filter-col-sm"
        :field="field"
        :type="'number'"
        :predicate="predicate"
        :pillFormatter="pillFormatter"
        :color="color"
        :computedField="computedField"
        :multiple="false"
    >
        <slot>{{ field }}</slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
export default Vue.component("filter-less-control", {
    props: {
        field: String,
        computedField: Function,
        predicate: {
            type: Function,
            default: (number, upperBound) => number <= upperBound,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} <= ${filterDefinition.threshold}`,
        },
        color: {
            type: String,
        },
    },
    components: {
        FilterControlTemplate,
    },
});
</script>
