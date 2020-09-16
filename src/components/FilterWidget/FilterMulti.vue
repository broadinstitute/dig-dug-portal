<template>
    <filter-widget-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} == ${filterDefinition.threshold}`"
        :color="color"
        :split="true">
        <slot>
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-multi-control', {
    props: ['field', 'color'],
    components: {
        FilterWidgetControl,
    },
})
</script>
