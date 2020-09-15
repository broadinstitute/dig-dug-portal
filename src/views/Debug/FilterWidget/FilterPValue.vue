<template>
    <filter-widget-control
        :field="field"
        :predicate="(pValue, pBound) => pValue <= pBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} <= ${filterDefinition.threshold}`"
        :color="!!this.color ? this.color : '#ffc107'"
        :multiple="false">
        <slot>
            P-Value (&le;)
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-pvalue-control', {
    props: ['field', 'color'],
    components: {
        FilterWidgetControl,
    }
})
</script>
