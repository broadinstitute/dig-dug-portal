<template>
    <filter-widget-control
        :field="field"
        :type="'number'"
        :predicate="(pValue, pBound) => pValue <= pBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} <= ${pValueFormatter(filterDefinition.threshold)}`"
        :color="'#dc3545'"
        :multiple="false">
        <slot></slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
import Formatter from "@/utils/formatters"
export default Vue.component('filter-pvalue-control', {
    props: ['field'],
    components: {
        FilterWidgetControl,
    },
    methods: {
        pValueFormatter: Formatter.pValueFormatter
    }
})
</script>
