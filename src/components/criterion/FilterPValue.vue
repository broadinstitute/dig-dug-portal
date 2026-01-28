<template>
    <filter-control-template
        class="filter-col-md"
        :field="field"
        :type="'number'"
        :predicate="predicate"
        :pillFormatter="pillFormatter"
        :computedField="computedField"
        :multiple="false"
        :color="color"
        :placeholder="placeholder"
    >
        <slot></slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";
import Formatter from "@/utils/formatters";
export default Vue.component("filter-pvalue-control", {
    props: {
        field: String,
        placeholder: String,
        computedField: Function,
        color: {
            type: String,
            default: "#dc3545",
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} <= ${
                    !!filterDefinition.labelFormatter
                        ? Formatter.pValueFormatter(filterDefinition.threshold)
                        : filterDefinition.threshold
                }`,
        },

        predicate: {
            type: Function,
            default: (pValue, pBound) => pValue <= pBound,
        },
    },
    components: {
        FilterControlTemplate,
    },
});
</script>
