<template>
    <filter-widget-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} == ${filterDefinition.threshold}`"
        :options="options"
        :color="color"
        :multiple="true"
        :inclusive="inclusive"
        :splitBy="splitBy">
        <slot>
        </slot>
    </filter-widget-control>
</template>
<script>
import Vue from "vue";
import FilterWidgetControl from "./FilterWidgetControl"
export default Vue.component('filter-multi-control', {
    props: {
        field: String,
        color: String,
        options: {
            type: Array,
            required: false,
        },
        splitBy: String,
        inclusive: {
            type: Boolean,
            default: true,
        }
    },
    components: {
        FilterWidgetControl,
    },
})
</script>
