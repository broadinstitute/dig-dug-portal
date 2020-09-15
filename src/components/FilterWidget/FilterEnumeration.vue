<template>
    <filter-widget-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} = ${filterDefinition.threshold}`"
        :options="options"
        :color="'warning'"
        :multiple="true">
        <slot>
            Match
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-enumeration-control', {
    props: ['field', 'options'],
    components: {
        FilterWidgetControl,
    }
})
</script>