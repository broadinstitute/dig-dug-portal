<template>
    <filter-widget-control
        :field="field"
        :predicate="(number, lowerBound) => number >= lowerBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} >= ${filterDefinition.threshold}`"
        :color="'warning'"
        :multiple="false">
        <slot>
            {{field}} (&ge;)
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-greater-control', {
    props: ['field'],
    components: {
        FilterWidgetControl,
    }
})
</script>