<template>
    <filter-control
        :field="field"
        :type="'number'"
        :predicate="(pValue, pBound) => pValue <= pBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} <= ${pValueFormatter(filterDefinition.threshold)}`"
        :color="'#dc3545'"
        :multiple="false">
        <slot></slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
import Formatter from "@/utils/formatters"
export default Vue.component('filter-pvalue-control', {
    props: ['field'],
    components: {
        FilterControl,
    },
    methods: {
        pValueFormatter: Formatter.pValueFormatter
    }
})
</script>
