<template>
    <filter-control
        :field="field"
        :predicate="(string, selection) => string === selection"
        :pillFormatter="filterDefinition => `${filterDefinition.field} == ${filterDefinition.threshold}`"
        :options="options"
        :color="'#ffc107'"
        :multiple="true"
        :inclusive="inclusive"
        :splitBy="splitBy">
        <slot>
        </slot>
    </filter-control>
</template>
<script>
import Vue from "vue";
import FilterControl from "./FilterControl"
export default Vue.component('filter-multi-control', {
    props: {
        field: String,
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
        FilterControl,
    },
})
</script>
