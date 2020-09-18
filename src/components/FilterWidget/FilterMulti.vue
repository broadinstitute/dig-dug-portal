<template>
    <filter-widget-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} == ${filterDefinition.threshold}`"
        :options="options"
        :color="color"
        :split="true"
        :inclusive="true">
        <slot>
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-multi-control', {
    props: ['field', 'color', 'options'],
    components: {
        FilterWidgetControl,
    },
})
</script>
