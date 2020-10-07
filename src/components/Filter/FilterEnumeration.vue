<template>
    <filter-control
        class="filter-col-md"
        :field="field"
        :type="'string'"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} = ${labelFormatter(filterDefinition.threshold)}`"
        :labelFormatter="labelFormatter"
        :options="selectionOptions"
        :multiple="!!multiple"
        :inclusive="!!inclusive || !!multiple">
        <slot>
        </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
import Formatter from "@/utils/formatters"
import { capitalize } from "@amcharts/amcharts4/.internal/core/utils/Utils";
export default Vue.component('filter-enumeration-control', {
    props: {
        field: String,
        options: Array,
        color: String,
        multiple: {
            type: Boolean,
            default: false
        },
        inclusive: {
            type: Boolean,
            default: false,
        },
        labelFormatter: {
            type: Function,
            default: Formatter.capitalizedFormatter,
        }
    },
    components: {
        FilterControl,
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
