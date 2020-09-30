<template>
    <filter-control
        :field="field"
        :type="'string'"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} = ${capitalize(filterDefinition.threshold)}`"
        :labelFormatter="capitalize"
        :options="selectionOptions"
        :color="'#28a745'"
        :multiple="!!multiple"
        :inclusive="!!inclusive">
        <slot>
        </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
import Formatter from "@/utils/formatters"
export default Vue.component('filter-enumeration-control', {
    props: ['field', 'options', 'color', 'multiple', 'inclusive'],
    components: {
        FilterControl,
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
