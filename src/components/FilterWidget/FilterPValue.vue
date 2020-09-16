<template>
    <filter-widget-control
        :field="field"
        :predicate="(pValue, pBound) => pValue <= pBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} <= ${pValueFormatter(filterDefinition.threshold)}`"
        :color="color"
        :multiple="false">
        <slot>
            P-Value (&le;)
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
import Formatter from "@/utils/formatters"
export default Vue.component('filter-pvalue-control', {
    props: ['field', 'color'],
    components: {
        FilterWidgetControl,
    },
    methods: {
        pValueFormatter: Formatter.pValueFormatter
    }
})
</script>
