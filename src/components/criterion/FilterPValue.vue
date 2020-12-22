<template>
    <filter-control-template
        class="filter-col-sm"
        :field="field"
        :type="'number'"
        :predicate="(pValue, pBound) => pValue <= pBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} <= ${pValueFormatter(filterDefinition.threshold)}`"
        :multiple="false">
        <slot></slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate"
import Formatter from "@/utils/formatters"
export default Vue.component('filter-pvalue-control', {
    props: ['field'],
    components: {
        FilterControlTemplate,
    },
    methods: {
        pValueFormatter: Formatter.pValueFormatter
    }
})
</script>
