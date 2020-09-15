<template>
    <filter-widget-control
        :field="field"
        :predicate="(number, upperBound) => number <= upperBound"
        :pillFormatter="filterDefinition => `${filterDefinition.field} <= ${filterDefinition.threshold}`"
        :color="!!this.color ? this.color : '#ffc107'"
        :multiple="false">
        <slot>
            {{field}} (&le;)
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-less-control', {
    props: ['field', 'color'],
    components: {
        FilterWidgetControl,
    }
})
</script>
