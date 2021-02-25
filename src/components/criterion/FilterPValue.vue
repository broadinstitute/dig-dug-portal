<template>
    <filter-control-template
        class="filter-col-sm"
        :field="field"
        :type="'number'"
        :predicate="predicate"
        :pillFormatter="pillFormatter"
        :multiple="false">
        <slot></slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate"
import Formatter from "@/utils/formatters"
export default Vue.component('filter-pvalue-control', {
    props: {
        field: String,
        pillFormatter: {
            type: Function,
            default: filterDefinition => `${filterDefinition.field} <= ${Formatter.pValueFormatter(filterDefinition.threshold)}`
        },
        predicate: {
            type: Function,
            default: (pValue, pBound) => pValue <= pBound
        }
    },
    components: {
        FilterControlTemplate,
    },
})
</script>
