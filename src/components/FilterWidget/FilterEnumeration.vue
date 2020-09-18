<template>
    <filter-widget-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} = ${capitalize(filterDefinition.threshold)}`"
        :labelFormatter="capitalize"
        :options="selectionOptions"
        :color="color"
        :multiple="false">
        <slot>
            Match
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
import Formatter from "@/utils/formatters"
export default Vue.component('filter-enumeration-control', {
    props: ['field', 'options', 'color'],
    components: {
        FilterWidgetControl,
    },
    methods: {
        capitalize: Formatter.capitalizedFormatter,
    },
    computed: {
        // Make options unique and sorted by default, and always
        // NOTE: Assumes that they are just strings! change?
        selectionOptions() {
            return this.options
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter(v => v != undefined)
                .sort()
        }
    }
})
</script>
