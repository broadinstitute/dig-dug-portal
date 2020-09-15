<template>
    <filter-widget-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} = ${capitalize(filterDefinition.threshold)}`"
        :labelFormatter="capitalize"
        :options="options"
        :color="!!this.color ? this.color : '#ffc107'"
        :multiple="false">
        <slot>
            Match
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
import Formatter from "@/utils/formatters";

export default Vue.component('filter-enumeration-control', {
    props: ['field', 'options', 'color'],
    components: {
        FilterWidgetControl,
    },
    methods: {
        capitalize: Formatter.capitalizedFormatter,
    }
})
</script>
